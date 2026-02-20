import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../dashboard/hooks/useDashboardData';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { SmartDateTimePicker } from '../../../shared/components/SmartDateTimePicker';
import { Dropdown } from '../../../shared/components/Dropdown';
import { ConfirmNavigationModal } from '../../../shared/components/ConfirmNavigationModal';
import { BristolInfoModal } from '../../../shared/components/BristolInfoModal';
import { useFormDirtyState } from '../../../shared/hooks/useFormDirtyState';
import { useNavigateWithConfirmation } from '../../../shared/hooks/useNavigateWithConfirmation';
import { Slider } from '../../../shared/components/Slider';
import { BristolGrid } from '../../../shared/components/BristolGrid';
import { URGENCY_LEVELS, BLOOD_LEVELS, MUCUS_LEVELS, DURATION_PRESETS, EVACUATION_EFFORTS, PAIN_LEVELS, BRISTOL_TYPES } from '../../../shared/constants';
import { format } from 'date-fns';
import { logger, loggerContexts } from '../../../shared/utils/logger';

export function StoolPage() {
  const navigate = useNavigate();
  const { addStool } = useDashboardData();
  
  // Initial form values
  const initialFormData = useMemo(() => ({
    consistency: 0,
    blood_level: 'none' as 'none' | 'trace' | 'moderate' | 'severe',
    mucus_level: 'none' as 'none' | 'trace' | 'moderate' | 'severe',
    urgency: 'none' as 'none' | 'moderate' | 'severe',
    stool_date: format(new Date(), 'yyyy-MM-dd'),
    stool_time: format(new Date(), 'HH:mm'),
    duration_minutes: 2 as number,
    evacuation_effort: 'easy' as string,
    pain_level: 0 as number,
    notes: ''
  }), []);
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showBristolInfo, setShowBristolInfo] = useState(false);
  const [bristolInfoType, setBristolInfoType] = useState(1);
  
  // Track if form is dirty (has unsaved changes)<
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
    
    if (!formData.consistency || formData.consistency === 0 || formData.consistency < 1 || formData.consistency > 8) {
      newErrors.consistency = 'Veuillez sélectionner une consistance';
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

    setLoading(true);
    try {
      await addStool({
        consistency: formData.consistency,
        urgency: formData.urgency,
        blood_level: formData.blood_level,
        mucus_level: formData.mucus_level,
        duration_minutes: formData.duration_minutes,
        evacuation_effort: formData.evacuation_effort,
        pain_level: formData.pain_level,
        notes: formData.notes || null,
        stool_date: formData.stool_date,
        stool_time: formData.stool_time
      });

      navigate('/dashboard');
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer les erreurs quand l'utilisateur modifie un champ
    if (showValidationErrors) {
      setShowValidationErrors(false);
      setErrors({});
    }
  };

  const handleBristolInfoClick = (type: number) => {
    setBristolInfoType(type);
    setShowBristolInfo(true);
  };

  return (
    <>
      <Layout 
        title="Suivi des selles" 
        showBackButton
        onBackClick={() => handleNavigate('/dashboard')}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Date et Heure */}
          <SmartDateTimePicker
            dateValue={formData.stool_date || format(new Date(), 'yyyy-MM-dd')}
            timeValue={formData.stool_time}
            onDateChange={(value) => handleFieldChange('stool_date', value)}
            onTimeChange={(value) => {
              logger.debug('TimePicker onChange called with:', { value }, loggerContexts.STOOL);
              handleFieldChange('stool_time', value);
            }}
            dateLabel="Date"
            timeLabel="Heure"
            disabled={loading}
            timeError={getFieldError('stool_time')}
          />

          {/* 2. Consistance (échelle de Bristol) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Consistance (échelle de Bristol) {getFieldError('consistency') && <span className="text-red-500">*</span>}
            </label>
            <BristolGrid
              types={BRISTOL_TYPES}
              value={formData.consistency}
              onValueChange={(value) => handleFieldChange('consistency', value)}
              onInfoClick={handleBristolInfoClick}
            />
            {getFieldError('consistency') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('consistency')}</p>
            )}
          </div>

          {/* 3. Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Notes (optionnel)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Ajoutez des détails supplémentaires si nécessaire..."
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border-2 border-[#e3c79f] rounded-lg focus:outline-none focus:border-[#b36b43] bg-white/80 backdrop-blur-sm transition-colors resize-none"
            />
          </div>

          {/* Detailed information - Only show if consistency is selected */}
          {formData.consistency > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Détails supplémentaires</h3>
              <div className="grid grid-cols-1 gap-6">
                {/* 1. Urgence - Capturé à chaque fois */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-lg border border-[#e3c79f]/30 hover:shadow-xl transition-all duration-200">
                  <Slider
                    steps={URGENCY_LEVELS.map(level => level.label)}
                    value={URGENCY_LEVELS.find(level => level.value === formData.urgency)?.label || 'Aucune'}
                    onValueChange={(label) => {
                      const level = URGENCY_LEVELS.find(l => l.label === label);
                      if (level) handleFieldChange('urgency', level.value);
                    }}
                    label="Urgence"
                    showBadge={true}
                  />
                </div>

                {/* 2. Durée aux toilettes - Capturé à chaque fois */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-lg border border-[#e3c79f]/30 hover:shadow-xl transition-all duration-200">
                  <Slider
                    steps={DURATION_PRESETS.map(d => d.value.toString())}
                    value={formData.duration_minutes?.toString() || '2'}
                    onValueChange={(value) => handleFieldChange('duration_minutes', parseInt(value))}
                    label="Temps aux toilettes"
                    showBadge={true}
                    badgeFormatter={(value) => {
                      const duration = DURATION_PRESETS.find(d => d.value === parseInt(value));
                      return duration ? duration.label : `${value} min`;
                    }}
                  />
                </div>

                {/* 3. Effort d'évacuation - Capturé à chaque fois */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-lg border border-[#e3c79f]/30 hover:shadow-xl transition-all duration-200">
                  <Slider
                    steps={EVACUATION_EFFORTS.map(effort => effort.label)}
                    value={EVACUATION_EFFORTS.find(effort => effort.value === formData.evacuation_effort)?.label || 'Normal'}
                    onValueChange={(label) => {
                      const effort = EVACUATION_EFFORTS.find(e => e.label === label);
                      if (effort) handleFieldChange('evacuation_effort', effort.value);
                    }}
                    label="Effort d'évacuation"
                    showBadge={true}
                  />
                </div>

                {/* 4. Niveau de douleur - Souvent présent */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-lg border border-[#e3c79f]/30 hover:shadow-xl transition-all duration-200">
                  <Slider
                    steps={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
                    value={formData.pain_level.toString()}
                    onValueChange={(value) => handleFieldChange('pain_level', parseInt(value))}
                    label="Niveau de douleur"
                    showBadge={true}
                    badgeFormatter={(value) => {
                      const painLevel = PAIN_LEVELS.find(p => p.value === parseInt(value));
                      return painLevel ? `${value} - ${painLevel.label}` : value;
                    }}
                  />
                </div>

                {/* 5. Présence de sang - Seulement lors de poussées */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-lg border border-[#e3c79f]/30 hover:shadow-xl transition-all duration-200">
                  <Slider
                    steps={BLOOD_LEVELS.map(level => level.label)}
                    value={BLOOD_LEVELS.find(level => level.value === formData.blood_level)?.label || 'Aucune'}
                    onValueChange={(label) => {
                      const level = BLOOD_LEVELS.find(l => l.label === label);
                      if (level) handleFieldChange('blood_level', level.value);
                    }}
                    label="Présence de sang"
                    showBadge={true}
                  />
                </div>

                {/* 6. Présence de mucosité - Seulement lors de poussées */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-lg border border-[#e3c79f]/30 hover:shadow-xl transition-all duration-200">
                  <Slider
                    steps={MUCUS_LEVELS.map(level => level.label)}
                    value={MUCUS_LEVELS.find(level => level.value === formData.mucus_level)?.label || 'Aucune'}
                    onValueChange={(label) => {
                      const level = MUCUS_LEVELS.find(l => l.label === label);
                      if (level) handleFieldChange('mucus_level', level.value);
                    }}
                    label="Présence de mucosité"
                    showBadge={true}
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </div>
    </Layout>
    
    {/* Confirmation modal for unsaved changes */}
    <ConfirmNavigationModal
      isOpen={showConfirm}
      onConfirm={confirmNavigation}
      onCancel={cancelNavigation}
    />
    
    {/* Bristol info modal */}
    <BristolInfoModal
      isOpen={showBristolInfo}
      currentType={bristolInfoType}
      onClose={() => setShowBristolInfo(false)}
      onNavigate={(type) => setBristolInfoType(type)}
    />
    </>
  );
}
