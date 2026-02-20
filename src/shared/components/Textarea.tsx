import React, { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  enableSpeechToText?: boolean;
  rows?: number;
}

export function Textarea({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  enableSpeechToText = true,
  rows = 3
}: TextareaProps) {
  // Animation des points pendant l'écoute - déclarer AVANT useSpeechToText
  const [dotsCount, setDotsCount] = useState(1);
  
  // Hook speech-to-text - toujours appelé même si pas utilisé
  const {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText();

  // Effet pour l'animation des points
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setDotsCount(prev => prev >= 3 ? 1 : prev + 1);
      }, 800); // Change toutes les 800ms pour un effet plus naturel
      return () => clearInterval(interval);
    } else {
      setDotsCount(1);
    }
  }, [isListening]);

  // Effet pour traiter le transcript
  useEffect(() => {
    if (transcript) {
      // Ajouter le transcript à la valeur existante ou la remplacer
      const newValue = value ? `${value} ${transcript}` : transcript;
      onChange(newValue);
      resetTranscript();
    }
  }, [transcript, value, onChange, resetTranscript]);

  // Afficher la valeur avec animation de points pendant l'écoute
  const getAnimatedDots = () => '.'.repeat(dotsCount);
  const displayValue = isListening 
    ? (value ? `${value}${getAnimatedDots()}` : getAnimatedDots()) 
    : value;

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const showMicButton = enableSpeechToText && isSupported && !disabled;
  
  // Debug pour mobile
  console.log('Textarea debug:', {
    enableSpeechToText,
    isSupported,
    disabled,
    showMicButton,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined'
  });

  return (
    <div className="relative">
      <textarea
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 ${showMicButton ? 'pr-12' : 'pr-3'} py-2 border-2 border-[#e3c79f] rounded-lg focus:outline-none focus:border-[#b36b43] bg-white/80 backdrop-blur-sm transition-colors resize-none text-[#303d25] placeholder:text-[#303d25]/60 ${className}`}
      />
      
      {showMicButton && (
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled}
          className={`absolute right-3 top-3 p-1.5 rounded-full transition-all duration-200 ${
            isListening
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-400 hover:text-[#303d25] hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isListening ? 'Arrêter l\'écoute' : 'Commencer la dictée vocale'}
        >
          {isListening ? (
            <MicOff size={18} className="animate-pulse" />
          ) : (
            <Mic size={18} />
          )}
        </button>
      )}
      

      
      {/* Message d'erreur speech-to-text */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 z-10">
          {error}
        </div>
      )}
    </div>
  );
}
