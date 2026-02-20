import React from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
  className?: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Sélectionner...",
  allowEmpty = false,
  className = ""
}: DropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border-2 border-[#e3c79f] rounded-lg focus:outline-none focus:border-[#b36b43] bg-white/80 backdrop-blur-sm transition-colors appearance-none pr-10 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${!value ? 'text-gray-500' : 'text-[#303d25]'} ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {allowEmpty && (
          <option value="">Non spécifié</option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            className={option.value === 'none' ? 'text-gray-500' : ''}
            style={option.value === 'none' ? { color: '#6b7280' } : {}}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Flèche personnalisée conforme au design */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown 
          size={16} 
          className={`transition-colors ${
            disabled ? 'text-gray-400' : 'text-[#303d25]'
          }`} 
        />
      </div>
    </div>
  );
}
