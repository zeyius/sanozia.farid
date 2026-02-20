import React, { useRef, useEffect, useState } from 'react';
import { Calendar, Clock, Edit2, Trash2, Utensils, Coffee, Pill, Syringe, AlertCircle, CheckCircle } from 'lucide-react';
import { SmartDateTimePicker } from '../../../../shared/components/SmartDateTimePicker';
import { Select } from '../../../../shared/components/Select';
import { ConsumptionEditModal } from '../ConsumptionEditModal';
import { historyService } from '../../services/historyService';
import { COOKING_METHODS } from '../../../../shared/constants';
import { consumptionService } from '../../../consumption/services/consumptionService';
import type { ConsumptionData } from '../../../consumption/types';
import type { DateFilter } from '../../types';

interface ConsumptionHistoryTabProps {
  consumptions: ConsumptionData[];
  filteredConsumptions: ConsumptionData[];
  dateFilter: DateFilter;
  isAddingConsumption: boolean;
  editingConsumption: ConsumptionData | null;
  consumptionFormData: {
    consumption_date: string;
    consumption_time: string;
    consumption: string;
    consumption_type: string;
    prep_mode: string;
    after_effects: string;
  };
  setConsumptionFormData: React.Dispatch<React.SetStateAction<{
    consumption_date: string;
    consumption_time: string;
    consumption: string;
    consumption_type: string;
    prep_mode: string;
    after_effects: string;
  }>>;
  saving: boolean;
  deletingItemId: string | null;
  recentlySavedId: string | null;
  handleEditConsumption: (consumption: ConsumptionData) => void;
  handleSaveConsumption: () => void;
  handleCancelEdit: () => void;
  handleDeleteItem: (itemId: string, type: "stool" | "consumption" | "symptom") => void;
}

export function ConsumptionHistoryTab({
  consumptions,
  filteredConsumptions,
  dateFilter,
  isAddingConsumption,
  editingConsumption,
  consumptionFormData,
  setConsumptionFormData,
  saving,
  deletingItemId,
  recentlySavedId,
  handleEditConsumption,
  handleSaveConsumption,
  handleCancelEdit,
  handleDeleteItem,
}: ConsumptionHistoryTabProps) {
  const addFormRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fonctions utilitaires pour l'affichage amélioré
  const getConsumptionIcon = (type: string) => {
    switch (type) {
      case 'meal': return Utensils;
      case 'drink': return Coffee;
      case 'supplement': return Pill;
      case 'medication': return Syringe;
      default: return Utensils;
    }
  };

  const getConsumptionColor = (type: string) => {
    switch (type) {
      case 'meal': return 'bg-green-100 text-green-700 border-green-200';
      case 'drink': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'supplement': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'medication': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getConsumptionHexColor = (type: string) => {
    switch (type) {
      case 'meal': return '#6b7280'; // gray-500 - plus sobre
      case 'drink': return '#64748b'; // slate-500 - subtil
      case 'supplement': return '#78716c'; // stone-500 - neutre
      case 'medication': return '#b36b43'; // couleur principale de l'app
      default: return '#9ca3af'; // gray-400
    }
  };

  const getConsumptionTypeLabel = (type: string) => {
    switch (type) {
      case 'meal': return 'Repas';
      case 'drink': return 'Boisson';
      case 'supplement': return 'Complément';
      case 'medication': return 'Médicament';
      default: return 'Consommation';
    }
  };

  const getPrepModeLabel = (value: string) => {
    const prepModes = consumptionService.getPrepModes();
    const mode = prepModes.find(mode => mode.value === value);
    return mode ? mode.label : value;
  };

  // Grouper les consommations par date
  const groupedConsumptions = filteredConsumptions.reduce((groups, consumption) => {
    const date = consumption.consumption_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(consumption);
    return groups;
  }, {} as Record<string, ConsumptionData[]>);

  // Trier les dates (plus récentes en premier)
  const sortedDates = Object.keys(groupedConsumptions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Obtenir les types de consommations disponibles
  const consumptionTypes = consumptionService.getConsumptionTypes();
  const consumptionTypeOptions = consumptionTypes.map(type => ({
    value: type.value,
    label: type.label
  }));
  
  // Obtenir les modes de préparation selon le type sélectionné
  const availablePrepModes = consumptionService.getPrepModesForType(consumptionFormData.consumption_type);
  const prepModeOptions = availablePrepModes.map(mode => ({
    value: mode.value,
    label: mode.label
  }));

  // Scroll automatique vers le formulaire d'ajout
  useEffect(() => {
    if (isAddingConsumption && addFormRef.current) {
      addFormRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isAddingConsumption]);

  // Scroll automatique vers l'élément récemment sauvegardé
  useEffect(() => {
    if (recentlySavedId && itemRefs.current[recentlySavedId]) {
      setTimeout(() => {
        itemRefs.current[recentlySavedId]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100); // Petit délai pour s'assurer que le DOM est mis à jour
    }
  }, [recentlySavedId]);

  return (
    <>
      {/* Formulaire d'ajout rapide pour consommations - EN PREMIER */}
      {isAddingConsumption && (
        <div 
          ref={addFormRef}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-[#b36b43]/60"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#303d25]/60" />
              <span className="text-sm text-[#b36b43] font-medium">Nouvelle consommation</span>
            </div>
            
            {/* Formulaire d'ajout */}
            <div className="space-y-4">
              {/* Sélection du type de consommation */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-2">Type de consommation</label>
                <Select
                  value={consumptionFormData.consumption_type}
                  onChange={(value) => {
                    // Mettre à jour le type de consommation et réinitialiser le mode de préparation
                    setConsumptionFormData(prev => ({ ...prev, consumption_type: value, prep_mode: '' }));
                  }}
                  options={consumptionTypeOptions}
                  placeholder="Sélectionnez un type"
                />
              </div>

              {/* Date et Heure - Smart Responsive */}
              <SmartDateTimePicker
                dateValue={consumptionFormData.consumption_date}
                timeValue={consumptionFormData.consumption_time}
                onDateChange={(value) => setConsumptionFormData(prev => ({ ...prev, consumption_date: value }))}
                onTimeChange={(time) => setConsumptionFormData(prev => ({ ...prev, consumption_time: time }))}
                dateLabel="Date"
                timeLabel={consumptionService.getTimeLabel(consumptionFormData.consumption_type)}
                isModal={true}
              />

              {/* Consommation avec label adaptatif */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-2">
                  {consumptionService.getConsumptionLabel(consumptionFormData.consumption_type)}
                </label>
                <textarea
                  value={consumptionFormData.consumption}
                  onChange={(e) => setConsumptionFormData(prev => ({ ...prev, consumption: e.target.value }))}
                  className="w-full p-3 border border-[#e3c79f] rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent resize-none"
                  rows={3}
                  placeholder={`Décrire ${consumptionFormData.consumption_type === 'meal' ? 'les aliments consommés' : consumptionFormData.consumption_type === 'drink' ? 'la boisson' : consumptionFormData.consumption_type === 'supplement' ? 'le complément' : 'le médicament'}...`}
                />
              </div>
              
              {/* Mode de préparation adaptatif */}
              {availablePrepModes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#303d25] mb-2">
                    {consumptionFormData.consumption_type === 'meal' ? 'Mode de préparation' : 
                     consumptionFormData.consumption_type === 'drink' ? 'Température' : 
                     'Mode de prise'}
                  </label>
                  <Select
                    value={consumptionFormData.prep_mode}
                    onChange={(value) => setConsumptionFormData(prev => ({ ...prev, prep_mode: value }))}
                    options={prepModeOptions}
                    placeholder={`Sélectionnez ${consumptionFormData.consumption_type === 'meal' ? 'un mode de préparation' : consumptionFormData.consumption_type === 'drink' ? 'une température' : 'un mode de prise'}`}
                  />
                </div>
              )}
              
              {/* Effets après avec label adaptatif */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-2">
                  {consumptionService.getAfterEffectsLabel(consumptionFormData.consumption_type)} (optionnel)
                </label>
                <textarea
                  value={consumptionFormData.after_effects}
                  onChange={(e) => setConsumptionFormData(prev => ({ ...prev, after_effects: e.target.value }))}
                  className="w-full p-3 border border-[#e3c79f] rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent resize-none"
                  rows={2}
                  placeholder={consumptionFormData.consumption_type === 'medication' ? 
                    "Décrire les effets secondaires du médicament..." : 
                    "Décrire le ressenti après cette consommation..."}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des consommations groupées par date */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#303d25]/10 rounded-full flex items-center justify-center">
            <Utensils size={24} className="text-[#303d25]/40" />
          </div>
          <h3 className="text-lg font-medium text-[#303d25] mb-2">Aucune consommation</h3>
          <p className="text-[#303d25]/60 mb-6">Commencez à enregistrer vos repas, boissons et médicaments</p>
        </div>
      ) : (
        sortedDates.map((date) => (
          <div key={date} className="space-y-2">
            {/* En-tête de date - ne s'affiche pas pour le filtre "aujourd'hui" */}
            {dateFilter !== 'today' && (
              <div className="flex items-center gap-3 py-2">
                <div className="h-px bg-[#e3c79f] flex-1"></div>
                <div className="bg-[#303d25]/5 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-[#303d25]">
                    {historyService.formatDate(date)}
                  </span>
                </div>
                <div className="h-px bg-[#e3c79f] flex-1"></div>
              </div>
            )}

            {/* Consommations de cette date */}
            {groupedConsumptions[date].map((consumption) => {
              const Icon = getConsumptionIcon(consumption.consumption_type || 'meal');
              const color = getConsumptionHexColor(consumption.consumption_type || 'meal');
              
              return (
                <div
                  key={consumption.id}
                  ref={(el) => { if (consumption.id) itemRefs.current[consumption.id] = el; }}
                  className={`bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md transition-all duration-200 hover:shadow-lg flex items-start justify-between ${
                    recentlySavedId === consumption.id ? 'ring-2 ring-green-400 bg-green-50/90' : ''
                  } ${
                    deletingItemId === consumption.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {/* Affichage compact de la consommation */}
                    <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                            <Icon size={18} style={{ color }} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[#303d25]/60 flex-shrink-0">
                                {historyService.formatTime(consumption.consumption_time)}
                              </span>
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                                {getConsumptionTypeLabel(consumption.consumption_type || 'meal')}
                              </span>
                            </div>
                            
                            <h3 className="font-medium text-[#303d25] text-sm leading-tight w-full line-clamp-2">
                              {consumption.consumption}
                            </h3>
                            
                            {(consumption.prep_mode || consumption.after_effects) && (
                              <div className="flex items-center gap-2 mt-1">
                                {consumption.prep_mode && (
                                  <span className="text-xs text-[#303d25]/50 bg-[#303d25]/5 px-1.5 py-0.5 rounded truncate max-w-20">
                                    {getPrepModeLabel(consumption.prep_mode)}
                                  </span>
                                )}
                                {consumption.after_effects && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <AlertCircle size={12} className="text-[#b36b43]" />
                                    <span className="text-xs text-[#b36b43]">Effets</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                  </div>
                  
                  {/* Boutons d'action remontés au niveau de la div principale */}
                  <div className="flex gap-1 flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleEditConsumption(consumption)}
                      className="p-1.5 hover:bg-[#e3c79f]/20 rounded transition-colors"
                      title="Éditer"
                    >
                      <Edit2 size={16} className="text-[#b36b43] hover:text-[#8b5a3c]" />
                    </button>
                    <button
                      onClick={() => consumption.id && handleDeleteItem(consumption.id, 'consumption')}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} className="text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
      
      {/* Modal d'édition des consommations */}
      <ConsumptionEditModal
        isOpen={!!editingConsumption}
        onClose={handleCancelEdit}
        onSave={handleSaveConsumption}
        consumptionFormData={consumptionFormData}
        setConsumptionFormData={setConsumptionFormData}
        saving={saving}
      />
    </>
  );
}
