import React from 'react';
import { X } from 'lucide-react';
import { SymptomSlider, getSeverityLabel } from './SymptomSlider';

interface RessentiFeelingCardProps {
  label: string;
  icon: React.ReactNode;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  disabled?: boolean;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export function RessentiFeelingCard({ 
  label, 
  icon, 
  intensity, 
  onIntensityChange,
  disabled = false,
  onDelete,
  showDeleteButton = false
}: RessentiFeelingCardProps) {
  const severity = getSeverityLabel(intensity);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-lg border border-[#e3c79f]/30 hover:shadow-xl transition-all duration-200">
      {/* Header with icon, title, badge and delete button */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-[#303d25] text-xl flex-shrink-0">{icon}</div>
          <h3 className="font-semibold text-[#303d25] text-lg leading-tight truncate" title={label}>
            {label}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap min-w-[75px] text-center ${severity.bgColor} ${severity.color}`}>
            {severity.label}
          </span>
          {showDeleteButton && onDelete && (
            <button
               onClick={onDelete}
               className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
               title="Supprimer ce symptôme"
             >
               <X size={16} />
             </button>
          )}
        </div>
      </div>

      {/* Slider d'intensité */}
      <div className="mt-2">
        <SymptomSlider
          value={intensity}
          onChange={onIntensityChange}
          label=""
          showBadge={false}
        />
      </div>
    </div>
  );
}