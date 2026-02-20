// Symptom tracking service - complete service with utilities and DB functions
import { SymptomType, SymptomFormData } from '../types';
import { User, Frown, Zap, Wind, Brain, Moon, Heart } from 'lucide-react';
import React from 'react';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/supabase';
import type { SymptomCatalogItem } from '../../../shared/types';

// Types pour les nouvelles tables
type FeelingCapture = Database['public']['Tables']['feeling_captures']['Row'];
type FeelingCaptureInsert = Database['public']['Tables']['feeling_captures']['Insert'];
type FeelingCaptureUpdate = Database['public']['Tables']['feeling_captures']['Update'];
type CapturedSymptom = Database['public']['Tables']['captured_symptoms']['Row'];
type CapturedSymptomInsert = Database['public']['Tables']['captured_symptoms']['Insert'];
type CapturedSymptomUpdate = Database['public']['Tables']['captured_symptoms']['Update'];

const symptomIconMap: Record<string, React.ReactNode> = {
  abdominal_pain: React.createElement(User, { size: 20 }),
  fatigue: React.createElement(Frown, { size: 20 }),
  joint_pain: React.createElement(Zap, { size: 20 }),
  bloating: React.createElement(Wind, { size: 20 }),
  stress: React.createElement(Brain, { size: 20 }),
  sleep_quality: React.createElement(Moon, { size: 20 })
};

export const symptomService = {
  // Get all available symptom types (static defaults)
  getDefaultSymptomTypes(): SymptomType[] {
    return [
      {
        key: 'abdominal_pain',
        label: 'Douleur abdominale',
        icon: symptomIconMap.abdominal_pain,
        color: '#ef4444'
      },
      {
        key: 'fatigue',
        label: 'Fatigue',
        icon: symptomIconMap.fatigue,
        color: '#f59e0b'
      },
      {
        key: 'joint_pain',
        label: 'Douleur articulaire',
        icon: symptomIconMap.joint_pain,
        color: '#8b5cf6'
      },
      {
        key: 'bloating',
        label: 'Ballonnements',
        icon: symptomIconMap.bloating,
        color: '#06b6d4'
      },
      {
        key: 'stress',
        label: 'Stress',
        icon: symptomIconMap.stress,
        color: '#ec4899'
      },
      {
        key: 'sleep_quality',
        label: 'Qualité du sommeil',
        icon: symptomIconMap.sleep_quality,
        color: '#6366f1'
      }
    ];
  },

  // Get enabled symptoms from user's catalog or default
  async getEnabledSymptomTypes(): Promise<SymptomType[]> {
    try {
      if (!supabase) return this.getDefaultSymptomTypes();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.getDefaultSymptomTypes();

      const { data: profile } = await supabase
        .from('profiles')
        .select('symptom_catalog')
        .eq('user_id', user.id)
        .single();

      if (!profile?.symptom_catalog) {
        return this.getDefaultSymptomTypes();
      }

      // Parse JSON catalog data
      let catalog: SymptomCatalogItem[] = [];
      try {
        catalog = Array.isArray(profile.symptom_catalog) 
          ? profile.symptom_catalog as any[] 
          : JSON.parse(profile.symptom_catalog as string);
      } catch {
        return this.getDefaultSymptomTypes();
      }

      // Filter and sort symptoms based on catalog
      return catalog
        .filter(item => item.enabled)
        .sort((a, b) => a.order - b.order)
        .map(catalogItem => ({
          key: catalogItem.key,
          label: catalogItem.label,
          // Utiliser l'icône du mapping ou une icône par défaut pour les symptômes personnalisés
          icon: symptomIconMap[catalogItem.key] || React.createElement(Heart, { size: 20 })
        }));
    } catch (error) {
      console.warn('Failed to load symptom catalog, using defaults:', error);
      return this.getDefaultSymptomTypes();
    }
  },

  // Legacy method for backward compatibility
  getSymptomTypes(): SymptomType[] {
    return this.getDefaultSymptomTypes();
  },

  getIntensityLabel(intensity: number): string {
    switch (intensity) {
      case 0: return 'Aucun';
      case 1: return 'Léger';
      case 2: return 'Modéré';
      case 3: return 'Sévère';
      default: return 'Aucun';
    }
  },

  validateForm(): boolean {
    // Pas de validation requise pour les symptômes
    return true;
  },

  // DB Functions
  async createSymptom(formData: SymptomFormData): Promise<{ feelingCapture: FeelingCapture; capturedSymptoms: CapturedSymptom[] }> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get the user's profile to use the correct profile_id
    const profile = await this.getCurrentProfile();
    
    // 1. Créer d'abord le feeling_capture avec le sentiment global
    const feelingCaptureData: FeelingCaptureInsert = {
      profile_id: profile.id,
      global_feeling: formData.global_feeling as 'bad' | 'ok' | 'good' | 'excellent',
      capture_date: formData.capture_date,
      capture_time: formData.capture_time,
      notes: formData.notes || null
    };

    const { data: feelingCapture, error: feelingError } = await supabase
      .from('feeling_captures')
      .insert(feelingCaptureData)
      .select('id, profile_id, global_feeling, capture_date, capture_time, notes, created_at, updated_at')
      .single();

    if (feelingError) throw feelingError;

    // 2. Créer les captured_symptoms pour chaque symptôme avec intensité > 0
    const symptomsToCapture: CapturedSymptomInsert[] = [];
    
    // Récupérer les types de symptômes activés pour ce profil
    const enabledSymptoms = await this.getEnabledSymptomTypes();
    
    // Parcourir tous les symptômes activés du catalogue
    for (const symptomType of enabledSymptoms) {
      const intensity = formData[symptomType.key];
      if (typeof intensity === 'number') {
        symptomsToCapture.push({
          feeling_capture_id: feelingCapture.id,
          symptom_name: symptomType.label, // Utiliser le nom du symptôme au lieu de la clé
          symptom_intensity: intensity
        });
      }
    }

    // Traiter aussi les symptômes personnalisés qui ne sont pas dans le catalogue
    // Ces symptômes sont passés directement avec leur nom comme clé
    const catalogKeys = new Set(enabledSymptoms.map(s => s.key));
    for (const [key, intensity] of Object.entries(formData)) {
      if (!catalogKeys.has(key) && 
          typeof intensity === 'number' && 
          !['global_feeling', 'capture_date', 'capture_time', 'notes'].includes(key)) {
        symptomsToCapture.push({
          feeling_capture_id: feelingCapture.id,
          symptom_name: key, // Utiliser directement le nom du symptôme personnalisé
          symptom_intensity: intensity
        });
      }
    }

    // Insérer tous les symptômes capturés
    let capturedSymptoms: CapturedSymptom[] = [];
    if (symptomsToCapture.length > 0) {
      const { data: symptoms, error: symptomsError } = await supabase
        .from('captured_symptoms')
        .insert(symptomsToCapture)
        .select('id, feeling_capture_id, symptom_name, symptom_intensity, created_at, updated_at');

      if (symptomsError) throw symptomsError;
      capturedSymptoms = symptoms || [];
    }

    return { feelingCapture, capturedSymptoms };
  },

  async getFeelingCaptures(limit?: number): Promise<(FeelingCapture & { captured_symptoms: CapturedSymptom[] })[]> {
    return this.getSymptoms(limit);
  },

  async getSymptoms(limit?: number): Promise<(FeelingCapture & { captured_symptoms: CapturedSymptom[] })[]> {
    if (!supabase) {
      return [];
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the user's profile to use the correct profile_id
    const profile = await this.getCurrentProfile();

    let query = supabase
      .from('feeling_captures')
      .select(`
        *,
        captured_symptoms(*)
      `)
      .eq('profile_id', profile.id)
      .order('capture_date', { ascending: false })
      .order('capture_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getSymptomsByDate(date: string): Promise<(FeelingCapture & { captured_symptoms: CapturedSymptom[] })[]> {
    if (!supabase) {
      return [];
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the user's profile to use the correct profile_id
    const profile = await this.getCurrentProfile();

    const { data, error } = await supabase
      .from('feeling_captures')
      .select(`
        *,
        captured_symptoms(*)
      `)
      .eq('profile_id', profile.id)
      .eq('capture_date', date)
      .order('capture_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateSymptom(id: string, formData: SymptomFormData): Promise<{ feelingCapture: FeelingCapture; capturedSymptoms: CapturedSymptom[] }> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // 1. Mettre à jour le feeling_capture
    const feelingCaptureUpdates: FeelingCaptureUpdate = {
      global_feeling: formData.global_feeling as 'bad' | 'ok' | 'good' | 'excellent',
      capture_date: formData.capture_date,
      capture_time: formData.capture_time,
      notes: formData.notes || null
    };

    const { data: feelingCapture, error: feelingError } = await supabase
      .from('feeling_captures')
      .update(feelingCaptureUpdates)
      .eq('id', id)
      .select()
      .single();

    if (feelingError) throw feelingError;

    // 2. Supprimer tous les anciens captured_symptoms
    const { error: deleteError } = await supabase
      .from('captured_symptoms')
      .delete()
      .eq('feeling_capture_id', id);

    if (deleteError) throw deleteError;

    // 3. Recréer les captured_symptoms pour les symptômes avec intensité > 0
    const symptomsToCapture: CapturedSymptomInsert[] = [];
    
    // Récupérer les types de symptômes activés pour ce profil
    const enabledSymptoms = await this.getEnabledSymptomTypes();

    // Parcourir tous les symptômes activés du catalogue
    for (const symptomType of enabledSymptoms) {
      const intensity = formData[symptomType.key];
      if (typeof intensity === 'number') {
        symptomsToCapture.push({
          feeling_capture_id: id,
          symptom_name: symptomType.label, // Utiliser le nom du symptôme au lieu de la clé
          symptom_intensity: intensity
        });
      }
    }

    // Traiter aussi les symptômes personnalisés qui ne sont pas dans le catalogue
    // Ces symptômes sont passés directement avec leur nom comme clé
    const catalogKeys = new Set(enabledSymptoms.map(s => s.key));
    for (const [key, intensity] of Object.entries(formData)) {
      if (!catalogKeys.has(key) && 
          typeof intensity === 'number' && 
          !['global_feeling', 'capture_date', 'capture_time', 'notes'].includes(key)) {
        symptomsToCapture.push({
          feeling_capture_id: id,
          symptom_name: key, // Utiliser directement le nom du symptôme personnalisé
          symptom_intensity: intensity
        });
      }
    }

    let capturedSymptoms: CapturedSymptom[] = [];
    if (symptomsToCapture.length > 0) {
      const { data: symptoms, error: symptomsError } = await supabase
        .from('captured_symptoms')
        .insert(symptomsToCapture)
        .select('id, feeling_capture_id, symptom_name, symptom_intensity, created_at, updated_at');

      if (symptomsError) throw symptomsError;
      capturedSymptoms = symptoms || [];
    }

    return { feelingCapture, capturedSymptoms };
  },

  async deleteSymptom(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    // Supprimer le feeling_capture (les captured_symptoms seront supprimés automatiquement par CASCADE)
    const { error } = await supabase
      .from('feeling_captures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCurrentProfile() {
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

    if (error) throw error;
    if (!profile) throw new Error('User profile not found');
    return profile;
  }
};
