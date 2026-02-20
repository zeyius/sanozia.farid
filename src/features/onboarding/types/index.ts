export interface OnboardingData {
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | '';
  diagnosis: string;
  rectocolite_signature: string;
  treatments: Treatment[];
}

export interface Treatment {
  id: string;
  name: string;
}

export interface OnboardingStep {
  step: number;
  isValid: boolean;
  canProceed: boolean;
}

export interface OnboardingContextType {
  formData: OnboardingData;
  currentStep: number;
  totalSteps: number;
  errors: Record<string, string>;
  loading: boolean;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  validateStep: (step: number) => boolean;
  nextStep: () => void;
  previousStep: () => void;
  submitOnboarding: () => Promise<void>;
  addTreatment: () => void;
  updateTreatment: (id: string, updates: Partial<Treatment>) => void;
  removeTreatment: (id: string) => void;
}
