import React, { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { SmartDateTimePicker } from '../../../../shared/components/SmartDateTimePicker';
import { Select } from '../../../../shared/components/Select';
import { BristolGrid } from '../../../../shared/components/BristolGrid';
import { BristolInfoModal } from '../../../../shared/components/BristolInfoModal';
import { StoolEditModal } from '../StoolEditModal';
import { stoolService } from '../../../stool/services/stoolService';
import { historyService } from '../../services/historyService';
import { BRISTOL_TYPES } from '../../../../shared/constants';

// Types pour les niveaux de sang et mucosité
const BLOOD_LEVELS = [
  { value: 'none', label: 'Aucun' },
  { value: 'trace', label: 'Traces' },
  { value: 'moderate', label: 'Modéré' },
  { value: 'severe', label: 'Sévère' }
];

const MUCUS_LEVELS = [
  { value: 'none', label: 'Aucun' },
  { value: 'trace', label: 'Traces' },
  { value: 'moderate', label: 'Modéré' },
  { value: 'severe', label: 'Sévère' }
];

// Fonctions utilitaires pour l'affichage des niveaux
const getBloodLevelDisplay = (bloodLevel: string | null | undefined, hasBlood: boolean) => {
  if (!hasBlood) return null;
  return 'Sang';
};

const getMucusLevelDisplay = (mucusLevel: string | null | undefined, hasMucus: boolean) => {
  if (!hasMucus) return null;
  return 'Mucosité';
};

const getBloodLevelColor = (bloodLevel: string | null | undefined) => {
  switch (bloodLevel) {
    case 'trace': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    case 'moderate': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'severe': return 'bg-red-50 text-red-700 border border-red-200';
    default: return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
  }
};

const getMucusLevelColor = (mucusLevel: string | null | undefined) => {
  switch (mucusLevel) {
    case 'trace': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    case 'moderate': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'severe': return 'bg-red-50 text-red-700 border border-red-200';
    default: return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
  }
};

interface StoolHistoryTabProps {
  stools: any[];
  filteredStools: any[];
  isAddingStool: boolean;
  editingStool: any;
  editFormData: any;
  setEditFormData: (data: any) => void;
  saving: boolean;
  deletingItemId: string | null;
  recentlySavedId: string | null;
  handleEditStool: (stool: any) => void;
  handleSaveStool: () => void;
  handleCancelEdit: () => void;
  handleDeleteItem: (id: string, type: 'stool' | 'consumption' | 'symptom') => void;
}

export function StoolHistoryTab({
  stools,
  filteredStools,
  isAddingStool,
  editingStool,
  editFormData,
  setEditFormData,
  saving,
  deletingItemId,
  recentlySavedId,
  handleEditStool,
  handleSaveStool,
  handleCancelEdit,
  handleDeleteItem
}: StoolHistoryTabProps) {
  const [showBristolInfo, setShowBristolInfo] = useState(false);
  const [bristolInfoType, setBristolInfoType] = useState(1);
  
  const addFormRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const handleBristolInfoClick = (type: number) => {
    setBristolInfoType(type);
    setShowBristolInfo(true);
  };

  // Helper function to get Bristol scale color
  const getBristolScaleColor = (consistency: number) => {
    if (consistency <= 2) return 'bg-red-100 text-red-800';
    if (consistency <= 4) return 'bg-green-100 text-green-800';
    if (consistency <= 7) return 'bg-orange-100 text-orange-800';
    if (consistency === 8) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Scroll automatique vers le formulaire d'ajout
  useEffect(() => {
    if (isAddingStool && addFormRef.current) {
      addFormRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isAddingStool]);

  // Scroll automatique vers l'élément récemment sauvegardé
  useEffect(() => {
    if (recentlySavedId && itemRefs.current[recentlySavedId]) {
      setTimeout(() => {
        itemRefs.current[recentlySavedId]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [recentlySavedId]);

  return (
    <>
      {/* Formulaire d'ajout rapide */}
      {isAddingStool && (
        <div 
          ref={addFormRef}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-[#b36b43]/60"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#303d25]/60" />
              <span className="text-sm font-medium text-[#303d25]">
                {format(new Date(), 'yyyy-MM-dd')}
              </span>
              <span className="text-sm text-green-600 font-medium">- Nouvelle selle</span>
            </div>
            
            {/* Formulaire d'ajout */}
            <div className="space-y-4">
              {/* Date et Heure - Smart Responsive */}
              <SmartDateTimePicker
                dateValue={editFormData.stool_date || format(new Date(), 'yyyy-MM-dd')}
                timeValue={editFormData.stool_time}
                onDateChange={(value) => setEditFormData(prev => ({ ...prev, stool_date: value }))}
                onTimeChange={(time) => setEditFormData(prev => ({ ...prev, stool_time: time }))}
                dateLabel="Date"
                timeLabel="Heure"
                isModal={true}
              />

              {/* 2. Urgence */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-3">Urgence</label>
                <div className="grid grid-cols-3 gap-2">
                  {stoolService.getUrgencyLevels().map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, urgency: level.value as 'none' | 'moderate' | 'severe' }))}
                      disabled={saving}
                      className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm ${
                        editFormData.urgency === level.value
                          ? (
                              level.value === 'none' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                              level.value === 'low' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              level.value === 'moderate' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              level.value === 'severe' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-[#303d25] text-white border-[#303d25]'
                            )
                          : 'bg-white text-[#303d25] border-[#e3c79f] hover:border-[#b36b43]'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Niveau de sang */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-3">Présence de sang</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, blood_level: level.value as 'none' | 'trace' | 'moderate' | 'severe' }))}
                      disabled={saving}
                      className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm ${
                        editFormData.blood_level === level.value
                          ? (
                              level.value === 'none' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                              level.value === 'trace' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              level.value === 'moderate' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              level.value === 'severe' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-[#303d25] text-white border-[#303d25]'
                            )
                          : 'bg-white text-[#303d25] border-[#e3c79f] hover:border-[#b36b43]'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Niveau de mucosité */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-3">Présence de mucosité</label>
                <div className="grid grid-cols-4 gap-2">
                  {MUCUS_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, mucus_level: level.value as 'none' | 'trace' | 'moderate' | 'severe' }))}
                      disabled={saving}
                      className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm ${
                        editFormData.mucus_level === level.value
                          ? (
                              level.value === 'none' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                              level.value === 'trace' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              level.value === 'moderate' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              level.value === 'severe' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-[#303d25] text-white border-[#303d25]'
                            )
                          : 'bg-white text-[#303d25] border-[#e3c79f] hover:border-[#b36b43]'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Consistance (échelle de Bristol) */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-3">
                  Consistance (échelle de Bristol)
                </label>
                <BristolGrid
                  types={BRISTOL_TYPES}
                  value={editFormData.consistency}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, consistency: value }))}
                  onInfoClick={handleBristolInfoClick}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {filteredStools.length === 0 && !isAddingStool ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg border border-[#e3c79f]/30">
          <p className="text-[#303d25]/60">Aucune selle enregistrée</p>
        </div>
      ) : (
        filteredStools.map((stool) => (
          <div 
            key={stool.id} 
            ref={(el) => { itemRefs.current[stool.id] = el; }}
            className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border transition-all duration-300 ${
              recentlySavedId === stool.id
                ? 'border-2 border-green-400 bg-green-50/50'
                : 'border border-[#e3c79f]/30'
            }`}
          >
            {/* Mode affichage normal */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-[#303d25]/60" />
                    <span className="text-sm font-medium text-[#303d25]">
                      {historyService.formatDate(stool.stool_date)}
                    </span>
                    <Clock size={16} className="text-[#303d25]/60" />
                    <span className="text-sm text-[#303d25]/80">
                      {historyService.formatTime(stool.stool_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-[#303d25]">{typeof stool.consistency === 'number' ? stool.consistency : parseInt(stool.consistency, 10)}</span>
                    <span className="text-sm font-medium text-[#303d25] leading-tight">
                      {historyService.getStoolTitle(typeof stool.consistency === 'string' ? parseInt(stool.consistency, 10) : stool.consistency)}
                    </span>
                  </div>
                  <div className="space-y-2 mb-2">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-[#303d25] leading-tight">
                        {historyService.getStoolTitle(typeof stool.consistency === 'string' ? parseInt(stool.consistency, 10) : stool.consistency)}
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBristolScaleColor(stool.consistency)}`}>
                        {stool.consistency ? historyService.getStoolDescription(stool.consistency) : 'Aucune'}
                      </span>
                      
                      {((stool as any).blood_level && (stool as any).blood_level !== 'none') && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                          Sang
                        </span>
                      )}
                      {((stool as any).mucus_level && (stool as any).mucus_level !== 'none') && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                          Mucosité
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditStool(stool);
                    }}
                    className="text-[#b36b43] hover:text-[#8b5a3c] p-1"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteItem(stool.id, 'stool');
                    }}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
          </div>
        ))
      )}
      
      {/* Modal d'édition des selles */}
      <StoolEditModal
        isOpen={!!editingStool}
        onClose={handleCancelEdit}
        onSave={handleSaveStool}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        saving={saving}
      />
      
      {/* Bristol info modal */}
      {showBristolInfo && (
        <BristolInfoModal
          isOpen={showBristolInfo}
          currentType={bristolInfoType}
          onClose={() => setShowBristolInfo(false)}
          onNavigate={(type) => setBristolInfoType(type)}
        />
      )}
    </>
  );
}
