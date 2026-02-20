import React, { useRef, useEffect, useState } from 'react';
import { Calendar, Clock, Edit2, Trash2, User, Frown, Zap, Wind, Brain, SquarePen, BookOpen, Plus, ChevronDown, ChevronUp, Laugh } from 'lucide-react';

// Utility function to get global feeling labels and icons
const getGlobalFeelingDisplay = (feeling: string) => {
  const feelingOptions = {
    'bad': { 
      label: 'Mal', 
      icon: (
        <svg className="w-5 h-5" fill="#303d25" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#303d25" strokeWidth="2"/>
          <path d="M8 15s1.5-2 4-2 4 2 4 2" stroke="#303d25" strokeWidth="2" fill="none"/>
          <circle cx="9" cy="9" r="1" fill="#303d25"/>
          <circle cx="15" cy="9" r="1" fill="#303d25"/>
        </svg>
      ),
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    },
    'ok': { 
      label: 'Moyen', 
      icon: (
        <svg className="w-5 h-5" fill="#303d25" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#303d25" strokeWidth="2"/>
          <line x1="8" y1="15" x2="16" y2="15" stroke="#303d25" strokeWidth="2"/>
          <circle cx="9" cy="9" r="1" fill="#303d25"/>
          <circle cx="15" cy="9" r="1" fill="#303d25"/>
        </svg>
      ),
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    'good': { 
      label: 'Bien', 
      icon: (
        <svg className="w-5 h-5" fill="#303d25" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#303d25" strokeWidth="2"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#303d25" strokeWidth="2" fill="none"/>
          <circle cx="9" cy="9" r="1" fill="#303d25"/>
          <circle cx="15" cy="9" r="1" fill="#303d25"/>
        </svg>
      ),
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    },
    'excellent': { 
      label: 'Excellent', 
      icon: <Laugh size={20} color="#303d25" />,
      bgColor: 'bg-green-200',
      textColor: 'text-green-900'
    }
  };
  
  return feelingOptions[feeling as keyof typeof feelingOptions] || {
    label: feeling,
    icon: <User size={18} />,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  };
};
import { SmartDateTimePicker } from '../../../../shared/components/SmartDateTimePicker';
import { RessentiFeelingCard } from '../../../../shared/components/RessentiFeelingCard';
import { historyService } from '../../services/historyService';
import { symptomService } from '../../../symptom-tracking/services/symptomService';
import { SymptomType } from '../../../symptom-tracking/types';
import { SymptomSelector } from '../SymptomSelector';
import { FeelingEditModal } from '../FeelingEditModal';

import { getSeverityLabel } from '../../../../shared/components/SymptomSlider';

// Enhanced function to get severity with color coding
const getSeverityWithColor = (value: number): { label: string; color: string; bgColor: string; intensity: 'low' | 'medium' | 'high' } => {
  if (value === 0) return { label: 'Aucun', color: 'text-gray-600', bgColor: 'bg-gray-100', intensity: 'low' };
  if (value === 1) return { label: 'Très léger', color: 'text-green-700', bgColor: 'bg-green-50', intensity: 'low' };
  if (value === 2) return { label: 'Léger', color: 'text-green-600', bgColor: 'bg-green-100', intensity: 'low' };
  if (value === 3) return { label: 'Modéré', color: 'text-orange-700', bgColor: 'bg-orange-100', intensity: 'medium' };
  if (value === 4) return { label: 'Marqué', color: 'text-orange-800', bgColor: 'bg-orange-200', intensity: 'medium' };
  return { label: 'Sévère', color: 'text-red-700', bgColor: 'bg-red-100', intensity: 'high' };
};

// Function to get card accent color matching feeling badge background colors exactly
const getCardAccentColor = (feeling: string): string => {
  switch (feeling) {
    case 'bad': return 'bg-red-100';      // Matches bg-red-100 from "Mal" badge
    case 'ok': return 'bg-yellow-100';    // Matches bg-yellow-100 from "Moyen" badge
    case 'good': return 'bg-green-100';   // Matches bg-green-100 from "Bien" badge
    case 'excellent': return 'bg-green-200'; // Matches bg-green-200 from "Excellent" badge
    default: return 'bg-gray-100';
  }
};

// Function to get symptom summary
const getSymptomSummary = (symptoms: any[]): string => {
  if (!symptoms || symptoms.length === 0) return '';
  
  const intensityCounts = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  symptoms.forEach(s => {
    const severity = getSeverityWithColor(s.symptom_intensity);
    intensityCounts[severity.intensity]++;
  });
  
  if (intensityCounts.high > 0) {
    return `${intensityCounts.high} ${intensityCounts.high === 1 ? 'symptôme sévère' : 'symptômes sévères'}`;
  }
  if (intensityCounts.medium > 0) {
    return `${intensityCounts.medium} ${intensityCounts.medium === 1 ? 'symptôme modéré' : 'symptômes modérés'}`;
  }
  return `${intensityCounts.low} ${intensityCounts.low === 1 ? 'symptôme léger' : 'symptômes légers'}`;
};

interface SymptomHistoryTabProps {
  symptoms: any[];
  filteredSymptoms: any[];
  isAddingSymptom: boolean;
  editingSymptom: any | null;
  symptomFormData: {
    capture_date: string;
    capture_time: string;
    global_feeling: 'bad' | 'ok' | 'good' | 'excellent' | '';
    notes: string;
    symptoms: { [key: string]: number };
  };
  setSymptomFormData: React.Dispatch<React.SetStateAction<{
    capture_date: string;
    capture_time: string;
    global_feeling: 'bad' | 'ok' | 'good' | 'excellent' | '';
    notes: string;
    symptoms: { [key: string]: number };
  }>>;
  saving: boolean;
  deletingItemId: string | null;
  recentlySavedId: string | null;
  handleEditSymptom: (symptom: any) => void;
  handleSaveSymptom: () => void;
  handleCancelEdit: () => void;
  handleDeleteItem: (itemId: string, type: "stool" | "consumption" | "symptom") => void;
}

export function SymptomHistoryTab({
  symptoms,
  filteredSymptoms,
  isAddingSymptom,
  editingSymptom,
  symptomFormData,
  setSymptomFormData,
  saving,
  deletingItemId,
  recentlySavedId,
  handleEditSymptom,
  handleSaveSymptom,
  handleCancelEdit,
  handleDeleteItem,
}: SymptomHistoryTabProps) {
  const [newSymptomName, setNewSymptomName] = useState('');
  const [isAddingNewSymptom, setIsAddingNewSymptom] = useState(false);
  const [isSymptomSelectorOpen, setIsSymptomSelectorOpen] = useState(false);
  const [symptomToDelete, setSymptomToDelete] = useState<string | null>(null);
  const [originalSymptoms, setOriginalSymptoms] = useState<{ [key: string]: number }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleAddNewSymptom = () => {
    if (newSymptomName.trim()) {
      setSymptomFormData(prev => ({
        ...prev,
        symptoms: {
          ...prev.symptoms,
          [newSymptomName.trim()]: 0 // Default intensity to 0
        }
      }));
      setNewSymptomName('');
      setIsAddingNewSymptom(false);
    }
  };

  const handleCancelAddSymptom = () => {
    setNewSymptomName('');
    setIsAddingNewSymptom(false);
  };

  const handleSelectFromCatalog = (symptomName: string) => {
    // Vérifier s'il n'y a pas de doublon en comparant les labels
    const existingSymptoms = Object.keys(symptomFormData.symptoms);
    const isDuplicate = existingSymptoms.some(existing => 
      existing.toLowerCase() === symptomName.toLowerCase()
    );
    
    if (!isDuplicate) {
      setSymptomFormData(prev => ({
        ...prev,
        symptoms: {
          ...prev.symptoms,
          [symptomName]: 0 // Default intensity to 0
        }
      }));
    }
    setIsSymptomSelectorOpen(false);
  };

  const handleDeleteSymptom = (symptomName: string) => {
    setSymptomToDelete(symptomName);
  };

  const confirmDeleteSymptom = () => {
    if (symptomToDelete) {
      setSymptomFormData(prev => {
        const newSymptoms = { ...prev.symptoms };
        delete newSymptoms[symptomToDelete];
        return {
          ...prev,
          symptoms: newSymptoms
        };
      });
      setSymptomToDelete(null);
    }
  };

  const cancelDeleteSymptom = () => {
    setSymptomToDelete(null);
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const addFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [enabledSymptoms, setEnabledSymptoms] = useState<SymptomType[]>([]);

  // Sauvegarder les symptômes originaux lors de l'édition
  useEffect(() => {
    if (editingSymptom && Object.keys(originalSymptoms).length === 0) {
      setOriginalSymptoms({ ...symptomFormData.symptoms });
    }
  }, [editingSymptom, symptomFormData.symptoms, originalSymptoms]);

  // Réinitialiser les symptômes originaux quand on annule ou sauvegarde
  useEffect(() => {
    if (!editingSymptom) {
      setOriginalSymptoms({});
    }
  }, [editingSymptom]);

  // Ouvrir le modal quand on commence à éditer
  useEffect(() => {
    if (editingSymptom) {
      setIsModalOpen(true);
    }
  }, [editingSymptom]);

  useEffect(() => {
    symptomService.getEnabledSymptomTypes()
      .then(setEnabledSymptoms)
      .catch(() => setEnabledSymptoms(symptomService.getSymptomTypes()));
  }, []);

  // Scroll automatique vers le formulaire d'ajout
  useEffect(() => {
    if (isAddingSymptom && addFormRef.current) {
      addFormRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isAddingSymptom]);

  // Scroll automatique vers le formulaire d'édition
  useEffect(() => {
    if (editingSymptom && editFormRef.current) {
      editFormRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [editingSymptom]);

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

  const handleModalClose = () => {
    setIsModalOpen(false);
    handleCancelEdit();
  };

  const handleModalSave = () => {
    handleSaveSymptom();
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Formulaire d'ajout rapide pour ressentis - EN PREMIER */}
      {isAddingSymptom && (
        <div 
          ref={addFormRef}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border-2 border-[#b36b43]/60"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#303d25]/60" />
              <span className="text-sm text-[#b36b43] font-medium">Nouveau ressenti</span>
            </div>
            
            {/* Add form */}
            <div className="space-y-4">
              {/* Date and Time - Smart Responsive */}
              <SmartDateTimePicker
                dateValue={symptomFormData.capture_date}
                timeValue={symptomFormData.capture_time}
                onDateChange={(value) => setSymptomFormData(prev => ({ ...prev, capture_date: value }))}
                onTimeChange={(time) => setSymptomFormData(prev => ({ ...prev, capture_time: time }))}
                dateLabel="Date"
                timeLabel="Heure"
                isModal={true}
              />

              {/* Basic symptoms without catalog dependency */}
              {Object.entries(symptomFormData.symptoms).map(([symptomName, intensity]) => {
                const getSymptomIcon = (name: string) => {
                   return <SquarePen size={16} />; // Default icon for all symptoms
                 };
                
                const isNewSymptom = !(symptomName in originalSymptoms);
                
                return (
                  <RessentiFeelingCard
                    key={symptomName}
                    label={symptomName}
                    icon={getSymptomIcon(symptomName)}
                    intensity={intensity}
                    onIntensityChange={(value) => setSymptomFormData(prev => ({
                      ...prev,
                      symptoms: { ...prev.symptoms, [symptomName]: value }
                    }))}
                    showDeleteButton={isNewSymptom}
                    onDelete={() => handleDeleteSymptom(symptomName)}
                  />
                );
              })}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#303d25] mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={symptomFormData.notes}
                  onChange={(e) => setSymptomFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Écrivez vos notes..."
                  className="w-full p-3 border border-[#e3c79f] rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredSymptoms.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center shadow-sm border border-[#e3c79f]/30">
          <p className="text-[#303d25]/60">Aucun symptôme enregistré</p>
        </div>
      ) : (
        filteredSymptoms.map((symptom) => (
          <div 
            key={symptom.id} 
            ref={(el) => {
              itemRefs.current[symptom.id] = el;
              if (editingSymptom?.id === symptom.id) {
                (editFormRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
              }
            }}
            className={`relative bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md border transition-all duration-300 overflow-hidden ${
              editingSymptom?.id === symptom.id 
                ? 'border-2 border-[#b36b43]/60' 
                : recentlySavedId === symptom.id
                ? 'border-2 border-green-400 bg-green-50/50'
                : 'border border-[#e3c79f]/20'
            }`}
          >
            {/* Flat vertical accent bar matching feeling badge background color */}
            {symptom.global_feeling && editingSymptom?.id !== symptom.id && recentlySavedId !== symptom.id && (
              <div 
                className={`absolute left-0 top-0 bottom-0 w-2 ${getCardAccentColor(symptom.global_feeling)}`}
              />
            )}
            <div className="space-y-4">
                {/* Enhanced header with combined date/time and symptom count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#303d25]/50" />
                      <span className="text-base font-semibold text-[#303d25]">
                        {historyService.formatDate(symptom.capture_date)} à {symptom.capture_time.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 text-[#b36b43]/70 hover:text-[#b36b43] hover:bg-[#f9eddf]/50 rounded-lg transition-colors"
                        onClick={() => handleEditSymptom(symptom)}
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`p-2 text-red-500/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${deletingItemId === symptom.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleDeleteItem(symptom.id, 'symptom')}
                        disabled={deletingItemId === symptom.id}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Symptom count indicator */}
                  {symptom.captured_symptoms && symptom.captured_symptoms.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#303d25]/60">
                      <span>{symptom.captured_symptoms.length} {symptom.captured_symptoms.length === 1 ? 'symptôme enregistré' : 'symptômes enregistrés'}</span>
                      <span className="text-[#303d25]/40">•</span>
                      <span className="text-[#303d25]/70 font-medium">{getSymptomSummary(symptom.captured_symptoms)}</span>
                    </div>
                  )}
                </div>

                {/* Enhanced global feeling - more prominent */}
                {symptom.global_feeling !== null && symptom.global_feeling !== undefined && (
                  <div className="mb-1">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#f9eddf]/60 to-[#f5e6d3]/60 rounded-xl border border-[#e3c79f]/30 shadow-sm">
                      <span className="text-sm font-semibold text-[#303d25]/70">Ressenti global</span>
                      <div className="flex items-center gap-2.5">
                        {(() => {
                          const feelingDisplay = getGlobalFeelingDisplay(symptom.global_feeling);
                          return (
                            <>
                              <div className="transform scale-110">
                                {feelingDisplay.icon}
                              </div>
                              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${feelingDisplay.bgColor} ${feelingDisplay.textColor} shadow-sm`}>
                                {feelingDisplay.label}
                              </span>
                            </>
                          );
                        })()} 
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced toggle button with counter */}
                {symptom.captured_symptoms && symptom.captured_symptoms.length > 0 && (
                  <button
                    onClick={() => toggleCardExpansion(symptom.id)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-200 font-medium text-sm group ${
                      expandedCards.has(symptom.id)
                        ? 'bg-[#303d25]/10 hover:bg-[#303d25]/15 text-[#303d25]'
                        : 'bg-[#303d25]/5 hover:bg-[#303d25]/10 text-[#303d25]/80'
                    }`}
                  >
                    <span>
                      {expandedCards.has(symptom.id) ? 'Masquer' : 'Détails'} ({symptom.captured_symptoms.length})
                    </span>
                    <div className={`transform transition-transform duration-200 ${expandedCards.has(symptom.id) ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown size={18} className="group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                )}

                {/* Enhanced symptoms display with color coding */}
                {symptom.captured_symptoms && symptom.captured_symptoms.length > 0 && (
                  <div className={`
                    ${expandedCards.has(symptom.id) ? 'block animate-in fade-in slide-in-from-top-2 duration-200' : 'hidden'}
                    mt-4
                  `}>
                    <div className="space-y-0 divide-y divide-[#e3c79f]/20">
                      {symptom.captured_symptoms.map((capturedSymptom: any, index: number) => {
                        const sev = getSeverityWithColor(capturedSymptom.symptom_intensity);
                        
                        return (
                          <div 
                            key={capturedSymptom.id} 
                            className={`flex items-center justify-between py-3 ${index === 0 ? 'pt-0' : ''}`}
                          >
                            {/* Symptom name */}
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="text-sm font-medium text-[#303d25] break-words">
                                {capturedSymptom.symptom_name}
                              </h4>
                            </div>
                            
                            {/* Enhanced intensity display with color coding */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sev.bgColor} ${sev.color} whitespace-nowrap`}>
                                {sev.label} ({capturedSymptom.symptom_intensity}/5)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Enhanced notes display */}
                {symptom.notes && (
                  <div className={`
                    ${expandedCards.has(symptom.id) ? 'block' : 'hidden'}
                    mt-4 p-3 bg-[#f9eddf]/30 rounded-lg border border-[#e3c79f]/20
                  `}>
                    <p className="text-xs font-semibold text-[#303d25]/60 mb-1">Notes</p>
                    <p className="text-sm text-[#303d25] leading-relaxed">{symptom.notes}</p>
                  </div>
                )}
            </div>
          </div>
        ))
      )}
      
      {/* Symptom Selector Modal */}
      <SymptomSelector
        isOpen={isSymptomSelectorOpen}
        onClose={() => setIsSymptomSelectorOpen(false)}
        onSelectSymptom={handleSelectFromCatalog}
        existingSymptoms={Object.keys(symptomFormData.symptoms)}
      />

      {/* Delete Confirmation Modal */}
      {symptomToDelete && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" 
          style={{ zIndex: 9999, backgroundColor: 'rgba(227, 199, 159, 0.2)' }}
          onClick={cancelDeleteSymptom}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 max-w-md mx-4 shadow-lg border border-[#e3c79f]/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#e3c79f]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#b36b43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#303d25]">
                 Enlever le symptôme
               </h3>
             </div>
             
             <div className="mb-8">
                <p className="text-[#303d25] mb-3 leading-relaxed">
                  Enlever <strong className="text-[#b36b43]">"{symptomToDelete}"</strong> de cette saisie ?
                </p>
              </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteSymptom}
                className="px-6 py-2.5 text-[#303d25] bg-[#e3c79f]/20 rounded-lg hover:bg-[#e3c79f]/30 transition-colors font-medium border border-[#e3c79f]"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteSymptom}
                className="px-6 py-2.5 text-white bg-[#b36b43] rounded-lg hover:bg-[#9d5a37] transition-colors font-medium"
               >
                 Enlever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour l'édition */}
      <FeelingEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        symptomFormData={symptomFormData}
        setSymptomFormData={setSymptomFormData}
        originalSymptoms={originalSymptoms}
        saving={saving}
      />
    </>
  );
}
