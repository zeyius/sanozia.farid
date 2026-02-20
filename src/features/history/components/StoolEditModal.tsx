import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { SmartDateTimePicker } from '../../../shared/components/SmartDateTimePicker';
import { Dropdown } from '../../../shared/components/Dropdown';
import { Button } from '../../../shared/components/Button';
import { Slider } from '../../../shared/components/Slider';
import { BristolGrid } from '../../../shared/components/BristolGrid';
import { BristolInfoModal } from '../../../shared/components/BristolInfoModal';
import { URGENCY_LEVELS, BLOOD_LEVELS, MUCUS_LEVELS, DURATION_PRESETS, EVACUATION_EFFORTS, PAIN_LEVELS, BRISTOL_TYPES } from '../../../shared/constants';

interface StoolEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editFormData: {
    stool_date: string;
    stool_time: string;
    urgency: 'none' | 'moderate' | 'severe';
    consistency: number;
    has_blood?: boolean;
    blood_level?: string;
    has_mucus?: boolean;
    mucus_level?: string;
    duration_minutes?: number | null;
    evacuation_effort?: string;
    pain_level?: number;
    notes?: string;
  };
  setEditFormData: React.Dispatch<React.SetStateAction<{
    stool_date: string;
    stool_time: string;
    urgency: 'none' | 'moderate' | 'severe';
    consistency: number;
    has_blood?: boolean;
    blood_level?: string;
    has_mucus?: boolean;
    mucus_level?: string;
    duration_minutes?: number | null;
    evacuation_effort?: string;
    pain_level?: number;
    notes?: string;
  }>>;
  saving: boolean;
}

export function StoolEditModal({
  isOpen,
  onClose,
  onSave,
  editFormData,
  setEditFormData,
  saving
}: StoolEditModalProps) {
  const [showBristolInfo, setShowBristolInfo] = useState(false);
  const [bristolInfoType, setBristolInfoType] = useState(1);

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

  const handleBristolInfoClick = (type: number) => {
    setBristolInfoType(type);
    setShowBristolInfo(true);
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
              <h2 className="text-xl font-semibold text-[#303d25]">Modifier les selles</h2>
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
                {/* 1. Date et Heure */}
                <SmartDateTimePicker
                  dateValue={editFormData.stool_date || format(new Date(), 'yyyy-MM-dd')}
                  timeValue={editFormData.stool_time}
                  onDateChange={(value) => setEditFormData(prev => ({ ...prev, stool_date: value }))}
                  onTimeChange={(time) => setEditFormData(prev => ({ ...prev, stool_time: time }))}
                  dateLabel="Date"
                  timeLabel="Heure"
                  isModal={true}
                />

                {/* 2. Consistance (échelle de Bristol) */}
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

                {/* 3. Notes */}
                <div>
                  <label className="block text-sm font-medium text-[#303d25] mb-3">Notes (optionnel)</label>
                  <textarea
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border border-[#e3c79f] rounded-lg focus:ring-2 focus:ring-[#b36b43] focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Ajoutez des détails supplémentaires si nécessaire..."
                    disabled={saving}
                  />
                </div>

                {/* 4. Urgence */}
                <div>
                  <Slider
                    steps={URGENCY_LEVELS.map(level => level.label)}
                    value={URGENCY_LEVELS.find(level => level.value === editFormData.urgency)?.label || 'Aucune'}
                    onValueChange={(label) => {
                      const level = URGENCY_LEVELS.find(l => l.label === label);
                      if (level) setEditFormData(prev => ({ ...prev, urgency: level.value as 'none' | 'moderate' | 'severe' }));
                    }}
                    label="Urgence"
                    showBadge={true}
                  />
                </div>

                {/* 5. Durée aux toilettes */}
                <div>
                  <Slider
                    steps={DURATION_PRESETS.map(d => d.value.toString())}
                    value={editFormData.duration_minutes?.toString() || '2'}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                    label="Temps aux toilettes"
                    showBadge={true}
                    badgeFormatter={(value) => {
                      const duration = DURATION_PRESETS.find(d => d.value === parseInt(value));
                      return duration ? duration.label : `${value} min`;
                    }}
                  />
                </div>

                {/* 6. Effort d'évacuation */}
                <div>
                  <Slider
                    steps={EVACUATION_EFFORTS.map(effort => effort.label)}
                    value={EVACUATION_EFFORTS.find(effort => effort.value === (editFormData.evacuation_effort || 'normal'))?.label || 'Normal'}
                    onValueChange={(label) => {
                      const effort = EVACUATION_EFFORTS.find(e => e.label === label);
                      if (effort) setEditFormData(prev => ({ ...prev, evacuation_effort: effort.value }));
                    }}
                    label="Effort d'évacuation"
                    showBadge={true}
                  />
                </div>

                {/* 7. Niveau de douleur */}
                <div>
                  <Slider
                    steps={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
                    value={(editFormData.pain_level ?? 0).toString()}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, pain_level: parseInt(value) }))}
                    label="Niveau de douleur"
                    showBadge={true}
                    badgeFormatter={(value) => {
                      const painLevel = PAIN_LEVELS.find(p => p.value === parseInt(value));
                      return painLevel ? `${value} - ${painLevel.label}` : value;
                    }}
                  />
                </div>

                {/* 8. Présence de sang */}
                <div>
                  <Slider
                    steps={BLOOD_LEVELS.map(level => level.label)}
                    value={BLOOD_LEVELS.find(level => level.value === (editFormData.blood_level || 'none'))?.label || 'Aucune'}
                    onValueChange={(label) => {
                      const level = BLOOD_LEVELS.find(l => l.label === label);
                      if (level) setEditFormData(prev => ({ ...prev, blood_level: level.value }));
                    }}
                    label="Présence de sang"
                    showBadge={true}
                  />
                </div>

                {/* 9. Présence de mucosité */}
                <div>
                  <Slider
                    steps={MUCUS_LEVELS.map(level => level.label)}
                    value={MUCUS_LEVELS.find(level => level.value === (editFormData.mucus_level || 'none'))?.label || 'Aucune'}
                    onValueChange={(label) => {
                      const level = MUCUS_LEVELS.find(l => l.label === label);
                      if (level) setEditFormData(prev => ({ ...prev, mucus_level: level.value }));
                    }}
                    label="Présence de mucosité"
                    showBadge={true}
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

