import { useState } from 'react';
import { format } from 'date-fns';
import { symptomService } from '../../symptom-tracking/services/symptomService';

interface SymptomFormData {
  // Champs du feeling_capture
  global_feeling: 'bad' | 'ok' | 'good' | 'excellent' | '';
  capture_time: string;
  capture_date: string;
  notes: string;
  // Symptômes dynamiques (captured_symptoms)
  symptoms: { [symptomName: string]: number };
}

export function useSymptomEditor(
  addSymptom: (data: any) => Promise<any>,
  updateSymptom: (symptom: any) => void
) {
  const [editingSymptom, setEditingSymptom] = useState<any | null>(null);
  const [isAddingSymptom, setIsAddingSymptom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);
  
  const [symptomFormData, setSymptomFormData] = useState<SymptomFormData>(() => ({
    global_feeling: '',
    notes: '',
    capture_time: format(new Date(), 'HH:mm'),
    capture_date: format(new Date(), 'yyyy-MM-dd'),
    symptoms: {}
  }));
  const handleEditSymptom = (symptom: any) => {
    setEditingSymptom(symptom);
    
    // Formater l'heure pour enlever les secondes si présentes
    const formatTime = (timeString: string) => {
      if (!timeString) return '12:00';
      if (timeString.includes(':')) {
        const parts = timeString.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    };
    
    // Construire l'objet symptoms à partir de captured_symptoms
    const symptoms: { [symptomName: string]: number } = {};
    if (symptom.captured_symptoms) {
      symptom.captured_symptoms.forEach((cs: any) => {
        symptoms[cs.symptom_name] = cs.symptom_intensity;
      });
    }
    
    setSymptomFormData({
      global_feeling: symptom.global_feeling || '',
      notes: symptom.notes || '',
      capture_time: formatTime(symptom.capture_time),
      capture_date: symptom.capture_date || format(new Date(), 'yyyy-MM-dd'),
      symptoms
    });
  };

  const handleStartAdd = () => {
    setIsAddingSymptom(true);
    setSymptomFormData({
      global_feeling: '',
      notes: '',
      capture_time: format(new Date(), 'HH:mm'),
      capture_date: format(new Date(), 'yyyy-MM-dd'),
      symptoms: {
        'Douleurs abdominales': 0,
        'Douleurs articulaires': 0,
        'Fatigue': 0,
        'Ballonnements': 0,
        'Stress': 0,
        'Qualité du sommeil': 0
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingSymptom(null);
    setIsAddingSymptom(false);
    setSymptomFormData({
      global_feeling: '',
      notes: '',
      capture_time: '12:00',
      capture_date: format(new Date(), 'yyyy-MM-dd'),
      symptoms: {}
    });
  };

  const handleSaveSymptom = async () => {
    if (!editingSymptom) return;
    
    try {
      setSaving(true);
      
      // Récupérer les types de symptômes activés pour obtenir le mapping correct
      const enabledSymptoms = await symptomService.getEnabledSymptomTypes();
      
      // Créer un mapping inverse : nom affiché -> clé
      const labelToKeyMapping: { [label: string]: string } = {};
      enabledSymptoms.forEach(symptom => {
        labelToKeyMapping[symptom.label] = symptom.key;
      });
      
      // Préparer les données pour symptomService.updateSymptom
      const formDataForService = {
        global_feeling: symptomFormData.global_feeling as 'bad' | 'ok' | 'good' | 'excellent',
        capture_date: symptomFormData.capture_date,
        capture_time: symptomFormData.capture_time,
        notes: symptomFormData.notes,
        // Convertir les symptômes du format {nom: intensité} vers le format attendu par le service
        ...Object.fromEntries(
          Object.entries(symptomFormData.symptoms).map(([name, intensity]) => {
            // Pour les symptômes du catalogue, utiliser la clé mappée
            // Pour les symptômes personnalisés, utiliser directement le nom
            const key = labelToKeyMapping[name] || name;
            return [key, intensity];
          })
        )
      };
      
      // Sauvegarder en base de données
      const result = await symptomService.updateSymptom(editingSymptom.id, formDataForService);
      
      // Mettre à jour l'état local avec les données de la base
      const updatedSymptom = {
        ...result.feelingCapture,
        captured_symptoms: result.capturedSymptoms
      };
      
      updateSymptom(updatedSymptom);
      
      // Marquer l'élément comme récemment sauvegardé pour le highlight
      setRecentlySavedId(editingSymptom.id);
      
      handleCancelEdit();
      
      // Retirer le highlight après 3 secondes
      setTimeout(() => {
        setRecentlySavedId(null);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNewSymptom = async () => {
    try {
      setSaving(true);
      const newSymptom = await addSymptom({
        global_feeling: symptomFormData.global_feeling,
        capture_date: symptomFormData.capture_date,
        capture_time: symptomFormData.capture_time,
        notes: symptomFormData.notes,
        symptoms: symptomFormData.symptoms
      });
      
      // Marquer l'élément comme récemment ajouté pour le highlight
      if (newSymptom?.id) {
        setRecentlySavedId(newSymptom.id);
        
        // Retirer le highlight après 3 secondes
        setTimeout(() => {
          setRecentlySavedId(null);
        }, 3000);
      }
      
      handleCancelEdit();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    } finally {
      setSaving(false);
    }
  };

  return {
    editingSymptom,
    isAddingSymptom,
    saving,
    symptomFormData,
    setSymptomFormData,
    recentlySavedId,
    handleEditSymptom,
    handleStartAdd,
    handleCancelEdit,
    handleSaveSymptom,
    handleSaveNewSymptom
  };
}
