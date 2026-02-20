import React from 'react';

interface StoolIconProps {
  type: number;
  size?: number;
  className?: string;
}

export function StoolIcon({ type, size = 16, className = 'text-[#303d25]' }: StoolIconProps) {
  const iconStyle = {
    width: size,
    height: size,
    verticalAlign: 'middle',
    display: 'block'
  };

  // Icônes basées sur l'échelle de Bristol officielle - plus compactes et représentatives
  switch (type) {
    case 0:
    case 8: // Type 8 utilisé pour "Aucune selle" en base de données
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeDasharray="2 2" opacity="0.4" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
      );
    
    case 1: // Morceaux durs séparés (noix)
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="currentColor">
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="12" cy="12" r="2.5" />
          <circle cx="18" cy="12" r="2.5" />
        </svg>
      );
    
    case 2: // Saucisse grumeleuse
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="currentColor">
          <rect x="4" y="10" width="16" height="4" rx="2" />
          <circle cx="7" cy="12" r="0.8" fill="white" opacity="0.6" />
          <circle cx="12" cy="12" r="0.8" fill="white" opacity="0.6" />
          <circle cx="17" cy="12" r="0.8" fill="white" opacity="0.6" />
        </svg>
      );
    
    case 3: // Saucisse avec fissures
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="currentColor">
          <rect x="4" y="10" width="16" height="4" rx="2" />
          <line x1="8" y1="10" x2="8" y2="8" stroke="currentColor" strokeWidth="0.8" />
          <line x1="12" y1="10" x2="12" y2="8" stroke="currentColor" strokeWidth="0.8" />
          <line x1="16" y1="10" x2="16" y2="8" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      );
    
    case 4: // Saucisse lisse (normal)
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="currentColor">
          <rect x="4" y="10" width="16" height="4" rx="2" />
        </svg>
      );
    
    case 5: // Morceaux mous
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="currentColor">
          <ellipse cx="7" cy="12" rx="2.5" ry="1.8" />
          <ellipse cx="12" cy="12" rx="2.5" ry="1.8" />
          <ellipse cx="17" cy="12" rx="2.5" ry="1.8" />
        </svg>
      );
    
    case 6: // Morceaux duveteux (pâteux)
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12 Q6 10 8 12 Q10 14 12 12 Q14 10 16 12 Q18 14 20 12" strokeLinecap="round" />
          <circle cx="6" cy="11" r="0.5" fill="currentColor" opacity="0.4" />
          <circle cx="10" cy="13" r="0.5" fill="currentColor" opacity="0.4" />
          <circle cx="14" cy="11" r="0.5" fill="currentColor" opacity="0.4" />
          <circle cx="18" cy="13" r="0.5" fill="currentColor" opacity="0.4" />
        </svg>
      );
    
    case 7: // Liquide (diarrhée)
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 10 Q7 8 9 10 Q11 12 13 10 Q15 8 17 10 Q19 12 21 10" strokeLinecap="round" />
          <path d="M4 12 Q6 10 8 12 Q10 14 12 12 Q14 10 16 12 Q18 14 20 12" strokeLinecap="round" />
          <path d="M5 14 Q7 12 9 14 Q11 16 13 14 Q15 12 17 14 Q19 16 21 14" strokeLinecap="round" />
        </svg>
      );
    
    default:
      return (
        <svg viewBox="0 0 24 24" style={iconStyle} className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" opacity="0.3" />
          <path d="M9 9h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}