import { useState } from 'react';
import { format } from 'date-fns';
import type { ConsumptionData } from '../../consumption/types';
import { consumptionService } from '../../consumption/services/consumptionService';

interface ConsumptionFormData {
  consumption: string;
  consumption_type: string;
  prep_mode: string;
  consumption_time: string;
  after_effects: string;
  consumption_date: string;
}

export function useConsumptionEditor(
  addConsumption: (data: any) => Promise<any>,
  updateConsumption: (consumption: any) => void
) {
  const [editingConsumption, setEditingConsumption] = useState<ConsumptionData | null>(null);
  const [isAddingConsumption, setIsAddingConsumption] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);
  
  const [consumptionFormData, setConsumptionFormData] = useState<ConsumptionFormData>({
    consumption: '',
    consumption_type: 'meal',
    prep_mode: '',
    consumption_time: '12:00',
    after_effects: '',
    consumption_date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleEditConsumption = (consumption: ConsumptionData) => {
    setEditingConsumption(consumption);
    
    // Formater l'heure pour enlever les secondes si présentes
    const formatTime = (timeString: string) => {
      if (!timeString) return '12:00';
      if (timeString.includes(':')) {
        const parts = timeString.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    };
    
    setConsumptionFormData({
      consumption: consumption.consumption || '',
      consumption_type: consumption.consumption_type || 'meal',
      prep_mode: consumption.prep_mode || '',
      consumption_time: formatTime(consumption.consumption_time),
      after_effects: consumption.after_effects || '',
      consumption_date: consumption.consumption_date || format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleStartAdd = () => {
    setIsAddingConsumption(true);
    setConsumptionFormData({
      consumption: '',
      consumption_type: 'meal',
      prep_mode: '',
      consumption_time: format(new Date(), 'HH:mm'),
      after_effects: '',
      consumption_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleCancelEdit = () => {
    setEditingConsumption(null);
    setIsAddingConsumption(false);
    setConsumptionFormData({
      consumption: '',
      consumption_type: 'meal',
      prep_mode: '',
      consumption_time: '12:00',
      after_effects: '',
      consumption_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleSaveConsumption = async () => {
    if (!editingConsumption || !editingConsumption.id) return;
    
    try {
      setSaving(true);
      
      // Persister les changements en base de données
      const updatedConsumption = await consumptionService.updateConsumption(editingConsumption.id, {
        consumption: consumptionFormData.consumption,
        prep_mode: consumptionFormData.prep_mode,
        consumption_time: consumptionFormData.consumption_time,
        after_effects: consumptionFormData.after_effects
      });
      
      // Mettre à jour l'état local
      updateConsumption(updatedConsumption);
      
      // Marquer l'élément comme récemment sauvegardé pour le highlight
      setRecentlySavedId(editingConsumption.id);
      
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

  const handleSaveNewConsumption = async () => {
    try {
      setSaving(true);
      const newConsumption = await addConsumption({
        consumption_type: consumptionFormData.consumption_type,
        consumption: consumptionFormData.consumption,
        prep_mode: consumptionFormData.prep_mode,
        consumption_date: consumptionFormData.consumption_date,
        consumption_time: consumptionFormData.consumption_time,
        after_effects: consumptionFormData.after_effects
      });
      
      // Marquer l'élément comme récemment ajouté pour le highlight
      if (newConsumption?.id) {
        setRecentlySavedId(newConsumption.id);
        
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
    editingConsumption,
    isAddingConsumption,
    saving,
    consumptionFormData,
    setConsumptionFormData,
    recentlySavedId,
    handleEditConsumption,
    handleStartAdd,
    handleCancelEdit,
    handleSaveConsumption,
    handleSaveNewConsumption
  };
}
