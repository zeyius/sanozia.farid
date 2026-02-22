// History Analysis page - migrated to feature-driven architecture
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useDashboardData } from '../../dashboard/hooks/useDashboardData';
import { Layout } from '../../../shared/components/Layout';
import { stoolService } from '../../stool/services/stoolService';
import { consumptionService } from '../../consumption/services/consumptionService';
import { symptomService } from '../../symptom-tracking/services/symptomService';
import { Select } from '../../../shared/components/Select';
import { TimePicker } from '../../../shared/components/TimePicker';
import { BLOOD_LEVELS, MUCUS_LEVELS } from '../../../shared/constants';

import { StoolIcon } from '../../../shared/components/StoolIcon';
import { Calendar, Clock, Edit2, Save, X, Trash2, Check, Plus } from 'lucide-react';
import { historyService } from '../services/historyService';
import type { HistoryTab, DateFilter } from '../types';
import type { Database } from '../../../lib/supabase';
import { format } from 'date-fns';

// Import progressif des hooks - Étape 1: gestion des onglets
import { useHistoryState } from '../hooks/useHistoryState';
// Étape 2: édition des selles
import { useStoolEditor } from '../hooks/useStoolEditor';
// Étape 4: édition des repas
import { useConsumptionEditor } from '../hooks/useConsumptionEditor';
// Étape 5: édition des symptômes
import { useSymptomEditor } from '../hooks/useSymptomEditor';
import { useItemDeleter } from '../hooks/useItemDeleter';
import { StoolHistoryTab } from '../components/tabs/StoolHistoryTab';
import { ConsumptionHistoryTab } from '../components/tabs/ConsumptionHistoryTab';
import { SymptomHistoryTab } from '../components/tabs/SymptomHistoryTab';

type Stool = Database['public']['Tables']['stools']['Row'];

export function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    consumptions, stools, symptoms, loading, refetch, 
    addStool, removeStool, updateStool, restoreStool,
    addConsumption, removeConsumption, updateConsumption, restoreConsumption,
    addSymptom, removeSymptom, updateSymptom, restoreSymptom
  } = useDashboardData();
  
  // ÉTAPE 1: Utiliser le hook pour la gestion des onglets et filtres
  const { activeTab, setActiveTab, dateFilter, setDateFilter } = useHistoryState();
  
  // ÉTAPE 2: Utiliser le hook pour l'édition des selles
  const {
    editingStool: hookEditingStool,
    isAddingStool: hookIsAddingStool,
    editFormData: hookEditFormData,
    saving: hookSaving,
    recentlySavedId: stoolRecentlySavedId,
    handleEditStool,
    handleSaveStool,
    handleCancelEdit,
    handleStartAdd,
    handleSaveNewStool,
    setEditFormData: hookSetEditFormData
  } = useStoolEditor(addStool, updateStool);
  
  // ÉTAPE 4: Utiliser le hook pour l'édition des consommations
  const {
    editingConsumption: hookEditingConsumption,
    isAddingConsumption: hookIsAddingConsumption,
    consumptionFormData: hookConsumptionFormData,
    saving: consumptionHookSaving,
    recentlySavedId: consumptionRecentlySavedId,
    handleEditConsumption,
    handleSaveConsumption,
    handleCancelEdit: consumptionHandleCancelEdit,
    handleStartAdd: handleStartAddConsumption,
    handleSaveNewConsumption,
    setConsumptionFormData: hookSetConsumptionFormData
  } = useConsumptionEditor(addConsumption, updateConsumption);
  
  // ÉTAPE 5: Utiliser le hook pour l'édition des symptômes
  const {
    editingSymptom: hookEditingSymptom,
    isAddingSymptom: hookIsAddingSymptom,
    symptomFormData: hookSymptomFormData,
    saving: symptomHookSaving,
    recentlySavedId: symptomRecentlySavedId,
    handleEditSymptom,
    handleSaveSymptom,
    handleCancelEdit: symptomHandleCancelEdit,
    handleStartAdd: handleStartAddSymptom,
    handleSaveNewSymptom,
    setSymptomFormData: hookSetSymptomFormData
  } = useSymptomEditor(addSymptom, updateSymptom);
  
  // ÉTAPE 6: Utiliser le hook pour la suppression d'éléments
  const handleAddStool = handleSaveNewStool;
  
  // Alias temporaires pour maintenir la compatibilité pendant la migration
  const editingStool = hookEditingStool;
  const isAddingStool = hookIsAddingStool;
  const saving = hookSaving; // Pour les selles uniquement
  const editFormData = hookEditFormData;
  const setEditFormData = hookSetEditFormData;
  
  // ÉTAPE 4: Alias pour les consommations
  const editingConsumption = hookEditingConsumption;
  const isAddingConsumption = hookIsAddingConsumption;
  const consumptionFormData = hookConsumptionFormData;
  const setConsumptionFormData = hookSetConsumptionFormData;
  const handleAddConsumption = handleSaveNewConsumption;
  
  // ÉTAPE 5: Alias pour les symptômes
  const editingSymptom = hookEditingSymptom;
  const isAddingSymptom = hookIsAddingSymptom;
  const symptomFormData = hookSymptomFormData;
  const setSymptomFormData = hookSetSymptomFormData;
  const handleAddSymptom = handleSaveNewSymptom;

  // ÉTAPE 6: Hook pour la suppression et undo
  const {
    deletingItem,
    deletingItemId,
    deletedItem,
    showUndoToast,
    deleting,
    handleDeleteItem,
    handleConfirmDelete: hookHandleConfirmDelete,
    handleCancelDelete,
    handleUndoDelete,
    handleDismissToast
  } = useItemDeleter(
    removeStool,
    removeConsumption,
    removeSymptom,
    restoreStool,
    restoreConsumption,
    restoreSymptom
  );
  
  // ÉTAPE 3: États pour selles maintenant gérés par useStoolEditor
  // editingStool, isAddingStool, saving (pour selles) -> hookEditingStool, hookIsAddingStool, hookSaving
  
  // ÉTAPE 5: États pour symptômes maintenant gérés par useSymptomEditor
  // editingSymptom, isAddingSymptom maintenant fournis par le hook
  
  // États temporaires pour les fonctions de repas/symptômes qui utilisent encore setSaving
  const [mealSaving, setMealSaving] = useState(false);
  const [symptomSaving, setSymptomSaving] = useState(false);
  
  // Alias temporaire pour setSaving (utilisé par les fonctions de repas/symptômes)
  const setSaving = (value: boolean) => {
    setMealSaving(value);
    setSymptomSaving(value);
  };
  
  // Alias temporaire pour setIsAddingStool
  const setIsAddingStool = (value: boolean) => {
    if (value) handleStartAdd();
  };
  
  // Alias temporaire pour setIsAddingMeal
  const setIsAddingMeal = (value: boolean) => {
    if (value) handleStartAddConsumption();
  };
  
  // Alias temporaire pour setIsAddingSymptom
  const setIsAddingSymptom = (value: boolean) => {
    if (value) handleStartAddSymptom();
  };
  
  // Mettre à jour l'état quand les paramètres URL changent
  useEffect(() => {
    const tab = searchParams.get('tab') as HistoryTab;
    const filter = searchParams.get('filter') as DateFilter;
    
    if (tab && ['meals', 'stools', 'symptoms'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (filter && ['all', 'today', 'week'].includes(filter)) {
      setDateFilter(filter);
    }
  }, [searchParams]);

  // ÉTAPE 2: Fonctions d'édition des selles maintenant gérées par le hook useStoolEditor
  // Les anciennes fonctions handleEditStool, handleCancelEdit, handleAddStool, handleSaveStool
  // sont maintenant fournies par le hook

  // ÉTAPE 4: Fonctions d'édition des repas maintenant gérées par le hook useMealEditor
  // Les anciennes fonctions handleEditMeal, handleSaveMeal, handleAddMeal, handleSaveNewMeal
  // sont maintenant fournies par le hook

  // Fonction d'ajout pour les symptômes (copie exacte de la logique des selles)
  // ÉTAPE 5: handleSaveNewSymptom maintenant fourni par useSymptomEditor

  // ÉTAPE 5: handleAddSymptom maintenant fourni par useSymptomEditor (alias dans les alias de compatibilité)

  // ÉTAPE 2: handleSaveStool est maintenant fournie par le hook useStoolEditor

  // ÉTAPE 4: Fonctions d'édition des repas maintenant gérées par le hook useMealEditor
  // handleEditMeal, handleSaveMeal sont maintenant fournies par le hook

  // ÉTAPE 5: handleEditSymptom maintenant fourni par useSymptomEditor

  // ÉTAPE 5: handleSaveSymptom maintenant fourni par useSymptomEditor

  // ÉTAPE 6: handleDeleteItem maintenant fourni par useItemDeleter

  // ÉTAPE 6: Wrapper pour handleConfirmDelete avec suppression DB
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    
    // Supprimer de la base de données selon le type
    try {
      switch (deletingItem.type) {
        case 'stool':
          await stoolService.deleteStool(deletingItem.id);
          break;
        case 'consumption':
          await consumptionService.deleteConsumption(deletingItem.id);
          break;
        case 'symptom':
          await symptomService.deleteSymptom(deletingItem.id);
          break;
      }
      
      // Appeler la fonction du hook pour gérer l'UI
      await hookHandleConfirmDelete(stools, consumptions, symptoms);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // ÉTAPE 6: handleCancelDelete maintenant fourni par useItemDeleter

  // ÉTAPE 6: Wrapper pour handleUndoDelete avec recréation DB
  const handleUndoDeleteWithDB = async () => {
    if (!deletedItem) return;
    
    try {
      // Recréer l'élément en base de données selon son type
      switch (deletedItem.type) {
        case 'stool':
          const restoredStool = await stoolService.createStool({
            consistency: deletedItem.item.consistency,
            blood_level: deletedItem.item.blood_level,
            mucus_level: deletedItem.item.mucus_level,
            urgence: (deletedItem.item as any).urgence,
            duration_minutes: (deletedItem.item as any).duration_minutes,
            evacuation_effort: (deletedItem.item as any).evacuation_effort,
            pain_level: (deletedItem.item as any).pain_level,
            notes: deletedItem.item.notes,
            stool_date: deletedItem.item.stool_date,
            stool_time: deletedItem.item.stool_time
          });
          restoreStool(restoredStool);
          break;
        case 'consumption':
          const restoredConsumption = await consumptionService.createConsumption({
            consumption_type: deletedItem.item.consumption_type || 'repas',
            consumption: deletedItem.item.consumption,
            consumption_date: deletedItem.item.consumption_date,
            consumption_time: deletedItem.item.consumption_time,
            prep_mode: deletedItem.item.prep_mode,
            after_effects: deletedItem.item.after_effects
          });
          restoreConsumption(restoredConsumption);
          break;
        case 'symptom':
          const restoredSymptom = await symptomService.createSymptom({
            abdominal_pain: deletedItem.item.abdominal_pain,
            joint_pain: deletedItem.item.joint_pain,
            fatigue: deletedItem.item.fatigue,
            bloating: deletedItem.item.bloating,
            stress: deletedItem.item.stress,
            other: deletedItem.item.other,
            capture_date: deletedItem.item.capture_date,
            capture_time: deletedItem.item.capture_time,
            notes: deletedItem.item.notes || '',
            global_feeling: deletedItem.item.global_feeling || 'ok'
          });
          // Create the complete SymptomData object with captured_symptoms
          const symptomData = {
            ...restoredSymptom.feelingCapture,
            captured_symptoms: restoredSymptom.capturedSymptoms
          };
          restoreSymptom(symptomData);
          break;
      }
      
      // Appeler la fonction du hook pour gérer l'UI
      handleUndoDelete();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    }
  };

  // ÉTAPE 6: handleDismissToast maintenant fourni par useItemDeleter

  // Fonction pour gérer le changement d'onglet avec annulation automatique des modes actifs
  const handleTabChange = (newTab: HistoryTab) => {
    // Annuler tous les modes ajout/édition actifs avant de changer d'onglet
    if (isAddingStool || editingStool) {
      handleCancelEdit();
    }
    if (isAddingConsumption || editingConsumption) {
      consumptionHandleCancelEdit();
    }
    if (isAddingSymptom || editingSymptom) {
      symptomHandleCancelEdit();
    }
    
    // Changer d'onglet
    setActiveTab(newTab);
  };

  // Filtrer les données (le tri est déjà fait par la base de données)
  const filteredConsumptions = historyService.filterByDate(consumptions, 'consumption_date', dateFilter);
  const filteredStools = historyService.filterByDate(stools, 'stool_date', dateFilter);
  const filteredSymptoms = historyService.filterByDate(symptoms, 'capture_date', dateFilter);

  const tabs = historyService.getTabs(filteredConsumptions, filteredStools, filteredSymptoms);
  const dateFilters = historyService.getDateFilters();

  if (loading) {
    return (
      <Layout title="Historique" showBackButton>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303d25]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Historique" showBackButton>
      <div className="space-y-4">
        {/* Filtres de date */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#e3c79f]/30">
          <div className="flex gap-2">
            {dateFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter.id
                    ? 'bg-[#303d25] text-white'
                    : 'bg-white/50 text-[#303d25] hover:bg-white/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#e3c79f]/30">
          <div className="flex">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isFirst = index === 0;
              const isLast = index === tabs.length - 1;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 p-4 flex items-center justify-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-[#303d25] text-white'
                      : 'bg-transparent text-[#303d25] hover:bg-[#e3c79f]/30'
                  } ${
                    isFirst ? 'rounded-l-xl' : isLast ? 'rounded-r-xl' : ''
                  }`}
                >
                  <tab.icon width={18} height={18} />
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#303d25]/10 text-[#303d25]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content with enhanced spacing */}
        <div className="space-y-6">
          {activeTab === 'consumptions' && (
            <ConsumptionHistoryTab
              consumptions={consumptions}
              filteredConsumptions={filteredConsumptions}
              dateFilter={dateFilter}
              isAddingConsumption={isAddingConsumption}
              editingConsumption={editingConsumption}
              consumptionFormData={consumptionFormData}
              setConsumptionFormData={setConsumptionFormData}
              saving={consumptionHookSaving}
              deletingItemId={deletingItemId}
              recentlySavedId={consumptionRecentlySavedId}
              handleEditConsumption={handleEditConsumption}
              handleSaveConsumption={handleSaveConsumption}
              handleCancelEdit={consumptionHandleCancelEdit}
              handleDeleteItem={handleDeleteItem}
            />
          )}

          {activeTab === 'stools' && (
            <StoolHistoryTab
              stools={stools}
              filteredStools={filteredStools}
              isAddingStool={isAddingStool}
              editingStool={editingStool}
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              saving={saving}
              deletingItemId={deletingItemId}
              recentlySavedId={stoolRecentlySavedId}
              handleEditStool={handleEditStool}
              handleSaveStool={handleSaveStool}
              handleCancelEdit={handleCancelEdit}
              handleDeleteItem={handleDeleteItem}
            />
          )}

          {activeTab === 'symptoms' && (
            <SymptomHistoryTab
              symptoms={symptoms}
              filteredSymptoms={filteredSymptoms}
              isAddingSymptom={isAddingSymptom}
              editingSymptom={editingSymptom}
              symptomFormData={symptomFormData}
              setSymptomFormData={setSymptomFormData}
              saving={symptomHookSaving}
              deletingItemId={deletingItemId}
              recentlySavedId={symptomRecentlySavedId}
              handleEditSymptom={handleEditSymptom}
              handleSaveSymptom={handleSaveSymptom}
              handleCancelEdit={symptomHandleCancelEdit}
              handleDeleteItem={handleDeleteItem}
            />
          )}
        </div>

        {/* FAB logic moved to systematic section below */}
      </div>

      {/* Toast de confirmation de suppression avec undo */}
      {showUndoToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-sm">
            <div className="flex-1">
              <p className="text-sm font-medium">Selle supprimée</p>
            </div>
            <button
              onClick={handleUndoDelete}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDismissToast}
              className="text-gray-400 hover:text-gray-300 ml-2 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-[#303d25] mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-[#303d25]/80 mb-6">
              Êtes-vous sûr de vouloir supprimer cette selle ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB flottant systématique pour tous les onglets */}
      
      {/* FAB pour Selles */}
      {activeTab === 'stools' && (
        <>
        </>
      )}

      {/* FAB pour Consommations */}
      {activeTab === 'consumptions' && (
        <>
        </>
      )}
    </Layout>
  );
}
