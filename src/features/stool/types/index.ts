// Types for Stool Tracking feature - enriched model
export interface StoolFormData {
  consistency: number;
  // Nouveaux champs enrichis
  blood_level: 'none' | 'trace' | 'moderate' | 'severe';
  mucus_level: 'none' | 'trace' | 'moderate' | 'severe';
  stool_color: string;
  evacuation_effort: string;
  duration_minutes: number;
  pain_level: number;
  notes: string;
  // Champs existants
  urgency: 'none' | 'moderate' | 'severe';
  stool_time: string;
  no_stool_details: string;
  // Rétrocompatibilité (à supprimer après migration complète)
  has_blood?: boolean;
  has_mucus?: boolean;
}

export interface StoolFormErrors {
  [key: string]: string;
}

export interface StoolData {
  consistency: number;
  // Nouveaux champs enrichis
  blood_level?: string;
  mucus_level?: string;
  stool_color?: string;
  evacuation_effort?: string;
  duration_minutes?: number;
  pain_level?: number;
  notes?: string;
  // Champs existants
  urgency: 'none' | 'moderate' | 'severe';
  stool_date: string;
  stool_time: string;
  // Rétrocompatibilité (à supprimer après migration complète)
  has_blood?: boolean;
  has_mucus?: boolean;
}

export interface StoolConsistency {
  value: number;
  label: string;
  description: string;
  medicalNote: string;
  backgroundColor: string;
  selectedColor: string;
}

export interface UrgencyLevel {
  value: 'none' | 'moderate' | 'severe';
  label: string;
}
