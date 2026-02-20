import { useState } from 'react';
import { format } from 'date-fns';
import { stoolService } from '../../stool/services/stoolService';
import type { Database } from '../../../lib/supabase';

type Stool = Database['public']['Tables']['stools']['Row'];

interface StoolFormData {
  consistency: number;
  blood_level: 'none' | 'trace' | 'moderate' | 'severe';
  mucus_level: 'none' | 'trace' | 'moderate' | 'severe';
  urgency: 'none' | 'moderate' | 'severe';
  stool_date: string;
  stool_time: string;
  duration_minutes?: number | null;
  evacuation_effort?: string;
  pain_level?: number;
  notes?: string;
}

export function useStoolEditor(
  addStool: (data: any) => Promise<any>,
  updateStool: (stool: any) => Promise<any>
) {
  const [editingStool, setEditingStool] = useState<Stool | null>(null);
  const [isAddingStool, setIsAddingStool] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);
  
  const [editFormData, setEditFormData] = useState<StoolFormData>({
    consistency: 4,
    blood_level: 'none',
    mucus_level: 'none',
    urgency: 'none',
    stool_date: format(new Date(), 'yyyy-MM-dd'),
    stool_time: '12:00',
    duration_minutes: null,
    evacuation_effort: 'normal',
    pain_level: 0,
    notes: ''
  });

  const handleEditStool = (stool: Stool) => {
    setEditingStool(stool);
    
    // Formater l'heure pour enlever les secondes si présentes
    const formatTime = (timeString: string) => {
      if (!timeString) return '12:00';
      if (timeString.includes(':')) {
        const parts = timeString.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    };
    
    setEditFormData({
      consistency: typeof stool.consistency === 'string' ? parseInt(stool.consistency, 10) : stool.consistency || 4,
      blood_level: (stool as any).blood_level || (stool.has_blood ? 'trace' : 'none'),
      mucus_level: (stool as any).mucus_level || (stool.has_mucus ? 'trace' : 'none'),
      urgency: stoolService.urgenceFromNumber(stool.urgence),
      stool_date: stool.stool_date || format(new Date(), 'yyyy-MM-dd'),
      stool_time: formatTime(stool.stool_time),
      duration_minutes: (stool as any).duration_minutes || null,
      evacuation_effort: (stool as any).evacuation_effort || 'normal',
      pain_level: (stool as any).pain_level ?? 0,
      notes: stool.notes || ''
    });
  };

  const handleStartAdd = () => {
    setIsAddingStool(true);
    setEditFormData({
      consistency: 4,
      blood_level: 'none',
      mucus_level: 'none',
      urgency: 'none',
      stool_date: format(new Date(), 'yyyy-MM-dd'),
      stool_time: format(new Date(), 'HH:mm'),
      duration_minutes: null,
      evacuation_effort: 'normal',
      pain_level: 0,
      notes: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingStool(null);
    setIsAddingStool(false);
    setEditFormData({
      consistency: 4,
      blood_level: 'none',
      mucus_level: 'none',
      urgency: 'none',
      stool_date: format(new Date(), 'yyyy-MM-dd'),
      stool_time: '12:00',
      duration_minutes: null,
      evacuation_effort: 'normal',
      pain_level: 0,
      notes: ''
    });
  };

  const handleSaveStool = async () => {
    if (!editingStool) return;
    
    try {
      setSaving(true);
      // Construire l'objet mis à jour - le service filtrera les champs non autorisés
      const updatedStool = {
        ...editingStool,
        consistency: editFormData.consistency,
        blood_level: editFormData.blood_level,
        mucus_level: editFormData.mucus_level,
        urgency: editFormData.urgency,
        stool_date: editFormData.stool_date,
        stool_time: editFormData.stool_time,
        duration_minutes: editFormData.duration_minutes,
        evacuation_effort: editFormData.evacuation_effort,
        pain_level: editFormData.pain_level,
        notes: editFormData.notes || null
      };
      
      // Attendre la sauvegarde en DB (le service filtrera has_blood/has_mucus)
      await updateStool(updatedStool);
      
      // Marquer l'élément comme récemment sauvegardé pour le highlight
      setRecentlySavedId(editingStool.id);
      
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

  const handleSaveNewStool = async () => {
    try {
      setSaving(true);
      const newStool = await addStool({
        consistency: editFormData.consistency,
        blood_level: editFormData.blood_level,
        mucus_level: editFormData.mucus_level,
        urgency: editFormData.urgency,
        stool_date: editFormData.stool_date,
        stool_time: editFormData.stool_time,
        duration_minutes: editFormData.duration_minutes,
        evacuation_effort: editFormData.evacuation_effort,
        pain_level: editFormData.pain_level,
        notes: editFormData.notes || null
      });
      
      // Marquer l'élément comme récemment ajouté pour le highlight
      if (newStool?.id) {
        setRecentlySavedId(newStool.id);
        
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
    editingStool,
    isAddingStool,
    saving,
    editFormData,
    setEditFormData,
    recentlySavedId,
    handleEditStool,
    handleStartAdd,
    handleCancelEdit,
    handleSaveStool,
    handleSaveNewStool
  };
}
