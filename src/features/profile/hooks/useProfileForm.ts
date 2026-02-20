import { useState, useEffect } from 'react';
import { logger } from '../../../shared/utils/logger';
import type { Database } from '../../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface ProfileFormData {
  name: string;
  birth_date: string;
  gender: string;
  diagnosis: string;
  rectocolite_signature: string;
  last_calprotectin_value: string;
  last_calprotectin_date: string;
}

interface UseProfileFormProps {
  profile: Profile;
  updateProfile: (updates: ProfileUpdate) => Promise<Profile>;
}

export function useProfileForm({ profile, updateProfile }: UseProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    birth_date: '',
    gender: '',
    diagnosis: '',
    rectocolite_signature: '',
    last_calprotectin_value: '',
    last_calprotectin_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mettre à jour formData quand le profil est chargé
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        diagnosis: profile.diagnosis || '',
        rectocolite_signature: profile.rectocolite_signature || '',
        last_calprotectin_value: profile.last_calprotectin_value?.toString() || '',
        last_calprotectin_date: profile.last_calprotectin_date || ''
      });
    }
  }, [profile]);

  const handleFormDataChange = (field: string, value: string) => {
    setFormData((prev: ProfileFormData) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  };

  const handleEdit = () => {
    setFormData({
      name: profile?.name || '',
      birth_date: profile?.birth_date || '',
      gender: profile?.gender || '',
      diagnosis: profile?.diagnosis || '',
      rectocolite_signature: profile?.rectocolite_signature || '',
      last_calprotectin_value: profile?.last_calprotectin_value?.toString() || '',
      last_calprotectin_date: profile?.last_calprotectin_date || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.diagnosis) {
      newErrors.diagnosis = 'Le diagnostic est requis';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    try {
      await updateProfile({
        name: formData.name,
        birth_date: formData.birth_date || null,
        gender: formData.gender as 'male' | 'female' || null,
        diagnosis: formData.diagnosis,
        rectocolite_signature: formData.rectocolite_signature || null,
        last_calprotectin_value: formData.last_calprotectin_value ? parseInt(formData.last_calprotectin_value) : null,
        last_calprotectin_date: formData.last_calprotectin_date || null
      });
      setIsEditing(false);
      logger.info('Profile updated successfully', { context: 'ProfileForm' });
    } catch (error) {
      logger.error('Failed to update profile', { error, context: 'ProfileForm' });
    }
  };

  // Fonctions utilitaires pour l'affichage
  const formatBirthDate = (dateString: string | null): string => {
    if (!dateString) return 'Non renseigné';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const getGenderLabel = (gender: string | null): string => {
    switch (gender) {
      case 'male': return 'Homme';
      case 'female': return 'Femme';
      default: return 'Non renseigné';
    }
  };

  const getDiagnosisLabel = (diagnosis: string): string => {
    switch (diagnosis) {
      case 'maladie_de_crohn': return 'Maladie de Crohn';
      case 'rectocolite_hemorragique': return 'Rectocolite hémorragique';
      case 'colite_indeterminee': return 'Colite indéterminée';
      default: return 'Non renseigné';
    }
  };

  const getRectocoliteSignatureLabel = (signature: string | null): string => {
    switch (signature) {
      case 'proctite': return 'Proctite';
      case 'colite_gauche': return 'Colite gauche';
      case 'pancolite': return 'Pancolite';
      default: return 'Non renseigné';
    }
  };

  const getSignatureDescription = (signature: string): string => {
    switch (signature) {
      case 'proctite': return 'Inflammation limitée au rectum';
      case 'colite_gauche': return 'Inflammation du côlon gauche (rectum + côlon sigmoïde)';
      case 'pancolite': return 'Inflammation de tout le côlon';
      default: return '';
    }
  };

  return {
    isEditing,
    formData,
    errors,
    handleFormDataChange,
    handleEdit,
    handleCancel,
    handleSave,
    formatBirthDate,
    getGenderLabel,
    getDiagnosisLabel,
    getRectocoliteSignatureLabel,
    getSignatureDescription
  };
}
