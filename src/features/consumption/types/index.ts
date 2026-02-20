// Types for Consumption feature - unified for all consumption types
import type { LucideIcon } from 'lucide-react';

// Base consumption data matching the consumptions table
export interface ConsumptionFormData {
  consumption: string;
  consumption_type: string;
  consumption_date: string;
  consumption_time: string;
  prep_mode?: string;
  after_effects?: string;
}

export interface ConsumptionFormErrors {
  [key: string]: string;
}

// Database types matching the consumptions table structure
export interface ConsumptionData {
  id?: string;
  profile_id?: string;
  consumption: string;
  consumption_type: string;
  consumption_date: string;
  consumption_time: string;
  prep_mode?: string;
  after_effects?: string;
  created_at?: string;
  updated_at?: string;
}

// UI helper types
export interface ConsumptionType {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface PrepMode {
  value: string;
  label: string;
  applicableTypes: string[];
}

// Legacy compatibility - will be removed later
export interface MealFormData extends ConsumptionFormData {}
export interface MealData extends ConsumptionData {}
