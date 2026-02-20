import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/FormField';
import { Input } from '../../../shared/components/Input';
import { Textarea } from '../../../shared/components/Textarea';
import { Select } from '../../../shared/components/Select';
import { SmartDateTimePicker } from '../../../shared/components/SmartDateTimePicker';
import { ConfirmNavigationModal } from '../../../shared/components/ConfirmNavigationModal';
import { useFormDirtyState } from '../../../shared/hooks/useFormDirtyState';
import { useNavigateWithConfirmation } from '../../../shared/hooks/useNavigateWithConfirmation';
import { consumptionService } from '../services/consumptionService';
import { format } from 'date-fns';
import { logger, loggerContexts } from '../../../shared/utils/logger';

export function ConsumptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Initial form values
  const initialFormData = useMemo(() => ({
    consumption_type: '',
    consumption: '',
    consumption_date: format(new Date(), 'yyyy-MM-dd'),
    consumption_time: format(new Date(), 'HH:mm'),
    prep_mode: '',
    after_effects: ''
  }), []);
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Track if form is dirty (has unsaved changes)
  const { isDirty } = useFormDirtyState(initialFormData, formData);
  
  // Handle navigation with confirmation
  const { handleNavigate, showConfirm, confirmNavigation, cancelNavigation } = 
    useNavigateWithConfirmation(isDirty);

  const getFieldError = (fieldName: string): string | undefined => {
    if (!showValidationErrors) return undefined;
    return errors[fieldName];
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.consumption_type) {
      newErrors.consumption_type = 'Le type de consommation est requis';
    }
    if (!formData.consumption.trim()) {
      newErrors.consumption = 'La consommation est requise';
    }
    if (!formData.consumption_time) {
      newErrors.consumption_time = 'L\'heure est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    
    if (!validate()) {
      return;
    }

    if (!user?.profile?.id) {
      setErrors({ general: 'Profil utilisateur non trouvé' });
      return;
    }

    setLoading(true);
    try {
      await consumptionService.createConsumption({
        profile_id: user.profile.id,
        consumption: formData.consumption,
        consumption_type: formData.consumption_type,
        consumption_date: formData.consumption_date,
        consumption_time: formData.consumption_time,
        prep_mode: formData.prep_mode || undefined,
        after_effects: formData.after_effects || undefined
      });

      logger.info('Consommation enregistrée avec succès', {
        type: formData.consumption_type,
        consumption: formData.consumption
      }, loggerContexts.API);

      navigate('/dashboard');
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de la consommation', { error }, loggerContexts.API);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer les erreurs quand l'utilisateur modifie un champ
    if (showValidationErrors) {
      setShowValidationErrors(false);
      setErrors({});
    }
  };

  const getAvailablePrepModes = () => {
    if (!formData.consumption_type) return [];
    return consumptionService.getPrepModesForType(formData.consumption_type);
  };

  return (
    <>
      <Layout 
        title="Nouvelle consommation" 
        showBackButton
        onBackClick={() => handleNavigate('/dashboard')}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
        {/* Erreur générale */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Date et Heure - Smart Responsive Layout */}
          <SmartDateTimePicker
            dateValue={formData.consumption_date}
            timeValue={formData.consumption_time}
            onDateChange={(value) => handleFieldChange('consumption_date', value)}
            onTimeChange={(value) => {
              logger.debug('TimePicker onChange called with:', { value }, loggerContexts.UI);
              handleFieldChange('consumption_time', value);
            }}
            dateLabel="Date"
            timeLabel="Heure"
            disabled={loading}
            timeError={getFieldError('consumption_time')}
          />

          {/* Étape 2: Type de consommation */}
          <div>
            <label className="block text-sm font-medium text-[#303d25] mb-3">
              Type de consommation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {consumptionService.getConsumptionTypes().map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleFieldChange('consumption_type', type.value)}
                    disabled={loading}
                    className={`px-3 py-3 rounded-lg border-2 transition-colors text-sm flex items-center justify-center gap-2 ${
                      formData.consumption_type === type.value
                        ? 'bg-[#303d25] text-white border-[#303d25]'
                        : 'bg-white text-[#303d25] border-[#e3c79f] hover:border-[#b36b43]'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {IconComponent && <IconComponent size={16} />}
                    {type.label}
                  </button>
                );
              })}
            </div>
            {getFieldError('consumption_type') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('consumption_type')}</p>
            )}
          </div>

          {/* Étape 3: Champs spécifiques selon le type */}
          {formData.consumption_type && (
            <>
              {/* Mode de préparation (si applicable) */}
              {getAvailablePrepModes().length > 0 && (
                <FormField
                  label="Mode de préparation"
                  error={getFieldError('prep_mode')}
                >
                  <Select
                    value={formData.prep_mode}
                    onChange={(value) => handleFieldChange('prep_mode', value)}
                    disabled={loading}
                    placeholder="Sélectionner..."
                    options={getAvailablePrepModes().map((mode) => ({
                      value: mode.value,
                      label: mode.label
                    }))}
                  />
                </FormField>
              )}

              {/* Aliments consommés */}
              <FormField
                label={consumptionService.getConsumptionLabel(formData.consumption_type)}
                error={getFieldError('consumption')}
              >
                <Textarea
                  value={formData.consumption}
                  onChange={(value) => handleFieldChange('consumption', value)}
                  disabled={loading}
                  placeholder={`Ex : ${
                    formData.consumption_type === 'meal' ? 'riz, légumes, poisson' :
                    formData.consumption_type === 'drink' ? 'eau, thé, jus de fruits' :
                    formData.consumption_type === 'supplement' ? 'vitamine D, probiotiques, fer' :
                    'mésalazine, cortisone'
                  }`}
                  rows={4}
                />
              </FormField>
              {/* Ressenti après la consommation */}
              <FormField
                label={consumptionService.getAfterEffectsLabel(formData.consumption_type)}
                error={getFieldError('after_effects')}
              >
                <Textarea
                  value={formData.after_effects}
                  onChange={(value) => handleFieldChange('after_effects', value)}
                  disabled={loading}
                  placeholder={
                    formData.consumption_type === 'medication' 
                      ? 'Ex : nausées, somnolence'
                      : 'Ex : ballonnements, douleurs'
                  }
                  rows={3}
                />
              </FormField>

              {/* Bouton de soumission */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Enregistrement...' : consumptionService.getSubmitButtonText(formData.consumption_type)}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </Layout>
    
    {/* Confirmation modal for unsaved changes */}
    <ConfirmNavigationModal
      isOpen={showConfirm}
      onConfirm={confirmNavigation}
      onCancel={cancelNavigation}
    />
    </>
  );
}
