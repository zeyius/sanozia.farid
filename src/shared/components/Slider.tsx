import React from 'react';

interface SliderProps {
  steps: string[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  showBadge?: boolean;
  badgeFormatter?: (value: string) => string;
}

const getSliderColor = (index: number, totalSteps: number): string => {
  const percentage = index / (totalSteps - 1);
  if (percentage <= 0.33) return 'bg-[#c2be98]';
  if (percentage <= 0.66) return 'bg-[#e3c79f]';
  return 'bg-[#b36b43]';
};

export function Slider({ steps, value, onValueChange, label, showBadge = false, badgeFormatter }: SliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  
  const currentIndex = steps.indexOf(value);
  const maxIndex = steps.length - 1;
  
  // Track initial touch/mouse position to detect intentional drag
  const startPositionRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = React.useRef(false);
  const DRAG_THRESHOLD = 5; // Minimum pixels to move before considering it a drag
  
  // CSS to hide default thumb and improve touch
  const sliderStyle = `
    .slider-thumb::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
    }
    .slider-thumb::-moz-range-thumb {
      appearance: none;
      border: none;
      background: transparent;
    }
    .slider-thumb {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
  `;
  
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = sliderStyle;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Function to calculate value based on position
  const calculateValue = (clientX: number): number => {
    if (!sliderRef.current) return currentIndex;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(percentage * maxIndex);
  };

  // Touch event handlers with drag detection
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    // Store initial position but don't change value yet
    startPositionRef.current = { x: touch.clientX, y: touch.clientY };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !startPositionRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startPositionRef.current.x);
    const deltaY = Math.abs(touch.clientY - startPositionRef.current.y);
    
    // Only update value if horizontal movement exceeds threshold
    // This prevents accidental changes during vertical scroll
    if (deltaX > DRAG_THRESHOLD && deltaX > deltaY) {
      hasMovedRef.current = true;
      const newIndex = calculateValue(touch.clientX);
      onValueChange(steps[newIndex]);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    startPositionRef.current = null;
    hasMovedRef.current = false;
  };

  // Mouse event handlers with drag detection
  const handleMouseDown = (e: React.MouseEvent) => {
    // Store initial position but don't change value yet
    startPositionRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !startPositionRef.current) return;
    
    const deltaX = Math.abs(e.clientX - startPositionRef.current.x);
    const deltaY = Math.abs(e.clientY - startPositionRef.current.y);
    
    // Only update value if movement exceeds threshold
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      const newIndex = calculateValue(e.clientX);
      onValueChange(steps[newIndex]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    startPositionRef.current = null;
    hasMovedRef.current = false;
  };

  // Effect to handle global mouse events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const sliderColor = getSliderColor(currentIndex, steps.length);

  return (
    <div className="relative">
      {/* Label and badge */}
      {label && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-semibold text-[#303d25]">{label}</span>
        </div>
      )}
      
      {/* Badge */}
      {showBadge && (
        <div className="flex justify-end mb-1">
          <span className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap min-w-[75px] text-center bg-[#f9eddf] text-[#303d25]">
            {badgeFormatter ? badgeFormatter(value) : value}
          </span>
        </div>
      )}

      {/* Slider track (contains progress, input and thumb) */}
      <div 
        ref={sliderRef}
        className="w-full h-8 relative overflow-visible cursor-pointer flex items-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{ touchAction: 'none' }}
      >
        {/* Invisible enlarged touch area */}
        <div className="absolute inset-0 -m-2" />
        
        {/* Track background */}
        <div className="w-full h-2 bg-[#f9eddf] rounded-full border border-[#e3c79f]/20 relative">
          {/* Progress bar */}
          <div 
            className={`h-full ${sliderColor} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${(currentIndex / maxIndex) * 100}%` }}
          />
        </div>

        {/* Input range for accessibility */}
        <input
          type="range"
          min="0"
          max={maxIndex}
          value={currentIndex}
          onChange={(e) => onValueChange(steps[parseInt(e.target.value)])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer slider-thumb z-20"
          style={{ background: 'transparent' }}
          tabIndex={0}
        />

        {/* Custom thumb centered on track */}
        <div 
          className={`absolute w-5 h-5 bg-[#303d25] border-2 border-white rounded-full shadow-lg transition-all duration-200 z-10 ${
            isDragging ? 'scale-125' : 'hover:scale-110'
          }`}
          style={{
            left: `${(currentIndex / maxIndex) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Slider markers */}
      <div className="relative mt-3 pb-6">
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === maxIndex;
          
          // Calcul du transform pour le conteneur
          let containerTransform = 'translateX(-50%)'; // Centre par défaut
          if (isFirst) {
            containerTransform = 'translateX(0%)'; // Aligné à gauche
          } else if (isLast) {
            containerTransform = 'translateX(-100%)'; // Aligné à droite
          }
          
          // Alignement du point dans sa colonne
          let alignItems = 'items-center'; // Centre par défaut
          if (isFirst) {
            alignItems = 'items-start'; // Point à gauche
          } else if (isLast) {
            alignItems = 'items-end'; // Point à droite
          }
          
          return (
            <div
              key={index}
              className="absolute flex items-center justify-center"
              style={{
                left: `${(index / maxIndex) * 100}%`,
                transform: containerTransform,
                top: '-6px'
              }}
            >
              <div className={`flex flex-col ${alignItems}`}>
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-200 border ${
                    currentIndex >= index
                      ? `${sliderColor} border-[#303d25]/20`
                      : 'bg-[#f9eddf] border-[#e3c79f]/40'
                  }`}
                />
                <span
                  className={`text-xs mt-2 font-medium transition-colors duration-200 whitespace-nowrap ${
                    currentIndex === index ? 'text-[#303d25]' : 'text-[#c2be98]'
                  }`}
                >
                  {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
