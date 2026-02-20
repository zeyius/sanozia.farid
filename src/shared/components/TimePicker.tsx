import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { logger, loggerContexts } from '../utils/logger';
import { Button } from './Button';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

const getPresetTimes = () => {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  
  return [
    { label: '8:00', value: '08:00', isCurrent: false },
    { label: '12:00', value: '12:00', isCurrent: false },
    { label: '16:00', value: '16:00', isCurrent: false },
    { label: `${currentHour}:${currentMinute}`, value: currentTime, isCurrent: true }
  ];
};

export function TimePicker({ value, onChange, label, disabled = false, error, required = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [inputError, setInputError] = useState('');

  const validateTime = (timeString: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(timeString);
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    
    // Si c'est déjà au bon format, retourner tel quel
    if (validateTime(timeString)) {
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    // Essayer de parser différents formats
    const cleanTime = timeString.replace(/[^\d:]/g, '');
    
    if (cleanTime.includes(':')) {
      const [hours, minutes] = cleanTime.split(':');
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    } else if (cleanTime.length >= 3 && cleanTime.length <= 4) {
      // Format HHMM ou HMM
      const hours = cleanTime.slice(0, -2);
      const minutes = cleanTime.slice(-2);
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    }
    
    return timeString;
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setInputError('');
  };

  const handlePresetClick = (presetValue: string) => {
    setInputValue(presetValue);
    setInputError('');
    // Valider automatiquement l'heure préremplie
    logger.debug('TimePicker preset selected:', { presetValue }, loggerContexts.UI);
    onChange(presetValue);
    setIsOpen(false);
  };

  const handleConfirm = () => {
    const formattedTime = formatTime(inputValue);
    
    if (!formattedTime || !validateTime(formattedTime)) {
      setInputError('Format invalide. Utilisez HH:MM (ex: 14:30)');
      return;
    }
    
    logger.debug('TimePicker handleConfirm called with:', { formattedTime }, loggerContexts.UI);
    onChange(formattedTime);
    setIsOpen(false);
    setInputError('');
  };

  const handleCancel = () => {
    setInputValue(value);
    setInputError('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-[#303d25] mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input principal */}
      <div className="relative">
      <input
  type="text"
  value={value}
  onClick={() => !disabled && setIsOpen(true)}
  readOnly
  disabled={disabled}
  style={{ height: '44px' }}
  className={`w-full py-2 px-3 pr-10 border-2 rounded-lg focus:outline-none focus:border-[#b36b43] bg-white/80 backdrop-blur-sm transition-colors cursor-pointer text-[#303d25] placeholder:text-[#303d25]/60 ${
    error
      ? 'border-red-400 focus:border-red-500'
      : 'border-[#e3c79f] focus:border-[#b36b43] hover:border-[#b36b43]'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  placeholder="HH:MM"
/>
        <Clock 
          size={20} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#303d25]/60 pointer-events-none" 
        />
        

      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Popup de sélection */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleCancel}
          />
          
          {/* Popup sous le champ Heure */}
          <div className="fixed inset-x-4 mt-2 bg-white rounded-xl shadow-xl border border-[#e3c79f]/30 z-50 p-4" style={{
            top: `${(document.querySelector('[data-component-name="TimePicker"]')?.getBoundingClientRect().bottom || 0) + 8}px`
          }}>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#303d25] text-center">
                Entrez l'heure (format 24h)
              </h3>
              
              {/* Input de saisie */}
              <div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full p-3 border-2 border-[#e3c79f] rounded-lg focus:outline-none focus:border-[#b36b43] text-center text-lg font-mono"
                  placeholder="20:30"
                  maxLength={5}
                  autoFocus
                />
                {inputError && (
                  <p className="text-red-500 text-sm mt-1 text-center">{inputError}</p>
                )}
              </div>
              
              {/* Heures prédéfinies */}
              <div>
                <p className="text-sm text-[#303d25]/70 mb-2 text-center">Ou choisissez :</p>
                <div className="grid grid-cols-4 gap-2">
                  {getPresetTimes().map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetClick(preset.value)}
                      className={`p-2 text-sm border rounded-lg transition-colors ${
                        preset.isCurrent 
                          ? 'border-[#b36b43] bg-[#b36b43] text-white' 
                          : 'border-[#e3c79f] hover:bg-[#f5f0e8] text-[#303d25]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-[#e3c79f] text-[#b36b43] rounded-lg hover:bg-[#f5f0e8] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-[#b36b43] text-white rounded-lg hover:bg-[#9d5a39] transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}