import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConsumptionData as ImportedConsumptionData } from '../../consumption/types';
import { stoolService } from '../../stool/services/stoolService';

// Use the imported type directly instead of redefining it
type ConsumptionData = ImportedConsumptionData;

interface StoolData {
  id: string;
  consistency: number;
  // New enriched fields
  blood_level?: string | null;
  mucus_level?: string | null;
  stool_color?: string | null;
  evacuation_effort?: string | null;
  duration_minutes?: number | null;
  pain_level?: number | null;
  notes?: string | null;
  // Existing fields
  urgence: number; // DB field is 'urgence' (number), not 'urgency' (string)
  stool_date: string;
  stool_time: string;
  created_at: string;
  // Backward compatibility (to be removed after complete migration)
  has_blood?: boolean;
  has_mucus?: boolean;
}

interface SymptomData {
  id: string;
  profile_id: string;
  global_feeling: 'bad' | 'ok' | 'good' | 'excellent';
  capture_date: string;
  capture_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  captured_symptoms: {
    id: string;
    feeling_capture_id: string;
    symptom_name: string;
    symptom_intensity: number;
    created_at: string;
    updated_at: string;
  }[];
}

// Profile interface that matches the actual database structure
interface ProfileForExport {
  name: string;
  birth_date?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  diagnosis?: string | null;
  rectocolite_signature?: string | null;
  last_calprotectin_value?: number | null;
  last_calprotectin_date?: string | null;
}

const STOOL_CONSISTENCY_LABELS = {
  1: 'Type 1 - Morceaux durs séparés (constipation sévère)',
  2: 'Type 2 - En forme de saucisse grumeleuse (constipation légère)',
  3: 'Type 3 - Saucisse avec craquelures (normal)',
  4: 'Type 4 - Saucisse lisse et molle (optimal)',
  5: 'Type 5 - Morceaux mous aux bords nets (manque de fibres)',
  6: 'Type 6 - Morceaux duveteux pâteux (diarrhée légère)',
  7: 'Type 7 - Entièrement liquide (diarrhée)'
};

const URGENCY_LABELS = {
  'none': 'Aucune',
  'moderate': 'Modérée',
  'severe': 'Sévère'
};

const GENDER_LABELS = {
  'male': 'Homme',
  'female': 'Femme',
  'other': 'Autre'
};

const CONSUMPTION_TYPE_LABELS = {
  'meal': 'Repas',
  'drink': 'Boisson',
  'supplement': 'Complément',
  'medication': 'Médicament'
};

const PREP_MODE_LABELS = {
  // Modes de préparation pour les repas
  'grilled': 'Grillé',
  'boiled': 'Bouilli',
  'fried': 'Frit',
  'raw': 'Cru',
  'steamed': 'Vapeur',
  // Températures pour les boissons
  'hot': 'Chaud',
  'cold': 'Froid',
  'room_temperature': 'Température ambiante',
  // Modes de prise pour compléments/médicaments
  'with_food': 'Avec repas',
  'empty_stomach': 'À jeun',
  'before_meal': 'Avant repas'
};

const COOKING_METHOD_LABELS = {
  'vapeur': 'À la vapeur',
  'bouilli': 'Bouilli',
  'grille': 'Grillé',
  'cru': 'Cru',
  'frit': 'Frit',
  'roti': 'Rôti',
  'micro-ondes': 'Micro-ondes'
};

// Updated intensity labels to match current symptom slider (0-5 scale)
const INTENSITY_LABELS = {
  0: 'Aucun',
  1: 'Très léger',
  2: 'Léger',
  3: 'Modéré',
  4: 'Marqué',
  5: 'Sévère'
};

export function exportToExcel(
  consumptions: ConsumptionData[],
  stools: StoolData[],
  symptoms: SymptomData[],
  profile: ProfileForExport
) {
  // Créer un nouveau classeur
  const workbook = XLSX.utils.book_new();

  // Feuille 1: Informations du patient
  const patientInfo = [
    ['RAPPORT DE SUIVI SANOZIA'],
    [''],
    ['Informations du patient'],
    ['Nom', profile.name],
    ['Date de naissance', profile.birth_date ? format(parseISO(profile.birth_date), 'dd/MM/yyyy', { locale: fr }) : 'Non renseignée'],
    ['Sexe', profile.gender ? GENDER_LABELS[profile.gender] : 'Non renseigné'],
    ['Diagnostic', profile.diagnosis || 'Non renseigné'],
    ...(profile.diagnosis === 'colite-ulcereuse' && (profile as any).rectocolite_signature ? [[
      'Signature rectocolite', (profile as any).rectocolite_signature
    ]] : []),
    ...((profile as any).last_calprotectin_value !== undefined && (profile as any).last_calprotectin_value !== null ? [[
      'Dernière calprotectine', `${(profile as any).last_calprotectin_value} µg/g`
    ]] : []),
    ...((profile as any).last_calprotectin_date ? [[
      'Date dernière calprotectine', format(parseISO((profile as any).last_calprotectin_date), 'dd/MM/yyyy', { locale: fr })
    ]] : []),
    [''],
    ['Date d\'export', format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })],
    [''],
    ['Période analysée'],
    ['Nombre de consommations enregistrées', consumptions.length.toString()],
    ['Nombre de selles enregistrées', stools.length.toString()],
    ['Nombre de captures de ressenti', symptoms.length.toString()],
    ['Nombre total de symptômes capturés', symptoms.reduce((sum, s) => sum + s.captured_symptoms.filter(cs => cs.symptom_intensity > 0).length, 0).toString()],
  ];

  const patientSheet = XLSX.utils.aoa_to_sheet(patientInfo);
  XLSX.utils.book_append_sheet(workbook, patientSheet, 'Informations Patient');

  // Feuille 2: Consommations
  if (consumptions.length > 0) {
    const consumptionsData = [
      ['Date', 'Heure', 'Type', 'Consommation', 'Mode de préparation', 'Effets après', 'Date d\'enregistrement']
    ];

    consumptions
      .sort((a, b) => new Date(b.consumption_date + ' ' + b.consumption_time).getTime() - new Date(a.consumption_date + ' ' + a.consumption_time).getTime())
      .forEach(consumption => {
        consumptionsData.push([
          format(parseISO(consumption.consumption_date), 'dd/MM/yyyy', { locale: fr }),
          consumption.consumption_time,
          CONSUMPTION_TYPE_LABELS[consumption.consumption_type as keyof typeof CONSUMPTION_TYPE_LABELS] || consumption.consumption_type,
          consumption.consumption,
          consumption.prep_mode ? (PREP_MODE_LABELS[consumption.prep_mode as keyof typeof PREP_MODE_LABELS] || consumption.prep_mode) : 'Non spécifié',
          consumption.after_effects || 'Aucun',
          consumption.created_at ? format(parseISO(consumption.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'Non disponible'
        ]);
      });

    const consumptionsSheet = XLSX.utils.aoa_to_sheet(consumptionsData);
    
    // Ajuster la largeur des colonnes
    consumptionsSheet['!cols'] = [
      { width: 12 }, // Date
      { width: 8 },  // Heure
      { width: 12 }, // Type
      { width: 30 }, // Consommation
      { width: 18 }, // Mode de préparation
      { width: 25 }, // Effets après
      { width: 18 }  // Date d'enregistrement
    ];

    XLSX.utils.book_append_sheet(workbook, consumptionsSheet, 'Consommations');
  }

  // Feuille 3: Selles
  if (stools.length > 0) {
    const stoolsData = [
      ['Date', 'Heure', 'Consistance (Bristol)', 'Description', 'Sang (niveau)', 'Mucus (niveau)', 'Couleur', 'Effort d\'évacuation', 'Durée (min)', 'Douleur (0-4)', 'Notes', 'Urgence', 'Date d\'enregistrement']
    ];

    stools
      .sort((a, b) => new Date(b.stool_date + ' ' + b.stool_time).getTime() - new Date(a.stool_date + ' ' + a.stool_time).getTime())
      .forEach(stool => {
        stoolsData.push([
          format(parseISO(stool.stool_date), 'dd/MM/yyyy', { locale: fr }),
          stool.stool_time,
          `Type ${stool.consistency}`,
          STOOL_CONSISTENCY_LABELS[stool.consistency as keyof typeof STOOL_CONSISTENCY_LABELS],
          // niveaux enrichis si disponibles, sinon fallback booleans
          stool.blood_level ?? (stool.has_blood ? 'trace' : 'none'),
          stool.mucus_level ?? (stool.has_mucus ? 'trace' : 'none'),
          stool.stool_color || 'Non spécifié',
          stool.evacuation_effort || 'Non spécifié',
          stool.duration_minutes != null ? stool.duration_minutes.toString() : 'Non spécifié',
          stool.pain_level != null ? stool.pain_level.toString() : '0',
          stool.notes || 'Aucune',
          URGENCY_LABELS[stoolService.urgenceFromNumber(stool.urgence)],
          format(parseISO(stool.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
        ]);
      });

    const stoolsSheet = XLSX.utils.aoa_to_sheet(stoolsData);
    
    // Ajuster la largeur des colonnes
    stoolsSheet['!cols'] = [
      { width: 12 }, // Date
      { width: 8 },  // Heure
      { width: 12 }, // Consistance
      { width: 40 }, // Description
      { width: 14 }, // Sang (niveau)
      { width: 16 }, // Mucus (niveau)
      { width: 12 }, // Couleur
      { width: 18 }, // Effort d'évacuation
      { width: 12 }, // Durée (min)
      { width: 14 }, // Douleur (0-4)
      { width: 20 }, // Notes
      { width: 12 }, // Urgence
      { width: 18 }  // Date d'enregistrement
    ];

    XLSX.utils.book_append_sheet(workbook, stoolsSheet, 'Selles');
  }

  // Feuille 4: Ressenti et Symptômes
  if (symptoms.length > 0) {
    const symptomsData = [
      ['Date', 'Heure', 'Ressenti global', 'Nombre de symptômes', 'Symptômes capturés', 'Notes', 'Date d\'enregistrement']
    ];

    symptoms
      .sort((a, b) => new Date(b.capture_date + ' ' + b.capture_time).getTime() - new Date(a.capture_date + ' ' + a.capture_time).getTime())
      .forEach(symptom => {
        // Count symptoms with intensity > 0
        const activeSymptoms = symptom.captured_symptoms.filter(cs => cs.symptom_intensity > 0);
        
        // Create formatted symptom list with "Label (Score/5)" format
        const capturedSymptomsText = activeSymptoms.length > 0
          ? activeSymptoms
              .map(cs => {
                const intensityLabel = INTENSITY_LABELS[cs.symptom_intensity as keyof typeof INTENSITY_LABELS] || cs.symptom_intensity;
                return `${cs.symptom_name}: ${intensityLabel} (${cs.symptom_intensity}/5)`;
              })
              .join(', ')
          : 'Aucun symptôme';
        
        // Translate global feeling to match UI labels
        const globalFeelingLabels = {
          'bad': 'Mal',
          'ok': 'Moyen',
          'good': 'Bien',
          'excellent': 'Excellent'
        };
        
        symptomsData.push([
          format(parseISO(symptom.capture_date), 'dd/MM/yyyy', { locale: fr }),
          symptom.capture_time,
          globalFeelingLabels[symptom.global_feeling] || symptom.global_feeling,
          activeSymptoms.length.toString(),
          capturedSymptomsText,
          symptom.notes || 'Aucune',
          format(parseISO(symptom.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })
        ]);
      });

    const symptomsSheet = XLSX.utils.aoa_to_sheet(symptomsData);
    
    // Ajuster la largeur des colonnes
    symptomsSheet['!cols'] = [
      { width: 12 }, // Date
      { width: 8 },  // Heure
      { width: 15 }, // Ressenti global
      { width: 12 }, // Nombre de symptômes
      { width: 50 }, // Symptômes capturés (plus large pour format détaillé)
      { width: 25 }, // Notes
      { width: 18 }  // Date d'enregistrement
    ];

    XLSX.utils.book_append_sheet(workbook, symptomsSheet, 'Ressenti & Symptômes');
  }

  // Feuille 5: Analyse statistique
  const analysisData = [
    ['ANALYSE STATISTIQUE'],
    [''],
    ['Répartition des consommations par type'],
  ];

  // Compter les types de consommation
  const consumptionTypes = consumptions.reduce((acc, consumption) => {
    const type = CONSUMPTION_TYPE_LABELS[consumption.consumption_type as keyof typeof CONSUMPTION_TYPE_LABELS] || consumption.consumption_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(consumptionTypes).forEach(([type, count]) => {
    analysisData.push([type, count.toString()]);
  });

  analysisData.push(['']);
  analysisData.push(['Répartition des modes de préparation']);

  // Compter les modes de préparation
  const prepModes = consumptions
    .filter(c => c.prep_mode)
    .reduce((acc, consumption) => {
      const mode = PREP_MODE_LABELS[consumption.prep_mode! as keyof typeof PREP_MODE_LABELS] || consumption.prep_mode!;
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  Object.entries(prepModes).forEach(([mode, count]) => {
    analysisData.push([mode, count.toString()]);
  });

  analysisData.push(['']);
  analysisData.push(['Répartition des selles par type Bristol']);

  // Compter les types de selles
  const stoolTypes = stools.reduce((acc, stool) => {
    const type = `Type ${stool.consistency}`;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(stoolTypes).forEach(([type, count]) => {
    analysisData.push([type, count.toString()]);
  });

  analysisData.push(['']);
  analysisData.push(['Répartition du ressenti global']);
  
  // Count global feelings
  const globalFeelingCounts = symptoms.reduce((acc, symptom) => {
    const feelingLabels = {
      'bad': 'Mal',
      'ok': 'Moyen',
      'good': 'Bien',
      'excellent': 'Excellent'
    };
    const label = feelingLabels[symptom.global_feeling] || symptom.global_feeling;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(globalFeelingCounts).forEach(([feeling, count]) => {
    analysisData.push([feeling, count.toString()]);
  });

  analysisData.push(['']);
  analysisData.push(['Fréquence des symptômes (intensité > 0)']);

  // Analyze symptoms from captured_symptoms array with average intensity
  const symptomStats: Record<string, { count: number; totalIntensity: number }> = {};
  
  symptoms.forEach(symptom => {
    symptom.captured_symptoms.forEach(captured => {
      if (captured.symptom_intensity > 0) {
        if (!symptomStats[captured.symptom_name]) {
          symptomStats[captured.symptom_name] = { count: 0, totalIntensity: 0 };
        }
        symptomStats[captured.symptom_name].count++;
        symptomStats[captured.symptom_name].totalIntensity += captured.symptom_intensity;
      }
    });
  });

  // Add header for symptom statistics
  analysisData.push(['Symptôme', 'Occurrences', 'Intensité moyenne']);
  
  Object.entries(symptomStats)
    .sort((a, b) => b[1].count - a[1].count) // Sort by frequency
    .forEach(([symptom, stats]) => {
      const avgIntensity = (stats.totalIntensity / stats.count).toFixed(1);
      analysisData.push([symptom, stats.count.toString(), `${avgIntensity}/5`]);
    });

  const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
  analysisSheet['!cols'] = [
    { width: 25 }, // Label/Nom
    { width: 15 }, // Count/Occurrences
    { width: 15 }  // Intensité moyenne (pour symptômes)
  ];
  XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analyse');

  // Générer le fichier
  const fileName = `Suivi_Santé_Sanozia_${profile.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return fileName;
}