import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Plus, SquarePen, X, Laugh } from 'lucide-react';
import { SmartDateTimePicker } from '../../../shared/components/SmartDateTimePicker';
import { RessentiFeelingCard } from '../../../shared/components/RessentiFeelingCard';
import { SymptomSelector } from './SymptomSelector';
import { Button } from '../../../shared/components/Button';

const getGlobalFeelingDisplay = (feeling: string) => {
  switch (feeling) {
    case 'bad':
      return {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: '#ef4444',
        bgColor: '#fef2f2'
      };
    case 'ok':
      return {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: '#f59e0b',
        bgColor: '#fffbeb'
      };
    case 'good':
      return {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: '#10b981',
        bgColor: '#f0fdf4'
      };
    case 'excellent':
      return {
        icon: <Laugh size={24} color="#303d25" />,
        color: '#059669',
        bgColor: '#ecfdf5'
      };
    default:
      return {
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: '#6b7280',
        bgColor: '#f9fafb'
      };
  };
};

interface FeelingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
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
  originalSymptoms: { [key: string]: number };
  saving: boolean;
}

export function FeelingEditModal({
  isOpen,
  onClose,
  onSave,
  symptomFormData,
  setSymptomFormData,
  originalSymptoms,
  saving
}: FeelingEditModalProps) {
  const [isAddingNewSymptom, setIsAddingNewSymptom] = useState(false);
  const [newSymptomName, setNewSymptomName] = useState('');
  const [isSymptomSelectorOpen, setIsSymptomSelectorOpen] = useState(false);
  const [symptomToDelete, setSymptomToDelete] = useState<string | null>(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsAddingNewSymptom(false);
      setNewSymptomName('');
      setIsSymptomSelectorOpen(false);
      setSymptomToDelete(null);
    }
  }, [isOpen]);

  // Manage body overflow to prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleAddNewSymptom = () => {
    if (newSymptomName.trim()) {
      setSymptomFormData(prev => ({
        ...prev,
        symptoms: {
          ...prev.symptoms,
          [newSymptomName.trim()]: 1
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
    // Check if symptom already exists
    if (symptomFormData.symptoms[symptomName]) {
      return; // Don't add duplicate
    }
    
    // Add the symptom with default intensity of 1
    setSymptomFormData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [symptomName]: 1
      }
    }));
    
    // Close the selector
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

  const handleSave = () => {
    onSave();
  };

  const handleClose = () => {
    setIsAddingNewSymptom(false);
    setNewSymptomName('');
    setIsSymptomSelectorOpen(false);
    setSymptomToDelete(null);
    onClose();
  };

  return (
    <>
      {isOpen && createPortal(
        <>
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" 
            style={{ zIndex: 9999, backgroundColor: 'rgba(227, 199, 159, 0.2)' }}
            onClick={handleClose}
          >
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-xl max-w-2xl w-full mx-4 shadow-lg border border-[#e3c79f]/30 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#e3c79f]/30">
                <h2 className="text-xl font-semibold text-[#303d25]">Modifier le ressenti</h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#e3c79f]/20 rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X size={20} className="text-[#303d25]" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Date and Time - Smart Responsive for Modal */}
                  <SmartDateTimePicker
                    dateValue={symptomFormData.capture_date}
                    timeValue={symptomFormData.capture_time}
                    onDateChange={(value) => setSymptomFormData(prev => ({ ...prev, capture_date: value }))}
                    onTimeChange={(time) => setSymptomFormData(prev => ({ ...prev, capture_time: time }))}
                    dateLabel="Date"
                    timeLabel="Heure"
                    isModal={true}
                  />

                  {/* Global feeling */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User size={18} className="text-[#303d25]" />
                      <span className="font-medium text-[#303d25]">Ressenti global</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { value: 'bad', label: 'Mal', icon: getGlobalFeelingDisplay('bad').icon },
                        { value: 'ok', label: 'Moyen', icon: getGlobalFeelingDisplay('ok').icon },
                        { value: 'good', label: 'Bien', icon: getGlobalFeelingDisplay('good').icon },
                        { value: 'excellent', label: 'Excellent', icon: getGlobalFeelingDisplay('excellent').icon }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSymptomFormData(prev => ({ ...prev, global_feeling: option.value as 'bad' | 'ok' | 'good' | 'excellent' | '' }))}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            symptomFormData.global_feeling === option.value
                              ? 'border-[#b36b43] bg-[#b36b43]/10 text-[#b36b43]'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-[#b36b43]/50'
                          }`}
                        >
                          <div>{option.icon}</div>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div className="space-y-4">
                    {Object.entries(symptomFormData.symptoms).map(([symptomName, intensity]) => {
                      const getSymptomIcon = (name: string) => {
                        return <SquarePen size={16} />;
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
                  </div>

                  {/* Add symptoms section */}
                  {!isAddingNewSymptom ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-lg font-medium text-gray-800 mb-4 text-center">Ajouter un symptôme</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setIsSymptomSelectorOpen(true)}
                          className="flex flex-col items-center gap-2 p-4 text-[#303d25] border-2 border-[#303d25] rounded-lg hover:bg-[#303d25] hover:text-white transition-all duration-200 group"
                        >
                          <SquarePen size={24} className="group-hover:scale-110 transition-transform" />
                          <div className="text-center">
                            <div className="font-medium">Catalogue</div>
                            <div className="text-xs opacity-75 mt-1">Choisir dans le catalogue</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewSymptom(true)}
                          className="flex flex-col items-center gap-2 p-4 text-[#303d25] border-2 border-[#303d25] rounded-lg hover:bg-[#303d25] hover:text-white transition-all duration-200 group"
                        >
                          <Plus size={24} className="group-hover:scale-110 transition-transform" />
                          <div className="text-center">
                            <div className="font-medium">Symptôme personnalisé</div>
                            <div className="text-xs opacity-75 mt-1">Créer un nouveau symptôme</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#f9eddf] border-2 border-[#e3c79f] rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Plus size={20} className="text-[#303d25]" />
                        <span className="font-semibold text-[#303d25]">Créer un symptôme personnalisé</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-[#303d25] mb-2">
                            Nom du symptôme
                          </label>
                          <input
                            type="text"
                            value={newSymptomName}
                            onChange={(e) => setNewSymptomName(e.target.value)}
                            placeholder="Ex: Fatigue, Nausée..."
                            className="w-full p-3 border border-[#e3c79f] rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddNewSymptom();
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddNewSymptom}
                            className="px-4 py-2 bg-[#b36b43] text-white rounded-lg hover:bg-[#303d25] transition-colors"
                          >
                            Ajouter
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAddSymptom}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-[#303d25] mb-2">Notes</label>
                    <textarea
                      value={symptomFormData.notes}
                      onChange={(e) => setSymptomFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-3 border border-[#e3c79f] rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Ajoutez des notes sur votre ressenti..."
                    />
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e3c79f]/30 bg-white/50">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          </div>

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
              style={{ zIndex: 10000, backgroundColor: 'rgba(227, 199, 159, 0.2)' }}
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
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteSymptom}
                    className="px-4 py-2 bg-[#b36b43] text-white rounded-lg hover:bg-[#303d25] transition-colors"
                  >
                    Enlever
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}