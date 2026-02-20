import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import './DatePicker.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  error?: string;
}

/*
 * This component uses a hybrid approach with a hidden native date input overlaid
 * by a custom-styled visible container. This design was chosen because the calendar
 * icon when using `<input type="date" />` acan't be hidden or styled in firefox
 */
export function DatePicker({ value, onChange, label, disabled = false, error }: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClick = () => {
    if (disabled || !inputRef.current) return;
    // Compatibility for old browsers that do not support showPicker
    if (typeof inputRef.current.showPicker === 'function') {
      inputRef.current.showPicker();
    } else {
      inputRef.current.click();
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'jj/mm/aaaa';
    
    try {
      const date = new Date(dateString + 'T00:00:00');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-[#303d25] mb-3">
          {label}
          {error && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div 
        className="relative cursor-pointer group"
        onClick={handleClick}
      >
        {/* Hidden native input that covers the entire clickable area */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          style={{ pointerEvents: disabled ? 'none' : 'all' }}
          tabIndex={-1}
        />

        {/* Custom visible container - entire area is clickable */}
        <div
          className={
            `w-full h-[48px] sm:h-[44px] px-3 py-2 border-2 rounded-lg bg-white/80 backdrop-blur-sm transition-colors flex items-center justify-between pointer-events-none
            ${error
              ? 'border-red-400 group-hover:border-red-500 group-active:border-red-500'
              : 'border-[#e3c79f] group-hover:border-[#b36b43] group-active:border-[#b36b43]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
          }
        >
          <span className={value ? 'text-[#303d25]' : 'text-[#303d25]/60'}>
            {formatDisplayDate(value)}
          </span>

          <Calendar
            size={20}
            className="text-[#303d25]/60 flex-shrink-0 ml-2"
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
