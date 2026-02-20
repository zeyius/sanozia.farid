// Types for Symptom Tracking feature - keeping it simple
export interface SymptomFormData {
  // Champs obligatoires
  notes: string;
  capture_date: string;
  capture_time: string;
  global_feeling: 'bad' | 'ok' | 'good' | 'excellent' | '';
  // Symptômes dynamiques basés sur le catalogue
  [key: string]: number | string | boolean;
}

export interface SymptomFormErrors {
  [key: string]: string;
}

// SymptomData represents the structure returned by the symptom service
export type SymptomData = {
  id: string;
  profile_id: string;
  global_feeling: 'bad' | 'ok' | 'good' | 'excellent';
  capture_date: string;
  capture_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export interface SymptomType {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}
