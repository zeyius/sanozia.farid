// Profile service - complete service with utilities and DB functions
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Treatment = Database['public']['Tables']['treatments']['Row'];
type TreatmentInsert = Database['public']['Tables']['treatments']['Insert'];
type TreatmentUpdate = Database['public']['Tables']['treatments']['Update'];

// Profile service - complete service with utilities and DB functions
export const profileService = {
  formatBirthDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  },

  getGenderLabel(gender: string): string {
    if (gender === '') return 'Missing';
    const genderLabels: Record<string, string> = {
      'male': 'Homme',
      'female': 'Femme'
    };
    return genderLabels[gender] || gender;
  },

  getDiagnosisLabel(diagnosis: string): string {
    const diagnosisLabels: Record<string, string> = {
      'crohn': 'Maladie de Crohn',
      'colite-ulcereuse': 'Rectocolite hémorragique',
      'colite-indeterminee': 'Colite indéterminée'
    };
    return diagnosisLabels[diagnosis] || diagnosis;
  },

  getRectocoliteSignatureLabel(signature: string): string {
    const signatures: Record<string, string> = {
      'pancolite': 'Pancolite',
      'colite-gauche': 'Colite gauche',
      'rectite': 'Rectite',
      'proctosigmoidite': 'Proctosigmoïdite',
      'colite-extensive': 'Colite extensive',
      'colite-distale': 'Colite distale'
    };
    return signatures[signature] || signature;
  },

  getSignatureDescription(signature: string): string {
    const descriptions: Record<string, string> = {
      'pancolite': 'Inflammation de tout le côlon',
      'colite-gauche': 'Inflammation du côlon gauche',
      'rectite': 'Inflammation limitée au rectum',
      'proctosigmoidite': 'Inflammation du rectum et du sigmoïde',
      'colite-extensive': 'Inflammation étendue du côlon',
      'colite-distale': 'Inflammation de la partie distale du côlon'
    };
    return descriptions[signature] || '';
  },

  // DB Functions
  async createProfile(profileData: Omit<ProfileInsert, 'user_id'>): Promise<Profile> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const baseProfileData: any = {
      name: profileData.name,
      diagnosis: profileData.diagnosis,
      user_id: user.id,
    };
    
    // Ajouter seulement les champs qui ont une valeur
    if (profileData.birth_date) baseProfileData.birth_date = profileData.birth_date;
    if (profileData.gender) baseProfileData.gender = profileData.gender;
    if (profileData.is_profile_complete !== undefined) baseProfileData.is_profile_complete = profileData.is_profile_complete;
    if (profileData.rectocolite_signature) baseProfileData.rectocolite_signature = profileData.rectocolite_signature;
    
    // Ajouter le catalogue de symptômes par défaut si non fourni
    if (!profileData.symptom_catalog) {
      baseProfileData.symptom_catalog = [
        { key: 'abdominal_pain', label: 'Douleur abdominale', icon: 'User', enabled: true, order: 1 },
        { key: 'bloating', label: 'Ballonnements', icon: 'Wind', enabled: true, order: 2 },
        { key: 'joint_pain', label: 'Douleur articulaire', icon: 'Zap', enabled: true, order: 3 },
        { key: 'fatigue', label: 'Fatigue', icon: 'Frown', enabled: true, order: 4 },
        { key: 'stress', label: 'Stress', icon: 'Brain', enabled: true, order: 5 },
      ];
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(baseProfileData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProfile(): Promise<Profile | null> {
    if (!supabase) {
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      // Si c'est juste qu'il n'y a pas de profil, retourner null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  },

  async updateProfile(updates: ProfileUpdate): Promise<Profile> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const safeUpdates = {
      name: updates.name,
      birth_date: updates.birth_date,
      gender: updates.gender,
      diagnosis: updates.diagnosis,
      is_profile_complete: updates.is_profile_complete,
      rectocolite_signature: updates.rectocolite_signature,
      symptom_catalog: updates.symptom_catalog,
      last_calprotectin_value: updates.last_calprotectin_value,
      last_calprotectin_date: updates.last_calprotectin_date,
      updated_at: updates.updated_at
    };

    // Supprimer les propriétés undefined pour éviter les erreurs
    Object.keys(safeUpdates).forEach(key => {
      if (safeUpdates[key as keyof typeof safeUpdates] === undefined) {
        delete safeUpdates[key as keyof typeof safeUpdates];
      }
    });

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Symptom Catalog Functions
  async updateSymptomCatalog(catalog: any[]): Promise<Profile> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          symptom_catalog: catalog,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        // Si la colonne symptom_catalog n'existe pas encore dans la base de données
        if (error.code === 'PGRST204' || error.message?.includes('symptom_catalog')) {
          console.warn('La colonne symptom_catalog n\'existe pas encore dans la base de données. Fonctionnalité temporairement désactivée.');
          // Retourner le profil existant sans la mise à jour du catalogue
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select()
            .eq('user_id', user.id)
            .single();
          
          if (profileError) throw profileError;
          return profileData;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du catalogue de symptômes:', error);
      throw error;
    }
  },

  async getSymptomCatalog(): Promise<any[] | null> {
    if (!supabase) {
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('symptom_catalog')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Si la colonne symptom_catalog n'existe pas encore
        if (error.code === 'PGRST204' || error.message?.includes('symptom_catalog')) {
          console.warn('La colonne symptom_catalog n\'existe pas encore dans la base de données.');
          return null;
        }
        throw error;
      }
      
      if (!data?.symptom_catalog) return null;
      
      // Parse JSON if it's a string, otherwise return as is
      if (typeof data.symptom_catalog === 'string') {
        try {
          return JSON.parse(data.symptom_catalog);
        } catch {
          return null;
        }
      }
      
      return Array.isArray(data.symptom_catalog) ? data.symptom_catalog : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du catalogue de symptômes:', error);
      return null;
    }
  },

  async deleteProfile(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Treatment Functions
  async createTreatment(treatmentData: Omit<TreatmentInsert, 'profile_id'>): Promise<Treatment> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const profile = await this.getCurrentProfileForTreatment();
    
    const { data, error } = await supabase
      .from('treatments')
      .insert({
        name: treatmentData.name,
        profile_id: profile.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTreatments(): Promise<Treatment[]> {
    if (!supabase) {
      return [];
    }
    
    const profile = await this.getCurrentProfileForTreatment();

    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActiveTreatments(): Promise<Treatment[]> {
    if (!supabase) {
      return [];
    }
    
    const profile = await this.getCurrentProfileForTreatment();

    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateTreatment(id: string, updates: TreatmentUpdate): Promise<Treatment> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data, error } = await supabase
      .from('treatments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTreatment(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCurrentProfileForTreatment() {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Erreur lors de la récupération du profil pour les traitements:', error);
      throw error;
    }
    
    if (!profile) {
      console.warn('Profil utilisateur non trouvé pour les traitements - profil peut-être en cours de création');
      throw new Error('User profile not found');
    }
    
    return profile;
  }
};
