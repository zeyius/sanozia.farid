// History Analysis service - utility functions extracted from HistoryPage
import { parseISO, isToday, isYesterday, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UtensilsCrossed, Toilet, Heart, Coffee, Pill, Syringe } from 'lucide-react';
import { stoolService } from '../../stool/services/stoolService';
import type { HistoryTab, DateFilter, TabConfig, DateFilterConfig } from '../types';

export const historyService = {
  // Date formatting utilities
  formatDate: (dateString: string): string => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Aujourd\'hui';
    if (isYesterday(date)) return 'Hier';
    return format(date, 'dd MMM yyyy', { locale: fr });
  },

  formatTime: (timeString: string): string => {
    // S'assurer de ne garder que HH:MM même si des secondes sont présentes
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString.slice(0, 5); // HH:MM
  },

  // Date filtering logic
  filterByDate: <T extends Record<string, any>>(items: T[], dateField: string, dateFilter: DateFilter): T[] => {
    if (dateFilter === 'all') return items;
    
    const now = new Date();
    return items.filter(item => {
      const itemDate = parseISO((item as any)[dateField] as string);
      if (dateFilter === 'today') {
        return isToday(itemDate);
      }
      if (dateFilter === 'week') {
        const weekAgo = subDays(now, 7);
        return itemDate >= weekAgo;
      }
      return true;
    });
  },

  // Tab configuration
  getTabs: <T, U, V>(filteredConsumptions: T[], filteredStools: U[], filteredSymptoms: V[]): TabConfig[] => [
    { id: 'consumptions' as const, label: 'Consommations', icon: UtensilsCrossed, count: filteredConsumptions.length },
    { id: 'stools' as const, label: 'Selles', icon: Toilet, count: filteredStools.length },
    { id: 'symptoms' as const, label: 'Ressenti', icon: Heart, count: filteredSymptoms.length }
  ],

  // Date filter configuration
  getDateFilters: (): DateFilterConfig[] => [
    { id: 'all' as const, label: 'Tout' },
    { id: 'today' as const, label: 'Aujourd\'hui' },
    { id: 'week' as const, label: '7 jours' }
  ],

  // Navigation helper
  getNavigationPath: (activeTab: HistoryTab): string => {
    if (activeTab === 'consumptions') return '/meal';
    if (activeTab === 'stools') return '/stool';
    if (activeTab === 'symptoms') return '/symptom';
    return '/meal';
  },

  // Intensity styling helper - harmonisé avec les couleurs d'édition
  getIntensityStyle: (intensity: number): string => {
    if (intensity === 1) return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    if (intensity === 2) return 'bg-orange-50 text-orange-700 border border-orange-200';
    if (intensity === 3) return 'bg-red-50 text-red-700 border border-red-200';
    if (intensity === 4) return 'bg-red-100 text-red-800 border border-red-300';
    return 'bg-gray-50 text-gray-700 border border-gray-200';
  },

  // Consumption type helpers
  getConsumptionTypeIcon: (consumptionType: string) => {
    switch (consumptionType) {
      case 'repas': return UtensilsCrossed;
      case 'boisson': return Coffee;
      case 'complement': return Pill;
      case 'medicament': return Syringe;
      default: return UtensilsCrossed;
    }
  },

  getConsumptionTypeLabel: (consumptionType: string): string => {
    switch (consumptionType) {
      case 'repas': return 'Repas';
      case 'boisson': return 'Boisson';
      case 'complement': return 'Complément';
      case 'medicament': return 'Médicament';
      default: return 'Consommation';
    }
  },

  // Stool helpers
  getStoolDescription: (consistency: number): string => {
    const consistencies = stoolService.getStoolConsistencies();
    const stoolType = consistencies.find(c => c.value === consistency);
    return stoolType?.description || `Type ${consistency}`;
  },

  getStoolTitle: (consistency: number): string => {
    const consistencies = stoolService.getStoolConsistencies();
    const stoolType = consistencies.find(c => c.value === consistency);
    // Pour le Type 8, retourner directement "Envie fécale"
    if (consistency === 8) {
      return 'Envie fécale';
    }
    // Pour tous les autres types, retourner le LABEL (titre court) pas la description
    return stoolType?.label || `Type ${consistency}`;
  },

  getBloodPresenceText: (hasBlood: boolean): string => {
    return hasBlood ? 'Présence de sang' : 'Pas de sang';
  },

  getBloodPresenceStyle: (hasBlood: boolean): string => {
    return hasBlood 
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800';
  },

  getStoolTypeColor: (consistency: number): string => {
    const consistencies = stoolService.getStoolConsistencies();
    const stoolType = consistencies.find(c => c.value === consistency);
    return stoolType?.selectedColor || 'bg-gray-200 text-gray-800';
  },

  // Blood level styling with unified color coding
  getBloodLevelStyle: (level: string): string => {
    switch (level) {
      case 'aucune': return 'bg-gray-100 text-gray-600';
      case 'trace': return 'bg-yellow-100 text-yellow-700';
      case 'moderee': return 'bg-orange-100 text-orange-700';
      case 'severe': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  },

  getBloodLevelText: (level: string): string => {
    switch (level) {
      case 'aucune': return 'Pas de sang';
      case 'trace': return 'Sang (trace)';
      case 'moderee': return 'Sang (modéré)';
      case 'severe': return 'Sang (sévère)';
      default: return 'Pas de sang';
    }
  },

  // Mucus level styling with unified color coding
  getMucusLevelStyle: (level: string): string => {
    switch (level) {
      case 'aucune': return 'bg-gray-100 text-gray-600';
      case 'trace': return 'bg-yellow-100 text-yellow-700';
      case 'moderee': return 'bg-orange-100 text-orange-700';
      case 'severe': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  },

  getMucusLevelText: (level: string): string => {
    switch (level) {
      case 'aucune': return 'Pas de mucosité';
      case 'trace': return 'Mucosité (trace)';
      case 'moderee': return 'Mucosité (modérée)';
      case 'severe': return 'Mucosité (sévère)';
      default: return 'Pas de mucosité';
    }
  }
};
