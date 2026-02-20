// Consumption service - unified service for all consumption types
import { ConsumptionType, PrepMode, ConsumptionData } from '../types';
import { supabase } from '../../../lib/supabase';
import { Utensils, Coffee, Pill, Syringe } from 'lucide-react';

export const consumptionService = {
  // Get all consumption types
  getConsumptionTypes(): ConsumptionType[] {
    return [
      { value: 'meal', label: 'Repas', icon: Utensils },
      { value: 'drink', label: 'Boisson', icon: Coffee },
      { value: 'supplement', label: 'Complément', icon: Pill },
      { value: 'medication', label: 'Médicament', icon: Syringe }
    ];
  },

  // Get consumption label based on type
  getConsumptionLabel(consumptionType: string): string {
    switch (consumptionType) {
      case 'meal': return 'Aliments consommés';
      case 'drink': return 'Boisson consommée';
      case 'supplement': return 'Complément pris';
      case 'medication': return 'Médicament pris';
      default: return 'Consommation';
    }
  },

  // Get preparation modes
  getPrepModes(): PrepMode[] {
    return [
      { value: 'grilled', label: 'Grillé', applicableTypes: ['meal'] },
      { value: 'boiled', label: 'Bouilli', applicableTypes: ['meal'] },
      { value: 'fried', label: 'Frit', applicableTypes: ['meal'] },
      { value: 'raw', label: 'Cru', applicableTypes: ['meal'] },
      { value: 'steamed', label: 'Vapeur', applicableTypes: ['meal'] },
      { value: 'hot', label: 'Chaud', applicableTypes: ['drink'] },
      { value: 'cold', label: 'Froid', applicableTypes: ['drink'] },
      { value: 'room_temperature', label: 'Température ambiante', applicableTypes: ['drink'] },
      { value: 'with_food', label: 'Avec repas', applicableTypes: ['supplement', 'medication'] },
      { value: 'empty_stomach', label: 'À jeun', applicableTypes: ['supplement', 'medication'] },
      { value: 'before_meal', label: 'Avant repas', applicableTypes: ['medication'] }
    ];
  },

  // Get prep modes for specific consumption type
  getPrepModesForType(consumptionType: string): PrepMode[] {
    return this.getPrepModes().filter(mode => 
      mode.applicableTypes.includes(consumptionType)
    );
  },

  // Get after effects label based on type
  getAfterEffectsLabel(consumptionType: string): string {
    switch (consumptionType) {
      case 'medication': return 'Effets secondaires du médicament';
      default: return 'Ressenti après la consommation';
    }
  },

  // Get time label based on type
  getTimeLabel(consumptionType: string): string {
    switch (consumptionType) {
      case 'meal': return 'Heure du repas';
      case 'drink': return 'Heure de la boisson';
      case 'supplement': return 'Heure de prise';
      case 'medication': return 'Heure de prise';
      default: return 'Heure de consommation';
    }
  },

  // Get button text based on type
  getSubmitButtonText(consumptionType: string): string {
    switch (consumptionType) {
      case 'meal': return 'Enregistrer le repas';
      case 'drink': return 'Enregistrer la boisson';
      case 'supplement': return 'Enregistrer le complément';
      case 'medication': return 'Enregistrer le médicament';
      default: return 'Enregistrer la consommation';
    }
  },

  // Database operations - Using any cast until consumptions table is added to Supabase types
  async createConsumption(data: Omit<ConsumptionData, 'id' | 'created_at' | 'updated_at'>): Promise<ConsumptionData> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data: result, error } = await (supabase as any)
      .from('consumptions')
      .insert({
        profile_id: data.profile_id,
        consumption: data.consumption,
        consumption_type: data.consumption_type,
        consumption_date: data.consumption_date,
        consumption_time: data.consumption_time,
        prep_mode: data.prep_mode || null,
        after_effects: data.after_effects || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consumption:', error);
      throw error;
    }

    return result;
  },

  async getConsumptions(profileId: string): Promise<ConsumptionData[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await (supabase as any)
      .from('consumptions')
      .select('*')
      .eq('profile_id', profileId)
      .order('consumption_date', { ascending: false })
      .order('consumption_time', { ascending: false });

    if (error) {
      console.error('Error fetching consumptions:', error);
      throw error;
    }

    return data || [];
  },

  async updateConsumption(id: string, data: Partial<ConsumptionData>): Promise<ConsumptionData> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const updateData: any = {};
    if (data.consumption !== undefined) updateData.consumption = data.consumption;
    if (data.consumption_type !== undefined) updateData.consumption_type = data.consumption_type;
    if (data.consumption_date !== undefined) updateData.consumption_date = data.consumption_date;
    if (data.consumption_time !== undefined) updateData.consumption_time = data.consumption_time;
    if (data.prep_mode !== undefined) updateData.prep_mode = data.prep_mode || null;
    if (data.after_effects !== undefined) updateData.after_effects = data.after_effects || null;

    const { data: result, error } = await (supabase as any)
      .from('consumptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consumption:', error);
      throw error;
    }

    return result;
  },

  async deleteConsumption(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await (supabase as any)
      .from('consumptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting consumption:', error);
      throw error;
    }
  },

  // Utility functions
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatTime(time: string): string {
    if (!time) return '';
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  },

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  },

  getCurrentTime(): string {
    return new Date().toTimeString().slice(0, 5);
  }
};

// Legacy compatibility methods for dashboard - temporary until DB migration
export const mealService = {
  getMeals: async (limit: number) => {
    // TODO: Replace with actual consumptions data when DB is ready
    return [];
  },
  createMeal: async (mealData: any) => {
    // TODO: Replace with consumptionService.createConsumption when DB is ready
    return { ...mealData, id: Date.now().toString(), created_at: new Date().toISOString() };
  },
  formatDate: (date: string) => consumptionService.formatDate(date),
  formatTime: (time: string) => consumptionService.formatTime(time)
};


