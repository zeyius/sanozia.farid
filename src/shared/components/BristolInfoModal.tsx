import React, { useEffect, useRef, useCallback } from 'react';
import { BRISTOL_INFO } from '../constants';
import { BristolIcon } from './BristolIcon';

interface BristolInfoModalProps {
  isOpen: boolean;
  currentType: number;
  onClose: () => void;
  onNavigate: (type: number) => void;
}

export function BristolInfoModal({ isOpen, currentType, onClose, onNavigate }: BristolInfoModalProps) {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const hasMoved = useRef<boolean>(false);

  const currentInfo = BRISTOL_INFO.find(info => info.type === currentType);

  // Navigation functions with useCallback to maintain stable references
  const handlePrevious = useCallback(() => {
    const newType = currentType === 1 ? 8 : currentType - 1;
    onNavigate(newType);
  }, [currentType, onNavigate]);

  const handleNext = useCallback(() => {
    const newType = currentType === 8 ? 1 : currentType + 1;
    onNavigate(newType);
  }, [currentType, onNavigate]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    hasMoved.current = false; // Réinitialiser le flag
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const diff = Math.abs(touchStartX.current - touchEndX.current);
    
    // Marquer comme mouvement seulement si déplacement > 10px
    if (diff > 10) {
      hasMoved.current = true;
    }
  };

  const handleTouchEnd = () => {
    // Ne traiter que si c'est un vrai swipe (avec mouvement)
    if (!hasMoved.current) {
      return;
    }

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    
    // Réinitialiser pour le prochain geste
    hasMoved.current = false;
  };

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious(); // ✅ Utiliser le callback au lieu de recalculer
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext(); // ✅ Utiliser le callback au lieu de recalculer
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose]); // ✅ Ajouter les callbacks dans les dépendances

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentInfo) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Fermer"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Title */}
          <h3 className="text-2xl font-bold text-[#303d25] mb-4">
            {currentInfo.title}
          </h3>

          {/* Illustration */}
          <div className="w-32 h-32 mb-6 flex items-center justify-center bg-[#f9eddf] rounded-xl p-4">
            <BristolIcon type={currentType} className="w-full h-full" />
          </div>

          {/* Description */}
          <div className="h-24 flex items-center justify-center mb-6 px-2">
            <p className="text-gray-700 leading-relaxed">
              {currentInfo.description}
            </p>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-between w-full mt-4">
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f9eddf] hover:bg-[#e3c79f] transition-colors"
              aria-label="Type précédent"
            >
              <svg 
                className="w-6 h-6 text-[#303d25]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>

            {/* Type indicator */}
            <div className="flex gap-2">
              {BRISTOL_INFO.map((info) => (
                <button
                  key={info.type}
                  type="button"
                  onClick={() => onNavigate(info.type)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    info.type === currentType 
                      ? 'bg-[#303d25] w-6' 
                      : 'bg-[#e3c79f] hover:bg-[#c2be98]'
                  }`}
                  aria-label={`Aller au ${info.title}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f9eddf] hover:bg-[#e3c79f] transition-colors"
              aria-label="Type suivant"
            >
              <svg 
                className="w-6 h-6 text-[#303d25]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
