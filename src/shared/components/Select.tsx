import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Sélectionnez',
  disabled = false
}: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 pr-10 py-2 border-2 border-[#e3c79f] rounded-lg focus:outline-none focus:border-[#b36b43] bg-white/80 backdrop-blur-sm transition-colors appearance-none cursor-pointer ${
          value === '' ? 'text-gray-500' : 'text-[#303d25]'
        }`}
      >
        {value === '' && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Icône flèche personnalisée */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown 
          size={18} 
          className={`transition-colors ${
            disabled 
              ? 'text-gray-400' 
              : 'text-[#303d25]'
          }`} 
        />
      </div>
    </div>
  );
}