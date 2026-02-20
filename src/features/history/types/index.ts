// Types for History Analysis feature - keeping it simple
import type { Database } from '../../../lib/supabase';
import type { ConsumptionData } from '../../consumption/types';

export type HistoryTab = 'consumptions' | 'stools' | 'symptoms';

export type DateFilter = 'all' | 'today' | 'week';

// Database types
type Stool = Database['public']['Tables']['stools']['Row'];
type Symptom = Database['public']['Tables']['symptoms']['Row'];

export interface TabConfig {
  id: HistoryTab;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  count: number;
}

export interface DateFilterConfig {
  id: DateFilter;
  label: string;
}

export interface HistoryData {
  consumptions: ConsumptionData[];
  stools: Stool[];
  symptoms: Symptom[];
}

export interface FilteredHistoryData {
  filteredConsumptions: ConsumptionData[];
  filteredStools: Stool[];
  filteredSymptoms: Symptom[];
}
