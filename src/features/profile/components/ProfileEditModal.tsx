import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/FormField';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { DIAGNOSES, RECTOCOLITE_SIGNATURES } from '../../../shared/constants';
import { useProfileForm } from '../hooks/useProfileForm';
import type { Database } from '../../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: 'personal' | 'medical';
  profile: Profile;
  updateProfile: (updates: ProfileUpdate) => Promise<Profile>;
}

export function ProfileEditModal({ 
  isOpen, 
  onClose, 
  section, 
  profile, 
  updateProfile 
}: ProfileEditModalProps) {
  const profileForm = useProfileForm({ profile, updateProfile });

  const handleSave = async () => {
    await profileForm.handleSave();
    onClose();
  };

  const handleCancel = () => {
    profileForm.handleCancel();
    onClose();
  };

  // Initialiser le formulaire quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      profileForm.handleEdit();
    }
  }, [isOpen]);

  const getTitle = () => {
    return section === 'personal' 
      ? 'Modifier les informations personnelles'
      : 'Modifier les informations médicales';
  };

  const renderPersonalForm = () => (
    <div className="space-y-4">
      <FormField label="Nom complet" error={profileForm.errors.name}>
        <Input
          value={profileForm.formData.name}
          onChange={(value) => profileForm.handleFormDataChange('name', value)}
          placeholder="Votre nom complet"
        />
      </FormField>

      <FormField label="Date de naissance" error={profileForm.errors.birth_date}>
        <Input
          type="date"
          value={profileForm.formData.birth_date}
          onChange={(value) => profileForm.handleFormDataChange('birth_date', value)}
        />
      </FormField>

      <FormField label="Genre" error={profileForm.errors.gender}>
        <Select
          value={profileForm.formData.gender}
          onChange={(value) => profileForm.handleFormDataChange('gender', value)}
          options={[
            { value: '', label: 'Sélectionner...' },
            { value: 'male', label: 'Homme' },
            { value: 'female', label: 'Femme' },
            { value: 'other', label: 'Autre' }
          ]}
        />
      </FormField>
    </div>
  );

  const renderMedicalForm = () => (
    <div className="space-y-4">
      <FormField label="Diagnostic" error={profileForm.errors.diagnosis}>
        <Select
          value={profileForm.formData.diagnosis}
          onChange={(value) => profileForm.handleFormDataChange('diagnosis', value)}
          options={[
            { value: '', label: 'Sélectionner un diagnostic...' },
            ...DIAGNOSES
          ]}
        />
      </FormField>

      {profileForm.formData.diagnosis === 'rectocolite_hemorragique' && (
        <FormField label="Signature de la rectocolite" error={profileForm.errors.rectocolite_signature}>
          <Select
            value={profileForm.formData.rectocolite_signature}
            onChange={(value) => profileForm.handleFormDataChange('rectocolite_signature', value)}
            options={[
              { value: '', label: 'Sélectionner une signature...' },
              ...RECTOCOLITE_SIGNATURES
            ]}
          />
        </FormField>
      )}

      <FormField label="Dernière valeur de calprotectine (µg/g)" error={profileForm.errors.last_calprotectin_value}>
        <Input
          type="number"
          value={profileForm.formData.last_calprotectin_value}
          onChange={(value) => profileForm.handleFormDataChange('last_calprotectin_value', value)}
          placeholder="Ex: 150"
        />
      </FormField>

      <FormField label="Date du dernier dosage" error={profileForm.errors.last_calprotectin_date}>
        <Input
          type="date"
          value={profileForm.formData.last_calprotectin_date}
          onChange={(value) => profileForm.handleFormDataChange('last_calprotectin_date', value)}
        />
      </FormField>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={getTitle()}
      size="md"
    >
      <div className="space-y-6">
        {section === 'personal' ? renderPersonalForm() : renderMedicalForm()}
        
        <div className="flex gap-3 pt-4 border-t border-[#e3c79f]/30">
          <Button
            onClick={handleSave}
            className="bg-[#b36b43] hover:bg-[#a05a3a] text-white flex-1"
          >
            Enregistrer
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
}