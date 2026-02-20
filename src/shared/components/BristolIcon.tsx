import React from 'react';

interface BristolIconProps {
  type: number;
  className?: string;
}

export function BristolIcon({ type, className = '' }: BristolIconProps) {
  const baseClasses = className || 'w-full h-full';

  switch (type) {
    case 1:
      // Type 1 : Petites crottes dures et détachées (scybales) - like nuts
      return (
        <svg viewBox="0 0 120 80" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Groupe 1 - haut */}
          <ellipse cx="18" cy="22" rx="7" ry="8" fill="#5D4E3C" />
          <ellipse cx="17" cy="20" rx="5" ry="6" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="32" cy="18" rx="6.5" ry="7.5" fill="#5D4E3C" />
          <ellipse cx="31" cy="16" rx="4.5" ry="5.5" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="46" cy="20" rx="7.5" ry="8.5" fill="#5D4E3C" />
          <ellipse cx="45" cy="18" rx="5.5" ry="6.5" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="62" cy="19" rx="6.5" ry="7.5" fill="#5D4E3C" />
          <ellipse cx="61" cy="17" rx="4.5" ry="5.5" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="76" cy="21" rx="7" ry="8" fill="#5D4E3C" />
          <ellipse cx="75" cy="19" rx="5" ry="6" fill="#6B5A47" opacity="0.7" />
          
          {/* Groupe 2 - milieu */}
          <ellipse cx="25" cy="42" rx="6.5" ry="7.5" fill="#5D4E3C" />
          <ellipse cx="24" cy="40" rx="4.5" ry="5.5" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="40" cy="44" rx="7.5" ry="8.5" fill="#5D4E3C" />
          <ellipse cx="39" cy="42" rx="5.5" ry="6.5" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="56" cy="43" rx="7" ry="8" fill="#5D4E3C" />
          <ellipse cx="55" cy="41" rx="5" ry="6" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="70" cy="45" rx="6.5" ry="7.5" fill="#5D4E3C" />
          <ellipse cx="69" cy="43" rx="4.5" ry="5.5" fill="#6B5A47" opacity="0.7" />
          
          {/* Groupe 3 - bas */}
          <ellipse cx="32" cy="64" rx="7" ry="8" fill="#5D4E3C" />
          <ellipse cx="31" cy="62" rx="5" ry="6" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="48" cy="66" rx="7.5" ry="8.5" fill="#5D4E3C" />
          <ellipse cx="47" cy="64" rx="5.5" ry="6.5" fill="#6B5A47" opacity="0.7" />
          
          <ellipse cx="63" cy="65" rx="6.5" ry="7.5" fill="#5D4E3C" />
          <ellipse cx="62" cy="63" rx="4.5" ry="5.5" fill="#6B5A47" opacity="0.7" />
        </svg>
      );

    case 2:
      // Type 2 : En forme de saucisse, dure et grumeleuse
      return (
        <svg viewBox="0 0 120 50" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base de la saucisse grumeleuse */}
          <ellipse cx="15" cy="25" rx="8" ry="10" fill="#6B5545" />
          <ellipse cx="25" cy="24" rx="9" ry="11" fill="#6B5545" />
          <ellipse cx="36" cy="25" rx="10" ry="12" fill="#6B5545" />
          <ellipse cx="48" cy="24" rx="9.5" ry="11.5" fill="#6B5545" />
          <ellipse cx="59" cy="25" rx="10" ry="12" fill="#6B5545" />
          <ellipse cx="71" cy="24" rx="9.5" ry="11.5" fill="#6B5545" />
          <ellipse cx="82" cy="25" rx="9" ry="11" fill="#6B5545" />
          <ellipse cx="93" cy="25" rx="9.5" ry="11" fill="#6B5545" />
          <ellipse cx="104" cy="25" rx="8" ry="10" fill="#6B5545" />
          
          {/* Ombres et reliefs */}
          <ellipse cx="15" cy="23" rx="6" ry="7" fill="#7A6855" opacity="0.6" />
          <ellipse cx="25" cy="22" rx="7" ry="8" fill="#7A6855" opacity="0.6" />
          <ellipse cx="36" cy="23" rx="7.5" ry="9" fill="#7A6855" opacity="0.6" />
          <ellipse cx="48" cy="22" rx="7" ry="8.5" fill="#7A6855" opacity="0.6" />
          <ellipse cx="59" cy="23" rx="7.5" ry="9" fill="#7A6855" opacity="0.6" />
          <ellipse cx="71" cy="22" rx="7" ry="8.5" fill="#7A6855" opacity="0.6" />
          <ellipse cx="82" cy="23" rx="7" ry="8" fill="#7A6855" opacity="0.6" />
          <ellipse cx="93" cy="23" rx="7" ry="8" fill="#7A6855" opacity="0.6" />
          <ellipse cx="104" cy="23" rx="6" ry="7" fill="#7A6855" opacity="0.6" />
          
          {/* Séparations entre les grumeaux */}
          <line x1="20" y1="15" x2="20" y2="35" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
          <line x1="31" y1="14" x2="31" y2="36" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
          <line x1="42" y1="14" x2="42" y2="36" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
          <line x1="54" y1="14" x2="54" y2="36" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
          <line x1="65" y1="14" x2="65" y2="36" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
          <line x1="77" y1="14" x2="77" y2="36" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
          <line x1="88" y1="15" x2="88" y2="35" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
          <line x1="99" y1="15" x2="99" y2="35" stroke="#5D4E3C" strokeWidth="1" opacity="0.4" />
        </svg>
      );

    case 3:
      // Type 3 : Comme une saucisse avec des craquelures
      return (
        <svg viewBox="0 0 120 45" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Corps principal - forme de saucisse */}
          <ellipse cx="60" cy="22" rx="50" ry="13" fill="#8B7355" />
          <ellipse cx="60" cy="20" rx="48" ry="11" fill="#9A8365" opacity="0.6" />
          
          {/* Extrémités arrondies */}
          <ellipse cx="12" cy="22" rx="8" ry="13" fill="#8B7355" />
          <ellipse cx="108" cy="22" rx="8" ry="13" fill="#8B7355" />
          
          {/* Craquelures verticales */}
          <path d="M20 12 Q21 17, 20 20 Q19 23, 20 27 Q21 30, 20 33" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M30 11 Q31 17, 30 21 Q29 24, 30 28 Q31 31, 30 34" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M40 10 Q41 16, 40 21 Q39 25, 40 29 Q41 32, 40 35" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M50 10 Q51 16, 50 21 Q49 25, 50 29 Q51 32, 50 35" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M60 10 Q61 16, 60 21 Q59 25, 60 29 Q61 32, 60 35" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M70 10 Q71 16, 70 21 Q69 25, 70 29 Q71 32, 70 35" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M80 11 Q81 17, 80 21 Q79 24, 80 28 Q81 31, 80 34" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M90 11 Q91 17, 90 21 Q89 24, 90 28 Q91 31, 90 34" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M100 12 Q101 17, 100 20 Q99 23, 100 27 Q101 30, 100 33" 
                stroke="#6B5545" strokeWidth="1.2" fill="none" opacity="0.7" />
          
          {/* Craquelures horizontales légères */}
          <path d="M15 17 Q25 16, 35 17 Q45 16, 55 17 Q65 16, 75 17 Q85 16, 95 17 Q105 16, 110 17" 
                stroke="#6B5545" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M15 27 Q25 28, 35 27 Q45 28, 55 27 Q65 28, 75 27 Q85 28, 95 27 Q105 28, 110 27" 
                stroke="#6B5545" strokeWidth="0.8" fill="none" opacity="0.5" />
        </svg>
      );

    case 4:
      // Type 4 : Comme une saucisse lisse et douce (forme de serpent)
      return (
        <svg viewBox="0 0 120 45" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Corps principal - très lisse */}
          <path 
            d="M10 22 Q30 20, 50 22 Q70 24, 90 22 Q100 21, 110 22" 
            stroke="#9B8370" 
            strokeWidth="18" 
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Highlight pour l'effet lisse et brillant */}
          <path 
            d="M12 17 Q30 15, 50 17 Q70 19, 90 17 Q100 16, 108 17" 
            stroke="#B8A890" 
            strokeWidth="6" 
            strokeLinecap="round"
            opacity="0.5"
            fill="none"
          />
          
          {/* Légère ombre en bas */}
          <path 
            d="M12 27 Q30 29, 50 27 Q70 25, 90 27 Q100 28, 108 27" 
            stroke="#7A6855" 
            strokeWidth="4" 
            strokeLinecap="round"
            opacity="0.3"
            fill="none"
          />
        </svg>
      );

    case 5:
      // Type 5 : Morceaux mous avec des bords nets (soft blobs)
      return (
        <svg viewBox="0 0 120 70" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rang supérieur */}
          <ellipse cx="18" cy="20" rx="12" ry="10" fill="#9B8370" />
          <ellipse cx="17" cy="18" rx="9" ry="7" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="40" cy="18" rx="14" ry="11" fill="#9B8370" />
          <ellipse cx="39" cy="16" rx="11" ry="8" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="64" cy="19" rx="13" ry="10" fill="#9B8370" />
          <ellipse cx="63" cy="17" rx="10" ry="7" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="86" cy="20" rx="12" ry="10" fill="#9B8370" />
          <ellipse cx="85" cy="18" rx="9" ry="7" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="106" cy="19" rx="11" ry="9" fill="#9B8370" />
          <ellipse cx="105" cy="17" rx="8" ry="6" fill="#B8A58C" opacity="0.5" />
          
          {/* Rang intermédiaire */}
          <ellipse cx="28" cy="40" rx="13" ry="10" fill="#9B8370" />
          <ellipse cx="27" cy="38" rx="10" ry="7" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="52" cy="41" rx="15" ry="11" fill="#9B8370" />
          <ellipse cx="51" cy="39" rx="12" ry="8" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="76" cy="40" rx="13" ry="10" fill="#9B8370" />
          <ellipse cx="75" cy="38" rx="10" ry="7" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="97" cy="41" rx="12" ry="9" fill="#9B8370" />
          <ellipse cx="96" cy="39" rx="9" ry="6" fill="#B8A58C" opacity="0.5" />
          
          {/* Rang inférieur */}
          <ellipse cx="20" cy="58" rx="11" ry="9" fill="#9B8370" />
          <ellipse cx="19" cy="56" rx="8" ry="6" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="42" cy="60" rx="13" ry="10" fill="#9B8370" />
          <ellipse cx="41" cy="58" rx="10" ry="7" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="65" cy="59" rx="14" ry="11" fill="#9B8370" />
          <ellipse cx="64" cy="57" rx="11" ry="8" fill="#B8A58C" opacity="0.5" />
          
          <ellipse cx="88" cy="60" rx="12" ry="9" fill="#9B8370" />
          <ellipse cx="87" cy="58" rx="9" ry="6" fill="#B8A58C" opacity="0.5" />
        </svg>
      );

    case 6:
      // Type 6 : Morceaux duveteux avec bords irréguliers (mushy)
      return (
        <svg viewBox="0 0 120 70" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Morceaux irréguliers avec bords déchiquetés */}
          <path 
            d="M8 20 Q12 15, 18 17 Q22 14, 26 18 Q30 15, 34 20 Q38 17, 40 22 Q36 25, 32 23 Q28 26, 24 23 Q20 25, 16 22 Q12 24, 8 20 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="24" cy="20" rx="10" ry="7" fill="#C4B5A0" opacity="0.5" />
          
          <path 
            d="M44 18 Q48 13, 54 15 Q58 12, 62 16 Q66 13, 70 18 Q74 15, 78 20 Q74 23, 70 21 Q66 24, 62 21 Q58 23, 54 20 Q50 22, 44 18 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="61" cy="18" rx="11" ry="7" fill="#C4B5A0" opacity="0.5" />
          
          <path 
            d="M82 19 Q86 14, 92 16 Q96 13, 100 17 Q104 14, 108 19 Q112 16, 114 21 Q110 24, 106 22 Q102 25, 98 22 Q94 24, 90 21 Q86 23, 82 19 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="98" cy="19" rx="10" ry="7" fill="#C4B5A0" opacity="0.5" />
          
          {/* Rang intermédiaire */}
          <path 
            d="M14 40 Q18 35, 24 37 Q28 34, 32 38 Q36 35, 40 40 Q44 37, 46 42 Q42 45, 38 43 Q34 46, 30 43 Q26 45, 22 42 Q18 44, 14 40 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="30" cy="40" rx="11" ry="7" fill="#C4B5A0" opacity="0.5" />
          
          <path 
            d="M52 41 Q56 36, 62 38 Q66 35, 70 39 Q74 36, 78 41 Q82 38, 84 43 Q80 46, 76 44 Q72 47, 68 44 Q64 46, 60 43 Q56 45, 52 41 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="68" cy="41" rx="11" ry="7" fill="#C4B5A0" opacity="0.5" />
          
          <path 
            d="M90 40 Q94 35, 100 37 Q104 34, 108 38 Q112 35, 115 40 Q111 43, 107 41 Q103 44, 99 41 Q95 43, 90 40 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="102" cy="39" rx="9" ry="6" fill="#C4B5A0" opacity="0.5" />
          
          {/* Rang inférieur */}
          <path 
            d="M20 58 Q24 53, 30 55 Q34 52, 38 56 Q42 53, 46 58 Q50 55, 52 60 Q48 63, 44 61 Q40 64, 36 61 Q32 63, 28 60 Q24 62, 20 58 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="36" cy="58" rx="11" ry="7" fill="#C4B5A0" opacity="0.5" />
          
          <path 
            d="M58 59 Q62 54, 68 56 Q72 53, 76 57 Q80 54, 84 59 Q88 56, 90 61 Q86 64, 82 62 Q78 65, 74 62 Q70 64, 66 61 Q62 63, 58 59 Z" 
            fill="#B8A890" 
          />
          <ellipse cx="74" cy="59" rx="11" ry="7" fill="#C4B5A0" opacity="0.5" />
        </svg>
      );

    case 7:
      // Type 7 : Entièrement liquide (flaque)
      return (
        <svg viewBox="0 0 120 70" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Flaque principale avec bords irréguliers */}
          <path 
            d="M20 45 Q18 38, 25 35 Q35 32, 45 34 Q55 32, 65 34 Q75 32, 85 35 Q95 33, 102 38 Q105 42, 100 48 Q95 52, 85 54 Q75 56, 65 55 Q55 56, 45 54 Q35 56, 25 52 Q18 50, 20 45 Z" 
            fill="#C4B5A0" 
            opacity="0.7"
          />
          
          {/* Couches internes pour l'effet liquide */}
          <ellipse cx="60" cy="45" rx="32" ry="12" fill="#D4C5B0" opacity="0.6" />
          <ellipse cx="58" cy="43" rx="25" ry="9" fill="#E4D5C0" opacity="0.5" />
          
          {/* Petites éclaboussures autour */}
          <ellipse cx="15" cy="40" rx="5" ry="4" fill="#C4B5A0" opacity="0.5" />
          <ellipse cx="25" cy="32" rx="4" ry="3" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="38" cy="29" rx="3" ry="2.5" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="52" cy="28" rx="3.5" ry="3" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="68" cy="29" rx="3" ry="2.5" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="82" cy="31" rx="4" ry="3" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="95" cy="36" rx="4.5" ry="3.5" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="105" cy="42" rx="5" ry="4" fill="#C4B5A0" opacity="0.5" />
          
          <ellipse cx="18" cy="52" rx="4" ry="3" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="28" cy="58" rx="3.5" ry="3" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="42" cy="60" rx="3" ry="2.5" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="78" cy="59" rx="3.5" ry="3" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="92" cy="56" rx="4" ry="3" fill="#C4B5A0" opacity="0.4" />
          <ellipse cx="102" cy="50" rx="4" ry="3.5" fill="#C4B5A0" opacity="0.4" />
        </svg>
      );

    case 8:
      // Type 8 : Envie fécale (aucune selle produite)
      return (
        <svg viewBox="0 0 100 100" className={baseClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cercle extérieur pointillé */}
          <circle
            cx="50"
            cy="50"
            r="32"
            stroke="#9B8370"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            fill="none"
            opacity="0.7"
          />
          
          {/* Cercle intérieur pointillé */}
          <circle
            cx="50"
            cy="50"
            r="22"
            stroke="#9B8370"
            strokeWidth="2"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.5"
          />
          
          {/* Symbole de vide/rien au centre */}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill="#D4C5B0"
            opacity="0.2"
          />
          
          {/* Lignes diagonales pour indiquer "vide" */}
          <line x1="42" y1="42" x2="58" y2="58" stroke="#9B8370" strokeWidth="1.5" opacity="0.4" />
          <line x1="58" y1="42" x2="42" y2="58" stroke="#9B8370" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );

    default:
      return null;
  }
}

