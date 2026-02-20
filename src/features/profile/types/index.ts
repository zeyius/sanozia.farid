// Types for Profile feature - keeping it simple
export interface ProfileFormData {
  name: string;
  birth_date: string;
  gender: string;
  diagnosis: string;
  rectocolite_signature: string;
  last_calprotectin_date: string;
  last_calprotectin_value: string;
  symptom_tracking_enabled: boolean;
  pain_tracking_enabled: boolean;
  stool_tracking_enabled: boolean;
  medication_tracking_enabled: boolean;
}

export interface ProfileFormErrors {
  [key: string]: string;
}

export interface TreatmentData {
  id: string;
  name: string;
  created_at: string;
}
