import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { profileService } from '../../profile/services/profileService';
import { logger } from '../../../shared/utils/logger';
import { onboardingService } from '../services/onboardingService';
import type { OnboardingData, OnboardingContextType, Treatment } from '../types';

// Const for onboarding Steps
export const ONBOARDING_STEPS = {
  PERSONAL_INFO: 1,
  DIAGNOSIS: 2,
  UC_QUESTIONS: 3,
  TREATMENTS: 4
};

// Const for Diagnosis Type
export const DIAGNOSIS_TYPES = {
  NONE: 'aucune',
  ULCERATIVE_COLITIS: 'colite-ulcereuse',
  CROHNS_DISEASE: 'maladie-de-crohn',
  OTHER: 'autre'
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboardingProvider(): OnboardingContextType {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  // No need of useProfile here, we directly create the profile
  
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.PERSONAL_INFO);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    birth_date: '',
    gender: '',
    diagnosis: '',
    rectocolite_signature: '',
    treatments: []
  });

  const updateFormData = useCallback((updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors when user updates data
    setErrors({});
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === ONBOARDING_STEPS.PERSONAL_INFO) {
      if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
      if (!formData.birth_date) newErrors.birth_date = 'La date de naissance est requise';
      if (!formData.gender) newErrors.gender = 'Le sexe est requis';
    }

    // Steps 2, 3, 4 are optional
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const getTotalSteps = useCallback((): number => {
    if (!formData.diagnosis || formData.diagnosis === '' || formData.diagnosis === DIAGNOSIS_TYPES.NONE) {
      return ONBOARDING_STEPS.DIAGNOSIS; // If no diagnosis, only 2 steps
    }
    return formData.diagnosis === DIAGNOSIS_TYPES.ULCERATIVE_COLITIS ? ONBOARDING_STEPS.TREATMENTS : ONBOARDING_STEPS.UC_QUESTIONS;
  }, [formData.diagnosis]);

  const nextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === ONBOARDING_STEPS.DIAGNOSIS) {
      // After diagnosis
      if (!formData.diagnosis || formData.diagnosis === '' || formData.diagnosis === DIAGNOSIS_TYPES.NONE) {
        // No diagnosis, go directly to submit
        submitOnboarding();
        return;
      } else if (formData.diagnosis === DIAGNOSIS_TYPES.ULCERATIVE_COLITIS) {
        // UC, go to specific questions
        setCurrentStep(ONBOARDING_STEPS.UC_QUESTIONS);
      } else {
        // Other diagnosis, go to treatments
        setCurrentStep(ONBOARDING_STEPS.UC_QUESTIONS);
      }
    } else if (currentStep === ONBOARDING_STEPS.UC_QUESTIONS && formData.diagnosis === DIAGNOSIS_TYPES.ULCERATIVE_COLITIS) {
      // After UC questions, go to treatments
      setCurrentStep(ONBOARDING_STEPS.TREATMENTS);
    } else if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    } else {
      // Call submitOnboarding directly to avoid dependency warning
      const handleSubmit = async () => {
        setLoading(true);
        try {
          const result = await onboardingService.completeOnboarding(formData);
          logger.info('✅ [Onboarding] Soumission réussie', { 
            profileId: result.profile.id,
            treatmentCount: formData.treatments.length 
          });
          await refreshUser();
          navigate('/dashboard', { replace: true });
        } catch (error) {
          logger.error('❌ [Onboarding] Erreur soumission', error);
          setErrors({ 
            general: error instanceof Error ? error.message : 'Erreur lors de la création du profil' 
          });
        } finally {
          setLoading(false);
        }
      };
      handleSubmit();
    }
  }, [currentStep, formData, validateStep, getTotalSteps, refreshUser, navigate]);

  const previousStep = useCallback(() => {
    if (currentStep === ONBOARDING_STEPS.TREATMENTS && formData.diagnosis !== DIAGNOSIS_TYPES.ULCERATIVE_COLITIS) {
      // From treatments back to diagnosis (skip UC questions)
      setCurrentStep(ONBOARDING_STEPS.DIAGNOSIS);
    } else if (currentStep > ONBOARDING_STEPS.PERSONAL_INFO) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, formData.diagnosis]);

  const addTreatment = useCallback(() => {
    const newTreatment: Treatment = {
      id: Date.now().toString(),
      name: ''
    };
    setFormData(prev => ({
      ...prev,
      treatments: [...prev.treatments, newTreatment]
    }));
  }, []);

  const updateTreatment = useCallback((id: string, updates: Partial<Treatment>) => {
    setFormData(prev => ({
      ...prev,
      treatments: prev.treatments.map(treatment =>
        treatment.id === id ? { ...treatment, ...updates } : treatment
      )
    }));
  }, []);

  const removeTreatment = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      treatments: prev.treatments.filter(treatment => treatment.id !== id)
    }));
  }, []);

  const submitOnboarding = useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      
      logger.info('🚀 [Onboarding] Début soumission', { 
        step: currentStep,
        hasName: !!formData.name 
      });

      // 1. Créer le profil
      const profileData = {
        name: formData.name,
        birth_date: formData.birth_date,
        gender: formData.gender as 'male' | 'female' | null,
 diagnosis: formData.diagnosis || DIAGNOSIS_TYPES.NONE,
        rectocolite_signature: formData.rectocolite_signature,

        is_profile_complete: true
      };
      
      const profile = await profileService.createProfile(profileData);
      
      // 2. Add Treatments
      for (const treatment of formData.treatments) {
        if (treatment.name.trim()) {
          await profileService.createTreatment({ name: treatment.name });
        }
      }
      
      logger.info('✅ [Onboarding] Soumission réussie', { 
        profileId: profile.id,
        treatmentCount: formData.treatments.length 
      });

      // Refresh user to update profile completion status
      await refreshUser();
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      logger.error('❌ [Onboarding] Erreur soumission', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Erreur lors de la création du profil' 
      });
    } finally {
      setLoading(false);
    }
  }, [formData, currentStep, refreshUser, navigate]);

  return {
    formData,
    currentStep,
    totalSteps: getTotalSteps(),
    errors,
    loading,
    updateFormData,
    validateStep,
    nextStep,
    previousStep,
    submitOnboarding,
    addTreatment,
    updateTreatment,
    removeTreatment
  };
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    console.error('useOnboarding: Context not found, OnboardingProvider missing');
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

export { OnboardingContext };
