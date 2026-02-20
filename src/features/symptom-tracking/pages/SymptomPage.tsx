import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { SmartDateTimePicker } from '../../../shared/components/SmartDateTimePicker';
import { RessentiFeelingCard } from '../../../shared/components/RessentiFeelingCard';
import { SymptomCatalogModal } from '../../profile/components/SymptomCatalogModal';
import { ConfirmNavigationModal } from '../../../shared/components/ConfirmNavigationModal';
import { useFormDirtyState } from '../../../shared/hooks/useFormDirtyState';
import { useNavigateWithConfirmation } from '../../../shared/hooks/useNavigateWithConfirmation';
import { Settings, Laugh } from 'lucide-react';
import { format } from 'date-fns';
import { logger, loggerContexts } from '../../../shared/utils/logger';
import { symptomService } from '../services/symptomService';
import { profileService } from '../../profile/services/profileService';
import { useAuth } from '../../auth';
import type { SymptomType, SymptomFormData } from '../types';
import type { SymptomCatalogItem } from '../../../shared/types';

export function SymptomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [symptomTypes, setSymptomTypes] = useState<SymptomType[]>([]);
  const [initialFormData, setInitialFormData] = useState<SymptomFormData>({
    capture_date: format(new Date(), 'yyyy-MM-dd'),
    capture_time: format(new Date(), 'HH:mm'),
    global_feeling: '',
    notes: ''
  });
  const [formData, setFormData] = useState<SymptomFormData>({
    capture_date: format(new Date(), 'yyyy-MM-dd'),
    capture_time: format(new Date(), 'HH:mm'),
    global_feeling: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Track if form is dirty (has unsaved changes)
  const { isDirty } = useFormDirtyState(initialFormData, formData);
  
  // Handle navigation with confirmation
  const { handleNavigate, showConfirm, confirmNavigation, cancelNavigation } = 
    useNavigateWithConfirmation(isDirty);

  // Loading user profile and symptoms from the user catalog
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user profile
        if (user?.id) {
          const profile = await profileService.getProfile();
          setUserProfile(profile);
        }
        
        const types = await symptomService.getEnabledSymptomTypes();
        setSymptomTypes(types);
        
        // Initialize formData dynamically based on catalog symptoms
        const initialFormData: SymptomFormData = {
        capture_date: format(new Date(), 'yyyy-MM-dd'),
        capture_time: format(new Date(), 'HH:mm'),
          global_feeling: '',
          notes: ''
        } as SymptomFormData;
        
        // Initialize all symptoms from catalog to 0
        types.forEach(symptom => {
          initialFormData[symptom.key] = 0;
        });
        
        setInitialFormData(initialFormData);
        setFormData(initialFormData);
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        // Fallback to default symptoms
        const defaultTypes = symptomService.getDefaultSymptomTypes();
        setSymptomTypes(defaultTypes);
        
        // Initialize with default symptoms
        const fallbackFormData: SymptomFormData = {
          capture_date: format(new Date(), 'yyyy-MM-dd'),
          capture_time: format(new Date(), 'HH:mm'),
          global_feeling: '',
          notes: ''
        } as SymptomFormData;
        
        defaultTypes.forEach(symptom => {
          fallbackFormData[symptom.key] = 0;
        });
        
        setInitialFormData(fallbackFormData);
        setFormData(fallbackFormData);
      }
    };
    
    loadUserData();
  }, [user?.id]);

  const getFieldError = (fieldName: string): string | undefined => {
    if (!showValidationErrors) return undefined;
    return errors[fieldName];
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.capture_date) {
      newErrors.capture_date = 'La date est requise';
    }
    
    if (!formData.capture_time) {
      newErrors.capture_time = 'L\'heure est requise';
    }
    
    if (!formData.global_feeling) {
      newErrors.global_feeling = 'Veuillez sélectionner votre ressenti global';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    if (!validate()) return;
    setLoading(true);
    try {
      // Save to database using formData directly
      await symptomService.createSymptom(formData);
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : "Erreur lors de l'enregistrement" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user modifies a field
    if (showValidationErrors) {
      setShowValidationErrors(false);
      setErrors({});
    }
  };

  // Handle symptom catalog update
  const handleUpdateSymptomCatalog = async (catalog: SymptomCatalogItem[]) => {
    try {
      await profileService.updateSymptomCatalog(catalog);
      // Reload symptom types after catalog update
      const types = await symptomService.getEnabledSymptomTypes();
      setSymptomTypes(types);
      
      // Update formData to include new symptoms
      const updatedFormData = { ...formData };
      types.forEach(symptom => {
        if (!(symptom.key in updatedFormData)) {
          updatedFormData[symptom.key] = 0;
        }
      });
      setFormData(updatedFormData);
      
      // Update user profile
      if (user?.id) {
        const profile = await profileService.getProfile();
        setUserProfile(profile);
      }
      
      // Close the modal after successful save
      setIsSymptomModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du catalogue de symptômes:', error);
    }
  };

  return (
    <>
      <Layout 
        title="Scan du jour" 
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
          {/* Date & Heure - Smart Responsive Layout */}
          <SmartDateTimePicker
            dateValue={formData.capture_date}
            timeValue={formData.capture_time}
            onDateChange={(value) => handleFieldChange('capture_date', value)}
            onTimeChange={(value) => {
              logger.debug('TimePicker onChange called with:', { value }, loggerContexts.SYMPTOM);
              handleFieldChange('capture_time', value);
            }}
            dateLabel="Date"
            timeLabel="Heure"
            disabled={loading}
            dateError={getFieldError('capture_date')}
            timeError={getFieldError('capture_time')}
          />

          {/* Global Feeling */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Comment vous sentez-vous ?
            </label>
            {getFieldError('global_feeling') && (
              <div className="text-red-500 text-sm">{getFieldError('global_feeling')}</div>
            )}
            <div className="grid grid-cols-4 gap-3">
              {[
                { 
                  value: 'bad', 
                  label: 'Mal', 
                  icon: (
                    <svg className="w-6 h-6" fill="#303d25" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="#303d25" strokeWidth="2"/>
                      <path d="M8 15s1.5-2 4-2 4 2 4 2" stroke="#303d25" strokeWidth="2" fill="none"/>
                      <circle cx="9" cy="9" r="1" fill="#303d25"/>
                      <circle cx="15" cy="9" r="1" fill="#303d25"/>
                    </svg>
                  )
                },
                { 
                  value: 'ok', 
                  label: 'Moyen', 
                  icon: (
                    <svg className="w-6 h-6" fill="#303d25" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="#303d25" strokeWidth="2"/>
                      <line x1="8" y1="15" x2="16" y2="15" stroke="#303d25" strokeWidth="2"/>
                      <circle cx="9" cy="9" r="1" fill="#303d25"/>
                      <circle cx="15" cy="9" r="1" fill="#303d25"/>
                    </svg>
                  )
                },
                { 
                  value: 'good', 
                  label: 'Bien', 
                  icon: (
                    <svg className="w-6 h-6" fill="#303d25" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="#303d25" strokeWidth="2"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#303d25" strokeWidth="2" fill="none"/>
                      <circle cx="9" cy="9" r="1" fill="#303d25"/>
                      <circle cx="15" cy="9" r="1" fill="#303d25"/>
                    </svg>
                  )
                },
                { 
                  value: 'excellent', 
                  label: 'Excellent', 
                  icon: <Laugh size={24} color="#303d25" />
                }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange('global_feeling', option.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    formData.global_feeling === option.value
                      ? 'border-[#b36b43] bg-[#b36b43]/10 text-[#b36b43]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-[#b36b43]/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div>{option.icon}</div>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Section - Only show if global feeling is selected */}
          {formData.global_feeling && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Symptômes ressentis</h3>
              <div className="grid grid-cols-1 gap-6">
                {symptomTypes.map((symptom) => (
                  <RessentiFeelingCard
                    key={symptom.key}
                    label={symptom.label}
                    icon={symptom.icon}
                    intensity={formData[symptom.key as keyof SymptomFormData] as number || 0}
                    onIntensityChange={(v) => handleFieldChange(symptom.key, v)}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              disabled={loading}
              placeholder="Ajoutez des notes sur votre ressenti du jour..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
          </div>

          {/* link to manage symptoms/feelings */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsSymptomModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-[#b36b43] hover:bg-[#f9eddf] rounded-lg transition-colors duration-200"
            >
              <Settings size={20} />
              <span className="font-medium">Personnaliser mes symptômes</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#b36b43] hover:bg-[#303d25] disabled:bg-[#c2be98] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Symptom Catalog Modal */}
      <SymptomCatalogModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        catalog={userProfile?.symptom_catalog as SymptomCatalogItem[] | null}
        onUpdate={handleUpdateSymptomCatalog}
        diagnosis={userProfile?.diagnosis || undefined}
      />
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
