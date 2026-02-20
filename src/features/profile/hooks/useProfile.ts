import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
// treatmentService functions are now part of profileService
import { useAuth } from '../../auth';
import type { Database } from '../../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Treatment = Database['public']['Tables']['treatments']['Row'];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile) {
      loadProfile();
      loadTreatments();
    } else {
      // Pas de profil = pas de loading pour l'onboarding
      setProfile(null);
      setTreatments([]);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du profil');
    }
  };

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const treatmentsData = await profileService.getTreatments();
      setTreatments(treatmentsData);
      setError(null);
    } catch (err) {
      // Ne pas logger l'erreur si c'est juste un profil non trouvé (cas normal après création)
      if (err instanceof Error && err.message === 'User profile not found') {
        console.warn('Profil non trouvé pour charger les traitements - probablement en cours de création');
        setTreatments([]);
        setError(null);
      } else {
        console.error('Erreur lors du chargement des traitements:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des traitements');
      }
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: {
    name: string;
    birth_date?: string;
    gender?: 'male' | 'female' | null;
    diagnosis: string;
    is_profile_complete?: boolean;
  }) => {
    try {
      setLoading(true);
      
      const newProfile = await profileService.createProfile(profileData);
      setProfile(newProfile);
      setError(null);
      return newProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du profil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setLoading(true);
      
      const baseUpdates = {
        name: updates.name,
        birth_date: updates.birth_date,
        gender: updates.gender,
        diagnosis: updates.diagnosis,
        is_profile_complete: updates.is_profile_complete,
        rectocolite_signature: updates.rectocolite_signature,
        last_calprotectin_value: updates.last_calprotectin_value,
        last_calprotectin_date: updates.last_calprotectin_date,
        symptom_catalog: updates.symptom_catalog
      };
      
      // Supprimer les propriétés undefined
      Object.keys(baseUpdates).forEach(key => {
        if (baseUpdates[key as keyof typeof baseUpdates] === undefined) {
          delete baseUpdates[key as keyof typeof baseUpdates];
        }
      });
      
      const updatedProfile = await profileService.updateProfile(baseUpdates);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addTreatment = async (treatmentData: { name: string }) => {
    try {
      const newTreatment = await profileService.createTreatment(treatmentData);
      setTreatments(prev => [newTreatment, ...prev]);
      return newTreatment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du traitement';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTreatment = async (id: string, updates: Partial<Treatment>) => {
    try {
      const updatedTreatment = await profileService.updateTreatment(id, updates);
      setTreatments(prev => prev.map(t => t.id === id ? updatedTreatment : t));
      return updatedTreatment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du traitement';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeTreatment = async (id: string) => {
    try {
      await profileService.deleteTreatment(id);
      setTreatments(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du traitement';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Fonction pour mise à jour locale sans rechargement
  const updateProfileLocal = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
    }
  };

  return {
    profile,
    treatments,
    loading,
    error,
    createProfile,
    updateProfile,
    updateProfileLocal,
    addTreatment,
    updateTreatment,
    removeTreatment,
    refetch: () => {
      loadProfile();
      loadTreatments();
    },
  };
}