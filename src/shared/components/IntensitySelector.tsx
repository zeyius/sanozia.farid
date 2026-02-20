import React from 'react';
import { INTENSITY_LEVELS } from '../../shared/constants';
import { getSeverityLabel } from './SymptomSlider';

interface IntensitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon?: React.ReactNode;
}

export function IntensitySelector({ value, onChange, label, icon }: IntensitySelectorProps) {
  const severity = getSeverityLabel(value);

  return (
    <div className="mb-4">
      {/* Header aligned with severity badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <div className="text-[#303d25] flex-shrink-0">{icon}</div>}
          <span className="font-medium text-[#303d25] truncate" title={label}>{label}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap min-w-[75px] text-center flex-shrink-0 ${severity.bgColor} ${severity.color}`}>
          {severity.label}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {INTENSITY_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={`px-2 py-2 text-xs rounded-lg border-2 transition-all duration-200 font-medium ${
              value === level.value
                ? `${level.color} ${level.textColor} ${level.borderColor} shadow-md scale-105`
                : `bg-gray-50 text-gray-600 border-gray-200 hover:${level.color} hover:${level.textColor} hover:${level.borderColor}`
            }`}
          >
            <div className="text-center">
              <div className="font-bold text-lg leading-none mb-1">{level.value}</div>
              <div className="text-xs leading-tight">{level.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}