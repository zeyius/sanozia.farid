import React from 'react';
import { BristolIcon } from './BristolIcon';

interface BristolType {
  value: number;
  label: string;
  url: string;
}

interface BristolGridProps {
  types: BristolType[];
  value: number;
  onValueChange: (value: number) => void;
  onInfoClick?: (type: number) => void;
}

export function BristolGrid({ types, value, onValueChange, onInfoClick }: BristolGridProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl">
      {types.map((type) => {
        const isSelected = value === type.value;
        
        let buttonClassName = 'flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ';
        
        if (isSelected) {
          buttonClassName += 'border-[#303d25] bg-[#f9eddf] shadow-md';
        } else {
          buttonClassName += 'border-[#e3c79f] bg-white hover:border-[#c2be98]';
        }
        
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onValueChange(type.value)}
            className={`${buttonClassName} w-full aspect-square`}
          >
            {/* Image */}
            <div className="flex-1 flex items-center justify-center px-2">
              <BristolIcon type={type.value} className="w-full h-full max-h-16" />
            </div>
            
            {/* Label with info button */}
            <div className="flex items-center justify-center gap-1 mt-auto pb-1">
              <span className="text-xs text-center text-[#303d25] font-medium truncate">
                {type.label}
              </span>
              {onInfoClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInfoClick(type.value);
                  }}
                  className="w-4 h-4 flex items-center justify-center border border-[#303d25] text-[#303d25] rounded-full hover:bg-[#f9eddf] transition-colors flex-shrink-0"
                  aria-label={`Informations sur ${type.label}`}
                >
                  <span className="text-[10px] font-bold leading-none">i</span>
                </button>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
