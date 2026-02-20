export const COLORS = {
  light: {
    primary: '#f6e6d6',
    secondary: '#f9eddf',
    accent: '#e3c79f',
    muted: '#c2be98'
  },
  dark: {
    primary: '#303d25',
    secondary: '#b36b43'
  }
} as const;

export type CookingMethod = 'vapeur' | 'bouilli' | 'grille' | 'cru' | 'frit' | 'roti' | 'micro-ondes';
export type Diagnosis = 'aucune' | 'crohn' | 'colite-ulcereuse' | 'colite-indeterminee' | 'autre';

export const COOKING_METHODS: { value: CookingMethod; label: string }[] = [
  { value: 'vapeur', label: 'À la vapeur' },
  { value: 'bouilli', label: 'Bouilli' },
  { value: 'grille', label: 'Grillé' },
  { value: 'cru', label: 'Cru' },
  { value: 'frit', label: 'Frit' },
  { value: 'roti', label: 'Rôti' },
  { value: 'micro-ondes', label: 'Micro-ondes' }
];

export const DIAGNOSES: { value: Diagnosis; label: string }[] = [
  { value: 'crohn', label: 'Maladie de Crohn' },
  { value: 'colite-ulcereuse', label: 'Rectocolite hémorragique (RCH)' },
  { value: 'colite-indeterminee', label: 'Colite indéterminée' },
  { value: 'autre', label: 'Autre' }
];

export const RECTOCOLITE_SIGNATURES = [
  { value: 'pancolite', label: 'Pancolite (atteinte de tout le côlon)' },
  { value: 'colite-gauche', label: 'Colite gauche (côlon descendant et sigmoïde)' },
  { value: 'rectite', label: 'Rectite (rectum uniquement)' },
  { value: 'proctosigmoidite', label: 'Proctosigmoïdite (rectum et sigmoïde)' },
  { value: 'colite-extensive', label: 'Colite extensive (au-delà de l\'angle splénique)' },
  { value: 'colite-distale', label: 'Colite distale (rectum et côlon sigmoïde)' },
  { value: 'autre', label: 'Autre localisation' }
];

export const STOOL_CONSISTENCIES = [
  { 
    value: 0, 
    label: 'Aucune selle', 
    description: 'Pas de selles produites', 
    icon: 'type0',
    medicalNote: 'Aucune',
    backgroundColor: 'bg-gray-50',
    selectedColor: 'bg-gray-200 text-gray-900'
  },
  { 
    value: 1, 
    label: 'Constipation sévère', 
    description: 'Morceaux durs séparés, comme des noix (difficiles à évacuer)', 
    icon: 'type1',
    medicalNote: 'Type 1',
    backgroundColor: 'bg-red-50',
    selectedColor: 'bg-red-200 text-red-900'
  },
  { 
    value: 2, 
    label: 'Constipation légère', 
    description: 'En forme de saucisse mais grumeleuse', 
    icon: 'type2',
    medicalNote: 'Type 2',
    backgroundColor: 'bg-orange-50',
    selectedColor: 'bg-orange-200 text-orange-900'
  },
  { 
    value: 3, 
    label: 'Normal', 
    description: 'Comme une saucisse mais avec des craquelures à la surface', 
    icon: 'type3',
    medicalNote: 'Type 3',
    backgroundColor: 'bg-green-50',
    selectedColor: 'bg-green-200 text-green-900'
  },
  { 
    value: 4, 
    label: 'Normal (optimal)', 
    description: 'Comme une saucisse ou un serpent, lisse et molle', 
    icon: 'type4',
    medicalNote: 'Type 4',
    backgroundColor: 'bg-green-50',
    selectedColor: 'bg-green-200 text-green-900'
  },
  { 
    value: 5, 
    label: 'Manque de fibres', 
    description: 'Morceaux mous aux bords nets (faciles à évacuer)', 
    icon: 'type5',
    medicalNote: 'Type 5',
    backgroundColor: 'bg-yellow-50',
    selectedColor: 'bg-yellow-200 text-yellow-900'
  },
  { 
    value: 6, 
    label: 'Diarrhée légère', 
    description: 'Morceaux duveteux aux bords déchiquetés, selles pâteuses', 
    icon: 'type6',
    medicalNote: 'Type 6',
    backgroundColor: 'bg-orange-50',
    selectedColor: 'bg-orange-200 text-orange-900'
  },
  { 
    value: 7, 
    label: 'Diarrhée', 
    description: 'Entièrement liquide', 
    icon: 'type7',
    medicalNote: 'Type 7',
    backgroundColor: 'bg-red-50',
    selectedColor: 'bg-red-200 text-red-900'
  },
  { 
    value: 8, 
    label: 'Envie fécale', 
    description: 'Besoin d\'aller aux toilettes sans produire de selles', 
    icon: 'type8',
    medicalNote: 'Type 8',
    backgroundColor: 'bg-purple-50',
    selectedColor: 'bg-purple-200 text-purple-900'
  }
];

export const INTENSITY_LEVELS = [
  { value: 0, label: 'Aucun', color: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-200' },
  { value: 1, label: 'Léger', color: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
  { value: 2, label: 'Modéré', color: 'bg-orange-100', textColor: 'text-orange-800', borderColor: 'border-orange-200' },
  { value: 3, label: 'Fort', color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-200' },
  { value: 4, label: 'Sévère', color: 'bg-red-200', textColor: 'text-red-900', borderColor: 'border-red-300' }
];

export const URGENCY_LEVELS = [
  { value: 'none', label: 'Aucune', color: 'bg-gray-200' },
  { value: 'moderate', label: 'Modérée', color: 'bg-yellow-200' },
  { value: 'severe', label: 'Sévère', color: 'bg-red-200' }
];

export const BLOOD_LEVELS = [
  { value: 'none', label: 'Aucune', color: 'bg-gray-100', textColor: 'text-gray-800', medicalNote: 'Normal' },
  { value: 'trace', label: 'Trace', color: 'bg-yellow-100', textColor: 'text-yellow-800', medicalNote: 'Surveillance' },
  { value: 'moderate', label: 'Modérée', color: 'bg-orange-100', textColor: 'text-orange-800', medicalNote: 'Attention' },
  { value: 'severe', label: 'Sévère', color: 'bg-red-100', textColor: 'text-red-800', medicalNote: 'Urgent' }
];

export const MUCUS_LEVELS = [
  { value: 'none', label: 'Aucune', color: 'bg-gray-100', textColor: 'text-gray-800', medicalNote: 'Normal' },
  { value: 'trace', label: 'Trace', color: 'bg-yellow-100', textColor: 'text-yellow-800', medicalNote: 'Surveillance' },
  { value: 'moderate', label: 'Modérée', color: 'bg-orange-100', textColor: 'text-orange-800', medicalNote: 'Inflammation possible' },
  { value: 'severe', label: 'Sévère', color: 'bg-red-100', textColor: 'text-red-800', medicalNote: 'Inflammation active' }
];

// Nouvelles constantes pour les champs enrichis
export const STOOL_COLORS = [
  { value: 'brown', label: 'Marron', color: 'bg-amber-100', bgColor: 'bg-amber-700', textColor: 'text-amber-800', medicalNote: 'Normal' },
  { value: 'dark_brown', label: 'Marron foncé', color: 'bg-amber-200', bgColor: 'bg-amber-900', textColor: 'text-amber-900', medicalNote: 'Normal' },
  { value: 'light_brown', label: 'Marron clair', color: 'bg-yellow-100', bgColor: 'bg-amber-400', textColor: 'text-yellow-800', medicalNote: 'Normal' },
  { value: 'yellow', label: 'Jaune', color: 'bg-yellow-200', bgColor: 'bg-yellow-400', textColor: 'text-yellow-900', medicalNote: 'Attention - Malabsorption possible' },
  { value: 'green', label: 'Vert', color: 'bg-green-200', bgColor: 'bg-green-600', textColor: 'text-green-900', medicalNote: 'Attention - Transit rapide' },
  { value: 'black', label: 'Noir', color: 'bg-gray-800', bgColor: 'bg-gray-900', textColor: 'text-white', medicalNote: 'Urgent - Saignement digestif haut possible' },
  { value: 'red', label: 'Rouge', color: 'bg-red-200', bgColor: 'bg-red-600', textColor: 'text-red-900', medicalNote: 'Urgent - Saignement digestif bas' },
  { value: 'pale', label: 'Pâle/Blanc', color: 'bg-gray-100', bgColor: 'bg-gray-200', textColor: 'text-gray-800', medicalNote: 'Attention - Problème biliaire possible' },
  { value: 'other', label: 'Autre', color: 'bg-purple-100', bgColor: 'bg-purple-400', textColor: 'text-purple-800', medicalNote: 'À préciser' }
];

export const EVACUATION_EFFORTS = [
  { value: 'easy', label: 'Facile', color: 'bg-green-100', textColor: 'text-green-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { value: 'difficult', label: 'Difficile', color: 'bg-orange-100', textColor: 'text-orange-800' },
  { value: 'very_difficult', label: 'Pénible', color: 'bg-red-100', textColor: 'text-red-800' }
];

export const DURATION_PRESETS = [
  { value: 2, label: '2 min', color: 'bg-green-100' },
  { value: 5, label: '5 min', color: 'bg-green-100' },
  { value: 10, label: '10 min', color: 'bg-blue-100' },
  { value: 15, label: '15 min', color: 'bg-yellow-100' },
  { value: 20, label: '20 min', color: 'bg-orange-100' },
  { value: 30, label: '30 min+', color: 'bg-red-100' }
];

export const PAIN_LEVELS = [
  { value: 0, label: 'Aucune', color: 'bg-green-100', textColor: 'text-green-800' },
  { value: 1, label: 'Très légère', color: 'bg-green-200', textColor: 'text-green-800' },
  { value: 2, label: 'Légère', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { value: 3, label: 'Modérée', color: 'bg-yellow-200', textColor: 'text-yellow-800' },
  { value: 4, label: 'Gênante', color: 'bg-orange-100', textColor: 'text-orange-800' },
  { value: 5, label: 'Forte', color: 'bg-orange-200', textColor: 'text-orange-800' },
  { value: 6, label: 'Très forte', color: 'bg-red-100', textColor: 'text-red-800' },
  { value: 7, label: 'Sévère', color: 'bg-red-200', textColor: 'text-red-800' },
  { value: 8, label: 'Très sévère', color: 'bg-red-300', textColor: 'text-red-900' },
  { value: 9, label: 'Insupportable', color: 'bg-red-400', textColor: 'text-red-900' },
  { value: 10, label: 'Maximale', color: 'bg-red-500', textColor: 'text-white' }
];

export const BRISTOL_TYPES = [
  { value: 1, label: 'Type 1', url: '/assets/bristol/placeholder.png' },
  { value: 2, label: 'Type 2', url: '/assets/bristol/placeholder.png' },
  { value: 3, label: 'Type 3', url: '/assets/bristol/placeholder.png' },
  { value: 4, label: 'Type 4', url: '/assets/bristol/placeholder.png' },
  { value: 5, label: 'Type 5', url: '/assets/bristol/placeholder.png' },
  { value: 6, label: 'Type 6', url: '/assets/bristol/placeholder.png' },
  { value: 7, label: 'Type 7', url: '/assets/bristol/placeholder.png' },
  { value: 8, label: 'Type 8', url: '/assets/bristol/placeholder.png' }
];

export const BRISTOL_INFO = [
  { 
    type: 1, 
    title: 'Type 1',
    description: 'Petites crottes dures et détachées, ressemblant à des noisettes (scybales). Difficiles à évacuer.',
    url: '/assets/bristol/placeholder.png'
  },
  { 
    type: 2, 
    title: 'Type 2',
    description: 'En forme de saucisse, mais dures et grumeleuses.',
    url: '/assets/bristol/placeholder.png'
  },
  { 
    type: 3, 
    title: 'Type 3',
    description: 'Comme une saucisse, mais avec des craquelures sur la surface.',
    url: '/assets/bristol/placeholder.png'
  },
  { 
    type: 4, 
    title: 'Type 4',
    description: 'Ressemble à une saucisse ou un serpent, lisse et douce.',
    url: '/assets/bristol/placeholder.png'
  },
  { 
    type: 5, 
    title: 'Type 5',
    description: 'Morceaux mous, avec des bords nets. Néanmoins aisés à évacuer.',
    url: '/assets/bristol/placeholder.png'
  },
  { 
    type: 6, 
    title: 'Type 6',
    description: 'Morceaux duveteux, en lambeaux, selles détrempées.',
    url: '/assets/bristol/placeholder.png'
  },
  { 
    type: 7, 
    title: 'Type 7',
    description: 'Pas de morceau solide, entièrement liquide.',
    url: '/assets/bristol/placeholder.png'
  },
  { 
    type: 8, 
    title: 'Type 8 (Envie fécale)',
    description: 'Besoin d\'aller à la selle sans résultat.',
    url: '/assets/bristol/placeholder.png'
  }
];