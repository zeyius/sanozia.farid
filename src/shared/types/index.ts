import type { UserIdentity } from '@supabase/supabase-js';

// === TYPES UTILISATEUR UNIFIÉS ===

// Profil utilisateur de base (correspond aux données Supabase)

export interface UserProfile {
  id: string;
  name: string;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  diagnosis: string | null;
  rectocolite_signature?: string | null;
  last_calprotectin_value?: number | null;
  last_calprotectin_date?: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
  // Catalogue de symptômes personnalisé
  symptom_catalog?: SymptomCatalogItem[] | null;
}

// Définition d'un élément du catalogue de symptômes
export interface SymptomCatalogItem {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
}

// Utilisateur authentifié avec profil (type principal d'authentification)
// Compatible avec le type User de Supabase
export interface AuthUser {
  id: string;
  email?: string; // Optionnel pour compatibilité Supabase
  email_confirmed_at?: string;
  created_at?: string; // Optionnel pour compatibilité Supabase
  updated_at?: string; // Optionnel pour compatibilité Supabase
  profile?: UserProfile;
  // Autres champs Supabase potentiels
  aud?: string;
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  identities?: UserIdentity[];
  [key: string]: unknown; // Pour flexibilité avec Supabase
}

// Type métier pour l'application (avec nommage camelCase)
export interface User {
  id: string;
  email: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  diagnosis: string;
  treatments: Treatment[];
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Treatment {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface Meal {
  id: string;
  userId: string;
  foods: string;
  cookingMethod: string;
  time: string;
  date: string;
  symptomsAfter: string;
  createdAt: Date;
}

export interface Stool {
  id: string;
  userId: string;
  consistency: number;
  hasBlood: boolean;
  hasMucus: boolean;
  urgency: 'none' | 'moderate' | 'severe';
  date: string;
  time: string;
  createdAt: Date;
}

export interface Symptom {
  id: string;
  userId: string;
  abdominalPain: number;
  jointPain: number;
  fatigue: number;
  bloating: number;
  stress: number;
  other: string;
  date: string;
  time: string;
  createdAt: Date;
}

export interface DailyStats {
  mealsCount: number;
  symptomsCount: number;
  stoolsCount: number;
  date: string;
}

export type CookingMethod = 'vapeur' | 'bouilli' | 'grille' | 'cru' | 'frit' | 'roti' | 'micro-ondes';
export type Diagnosis = 'crohn' | 'colite-ulcereuse' | 'colite-indeterminee' | 'autre';
export type IntensityLevel = 0 | 1 | 2 | 3 | 4; // Aucun, Léger, Modéré, Fort, Sévère