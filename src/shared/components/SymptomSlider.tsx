import React from 'react';

interface SymptomSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon?: React.ReactNode;
  showBadge?: boolean;
}

export const getSeverityLabel = (value: number): { label: string; color: string; bgColor: string } => {
  if (value === 0) return { label: 'Aucun', color: 'text-[#c2be98]', bgColor: 'bg-[#f9eddf]' };
  if (value === 1) return { label: 'Très léger', color: 'text-[#c2be98]', bgColor: 'bg-[#f9eddf]' };
  if (value === 2) return { label: 'Léger', color: 'text-[#c2be98]', bgColor: 'bg-[#f9eddf]' };
  if (value === 3) return { label: 'Modéré', color: 'text-[#b36b43]', bgColor: 'bg-[#e3c79f]/30' };
  if (value === 4) return { label: 'Marqué', color: 'text-[#b36b43]', bgColor: 'bg-[#e3c79f]/30' };
  return { label: 'Sévère', color: 'text-[#303d25]', bgColor: 'bg-[#e3c79f]' };
};

const getSliderColor = (value: number): string => {
  if (value === 0) return 'bg-[#c2be98]';
  if (value === 1) return 'bg-[#c2be98]';
  if (value === 2) return 'bg-[#c2be98]';
  if (value === 3) return 'bg-[#e3c79f]';
  if (value === 4) return 'bg-[#e3c79f]';
  return 'bg-[#b36b43]';
};

export function SymptomSlider({ value, onChange, label, icon, showBadge = true }: SymptomSliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  
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
    if (!sliderRef.current) return value;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(percentage * 5);
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
      const newValue = calculateValue(touch.clientX);
      onChange(newValue);
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
      const newValue = calculateValue(e.clientX);
      onChange(newValue);
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

  const severity = getSeverityLabel(value);
  const sliderColor = getSliderColor(value);

  return (
    <div className="relative">
      {/* Severity badge */}
      {showBadge && (
        <div className="flex justify-end mb-1">
          <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap min-w-[75px] text-center ${severity.bgColor} ${severity.color}`}>
            {severity.label}
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
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>

        {/* Input range for accessibility */}
        <input
          type="range"
          min="0"
          max="5"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
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
            left: `${(value / 5) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Slider markers */}
      <div className="relative mt-3 pb-6">
        {[0, 1, 2, 3, 4, 5].map((mark) => (
          <div
            key={mark}
            className="absolute flex items-center justify-center"
            style={{
              left: `${(mark / 5) * 100}%`,
              transform: 'translateX(-50%)',
              top: '-6px'
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-200 border ${
                  value >= mark
                    ? `${sliderColor} border-[#303d25]/20`
                    : 'bg-[#f9eddf] border-[#e3c79f]/40'
                }`}
              />
              <span
                className={`text-xs mt-2 font-medium transition-colors duration-200 ${
                  value === mark ? 'text-[#303d25]' : 'text-[#c2be98]'
                }`}
              >
                {mark}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}