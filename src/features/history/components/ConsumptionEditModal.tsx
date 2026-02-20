import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Textarea } from '../../../shared/components/Textarea';
import { SmartDateTimePicker } from '../../../shared/components/SmartDateTimePicker';
import { Select } from '../../../shared/components/Select';
import { Button } from '../../../shared/components/Button';
import { COOKING_METHODS } from '../../../shared/constants';
import { consumptionService } from '../../consumption/services/consumptionService';

interface ConsumptionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
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
}

export function ConsumptionEditModal({
  isOpen,
  onClose,
  onSave,
  consumptionFormData,
  setConsumptionFormData,
  saving
}: ConsumptionEditModalProps) {
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

  const handleSave = () => {
    onSave();
  };

  const handleClose = () => {
    onClose();
  };

  // Options pour les types de consommation
  const consumptionTypeOptions = [
    { value: 'meal', label: 'Repas' },
    { value: 'drink', label: 'Boisson' },
    { value: 'supplement', label: 'Complément alimentaire' },
    { value: 'medication', label: 'Médicament' }
  ];

  // Options pour les effets
  const afterEffectsOptions = [
    { value: 'none', label: 'Aucun' },
    { value: 'positive', label: 'Positifs' },
    { value: 'negative', label: 'Négatifs' },
    { value: 'mixed', label: 'Mixtes' }
  ];

  // Obtenir les modes de préparation filtrés selon le type
  const getCookingMethodsForType = () => {
    if (consumptionFormData.consumption_type === 'meal') {
      return COOKING_METHODS;
    }
    return [];
  };

  const cookingMethods = getCookingMethodsForType();

  const getPlaceHolderforAfterEffects = (): string => {
    switch (consumptionFormData.consumption_type) {
      case 'medication':
        return 'Ex : nausées, somnolence';
      default:
        return 'Ex : ballonnements, douleurs';
    }
  };

  return (
    <>
      {isOpen && createPortal(
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
              <h2 className="text-xl font-semibold text-[#303d25]">Modifier la consommation</h2>
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
                {/* Date et Heure - Smart Responsive for Modal */}
                <SmartDateTimePicker
                  dateValue={consumptionFormData.consumption_date}
                  timeValue={consumptionFormData.consumption_time}
                  onDateChange={(value) => setConsumptionFormData(prev => ({ ...prev, consumption_date: value }))}
                  onTimeChange={(time) => setConsumptionFormData(prev => ({ ...prev, consumption_time: time }))}
                  dateLabel="Date"
                  timeLabel={consumptionService.getTimeLabel(consumptionFormData.consumption_type)}
                  isModal={true}
                />

                {/* Type de consommation */}
                <div>
                  <label className="block text-sm font-medium text-[#303d25] mb-2">Type de consommation</label>
                  <Select
                    value={consumptionFormData.consumption_type}
                    onChange={(value) => {
                      // Mettre à jour le type de consommation et réinitialiser le mode de préparation si nécessaire
                      setConsumptionFormData(prev => ({ 
                        ...prev, 
                        consumption_type: value, 
                        prep_mode: value === 'meal' ? prev.prep_mode : '' 
                      }));
                    }}
                    options={consumptionTypeOptions}
                    placeholder="Sélectionnez un type"
                  />
                </div>

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

                {/* Mode de préparation (uniquement pour les repas) */}
                {consumptionFormData.consumption_type === 'meal' && cookingMethods.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-[#303d25] mb-2">Mode de préparation</label>
                    <Select
                      value={consumptionFormData.prep_mode}
                      onChange={(value) => setConsumptionFormData(prev => ({ ...prev, prep_mode: value }))}
                      options={cookingMethods}
                      placeholder="Sélectionnez un mode de préparation"
                    />
                  </div>
                )}

                {/* Effets ressentis */}
                <div>
                  <label className="block text-sm font-medium text-[#303d25] mb-2">Ressenti après la consommation</label>
                  <Textarea
                    value={consumptionFormData.after_effects}
                    className='w-full p-3 border border-[#e3c79f] rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent resize-none'
                    onChange={(value) => setConsumptionFormData(prev => ({ ...prev, after_effects: value }))}
                    placeholder={getPlaceHolderforAfterEffects()}
                    rows={3}
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
        </div>,
        document.body
      )}
    </>
  );
}

