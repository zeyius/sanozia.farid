import { supabase } from '../../../lib/supabase';
import { logger } from '../../../shared/utils/logger';
import type { OnboardingData } from '../types';
import type { Database } from '../../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type Treatment = Database['public']['Tables']['treatments']['Row'];
type TreatmentInsert = Database['public']['Tables']['treatments']['Insert'];
// Custom types for questionnaire (table may not exist in current schema)

export interface QuestionnaireResponse {
  question1: string; // Localisation des symptômes
  question2: string; // Étendue de l'atteinte
  question3: string; // Présence de sang
  question4: string; // Urgence défécatoire
  question5: string; // Fréquence des selles
  question6: string; // Douleurs abdominales
  question7: string; // Réponse au traitement
  question8: string; // Évolution récente
}

export interface SignatureResult {
  signature: string;
  confidence: number;
  description: string;
}

export class OnboardingService {
  async createProfile(profileData: Omit<OnboardingData, 'treatments'> & { is_profile_complete: boolean }): Promise<Profile> {
    try {
      logger.debug('🏗️ [Onboarding] Création du profil utilisateur', { profileData });
      
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const insertData: Omit<ProfileInsert, 'user_id'> = {
        name: profileData.name,
        diagnosis: profileData.diagnosis || 'aucune',
        is_profile_complete: profileData.is_profile_complete,
        // Ajouter le catalogue de symptômes par défaut
        symptom_catalog: [
          { key: 'abdominal_pain', label: 'Douleur abdominale', icon: 'User', enabled: true, order: 1 },
          { key: 'bloating', label: 'Ballonnements', icon: 'Wind', enabled: true, order: 2 },
          { key: 'joint_pain', label: 'Douleur articulaire', icon: 'Zap', enabled: true, order: 3 },
          { key: 'fatigue', label: 'Fatigue', icon: 'Frown', enabled: true, order: 4 },
          { key: 'stress', label: 'Stress', icon: 'Brain', enabled: true, order: 5 },
        ] as any
      };

      // Only add optional fields if they have values
      if (profileData.birth_date) {
        insertData.birth_date = profileData.birth_date;
      }
      if (profileData.gender) {
        insertData.gender = profileData.gender;
      }
      if (profileData.rectocolite_signature) {
        insertData.rectocolite_signature = profileData.rectocolite_signature;
      }
      // TODO: Add calprotectin fields when DB schema is updated
      // if (profileData.last_calprotectin_value) {
      //   insertData.last_calprotectin_value = parseInt(profileData.last_calprotectin_value);
      // }
      // if (profileData.last_calprotectin_date) {
      //   insertData.last_calprotectin_date = profileData.last_calprotectin_date;
      // }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...insertData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ [Onboarding] Erreur création profil', { error: error.message, code: error.code });
        throw error;
      }

      logger.info('✅ [Onboarding] Profil créé avec succès', { profileId: data.id });
      return data;
    } catch (error) {
      logger.error('❌ [Onboarding] Erreur lors de la création du profil', error);
      throw error;
    }
  }

  async addTreatment(treatmentData: { name: string }): Promise<Treatment> {
    try {
      logger.debug('💊 [Onboarding] Ajout traitement', { treatmentData });
      
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // First get the user's profile to get profile_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profil utilisateur non trouvé');
      }

      const insertData: Omit<TreatmentInsert, 'profile_id'> = {
        name: treatmentData.name,
        is_active: true
      };

      const { data, error } = await supabase
        .from('treatments')
        .insert({
          ...insertData,
          profile_id: profile.id
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ [Onboarding] Erreur ajout traitement', { error: error.message, code: error.code });
        throw error;
      }

      logger.info('✅ [Onboarding] Traitement ajouté avec succès', { treatmentId: data.id });
      return data;
    } catch (error) {
      logger.error('❌ [Onboarding] Erreur lors de l\'ajout du traitement', error);
      throw error;
    }
  }

  async completeOnboarding(onboardingData: OnboardingData): Promise<{ profile: Profile; treatments: Treatment[] }> {
    try {
      logger.info('🚀 [Onboarding] Début du processus complet', { 
        hasName: !!onboardingData.name,
        hasDiagnosis: !!onboardingData.diagnosis,
        treatmentCount: onboardingData.treatments.length 
      });

      // 1. Créer le profil
      const profileData = {
        name: onboardingData.name,
        birth_date: onboardingData.birth_date,
        gender: onboardingData.gender,
        diagnosis: onboardingData.diagnosis || 'aucune',
        rectocolite_signature: onboardingData.rectocolite_signature,
        is_profile_complete: true
      };

      const profile = await this.createProfile(profileData);

      // 2. Ajouter les traitements
      const treatmentResults: Treatment[] = [];
      for (const treatment of onboardingData.treatments) {
        if (treatment.name.trim()) {
          const result = await this.addTreatment({ name: treatment.name });
          treatmentResults.push(result);
        }
      }

      logger.info('✅ [Onboarding] Processus terminé avec succès', {
        profileId: profile.id,
        treatmentCount: treatmentResults.length
      });

      return {
        profile,
        treatments: treatmentResults
      };
    } catch (error) {
      logger.error('❌ [Onboarding] Erreur lors du processus complet', error);
      throw error;
    }
  }

  // Questionnaire Functions
  calculateSignature(responses: QuestionnaireResponse): SignatureResult {
    const score = {
      rectite: 0,
      proctosigmoidite: 0,
      coliteGauche: 0,
      coliteExtensive: 0,
      pancolite: 0
    };

    // Question 1: Localisation des symptômes
    switch (responses.question1) {
      case 'rectum':
        score.rectite += 3;
        score.proctosigmoidite += 2;
        break;
      case 'rectum-sigmoide':
        score.proctosigmoidite += 3;
        score.coliteGauche += 2;
        break;
      case 'colon-gauche':
        score.coliteGauche += 3;
        score.coliteExtensive += 1;
        break;
      case 'colon-droit':
        score.coliteExtensive += 2;
        score.pancolite += 3;
        break;
      case 'tout-colon':
        score.pancolite += 3;
        break;
    }

    // Question 2: Étendue de l'atteinte
    switch (responses.question2) {
      case 'limitee':
        score.rectite += 2;
        score.proctosigmoidite += 2;
        break;
      case 'moderee':
        score.coliteGauche += 2;
        score.proctosigmoidite += 1;
        break;
      case 'etendue':
        score.coliteExtensive += 3;
        score.pancolite += 2;
        break;
    }

    // Question 3: Présence de sang
    switch (responses.question3) {
      case 'jamais':
        score.rectite += 1;
        break;
      case 'parfois':
        score.proctosigmoidite += 1;
        score.coliteGauche += 1;
        break;
      case 'souvent':
        score.coliteExtensive += 2;
        score.pancolite += 2;
        break;
    }

    // Question 4: Urgence défécatoire
    switch (responses.question4) {
      case 'aucune':
        score.rectite += 1;
        break;
      case 'moderee':
        score.proctosigmoidite += 1;
        score.coliteGauche += 1;
        break;
      case 'severe':
        score.coliteExtensive += 2;
        score.pancolite += 2;
        break;
    }

    // Question 5: Fréquence des selles
    switch (responses.question5) {
      case '1-3':
        score.rectite += 2;
        break;
      case '4-6':
        score.proctosigmoidite += 2;
        score.coliteGauche += 1;
        break;
      case '7-10':
        score.coliteExtensive += 2;
        break;
      case 'plus-10':
        score.pancolite += 3;
        break;
    }

    // Trouver la signature avec le score le plus élevé
    const maxScore = Math.max(...Object.values(score));
    const signatures = Object.entries(score).filter(([, s]) => s === maxScore);
    
    let finalSignature: string;
    let confidence: number;

    if (signatures.length === 1) {
      finalSignature = signatures[0][0];
      confidence = Math.min(95, (maxScore / 15) * 100); // Score max théorique: 15
    } else {
      // En cas d'égalité, prendre la plus restrictive
      const order = ['rectite', 'proctosigmoidite', 'coliteGauche', 'coliteExtensive', 'pancolite'];
      finalSignature = signatures.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))[0][0];
      confidence = Math.min(85, (maxScore / 15) * 100);
    }

    // Mapper vers les valeurs de la base
    const signatureMap: Record<string, string> = {
      rectite: 'rectite',
      proctosigmoidite: 'proctosigmoidite',
      coliteGauche: 'colite-gauche',
      coliteExtensive: 'colite-extensive',
      pancolite: 'pancolite'
    };

    const descriptionMap: Record<string, string> = {
      rectite: 'Atteinte limitée au rectum. Forme généralement de bon pronostic.',
      proctosigmoidite: 'Atteinte du rectum et du côlon sigmoïde. Forme fréquente de début.',
      coliteGauche: 'Atteinte limitée au côlon gauche. Forme intermédiaire.',
      coliteExtensive: 'Atteinte étendue au-delà de l\'angle splénique.',
      pancolite: 'Atteinte de l\'ensemble du côlon. Nécessite un suivi rapproché.'
    };

    return {
      signature: signatureMap[finalSignature],
      confidence: Math.round(confidence),
      description: descriptionMap[finalSignature]
    };
  }

  // NOTE: DB functions for questionnaire are commented out as the signature_questionnaires table
  // doesn't exist in the current schema. Only the calculation function is available.
  
  /*
  async saveQuestionnaire(
    profileId: string, 
    responses: QuestionnaireResponse
  ): Promise<SignatureQuestionnaire> {
    // Implementation would require signature_questionnaires table
    throw new Error('Table signature_questionnaires not available in current schema');
  }

  async getQuestionnaires(profileId: string): Promise<SignatureQuestionnaire[]> {
    // Implementation would require signature_questionnaires table
    return [];
  }

  async getLatestQuestionnaire(profileId: string): Promise<SignatureQuestionnaire | null> {
    // Implementation would require signature_questionnaires table
    return null;
  }
  */
}

export const onboardingService = new OnboardingService();
