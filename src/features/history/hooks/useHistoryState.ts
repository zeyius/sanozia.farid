import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HistoryTab, DateFilter } from '../types';

export function useHistoryState() {
  const [searchParams] = useSearchParams();
  
  // Récupérer les paramètres de l'URL
  const initialTab = (searchParams.get('tab') as HistoryTab) || 'consumptions';
  const initialFilter = (searchParams.get('filter') as 'all' | 'today' | 'week') || 'today';
  
  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);
  const [dateFilter, setDateFilter] = useState<DateFilter>(initialFilter);

  // Mettre à jour l'état quand les paramètres URL changent
  useEffect(() => {
    const tab = searchParams.get('tab') as HistoryTab;
    const filter = searchParams.get('filter') as DateFilter;
    
    if (tab && ['consumptions', 'stools', 'symptoms'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (filter && ['all', 'today', 'week'].includes(filter)) {
      setDateFilter(filter);
    }
  }, [searchParams]);

  return {
    activeTab,
    setActiveTab,
    dateFilter,
    setDateFilter
  };
}
