# 🔧 SCRIPT DE MIGRATION - CONSTANTES SELLES

## 📊 ANALYSE DE L'EXISTANT

### ✅ **Constantes déjà présentes et bien structurées :**
- `STOOL_CONSISTENCIES` - Échelle de Bristol (0-7) ✅
- `URGENCY_LEVELS` - Niveaux d'urgence ✅  
- `BLOOD_LEVELS` - Niveaux de sang ✅
- `MUCUS_LEVELS` - Niveaux de mucosité ✅
- `INTENSITY_LEVELS` - Niveaux d'intensité génériques ✅

## 🎯 **CONSTANTES À AJOUTER**

### 1. **COULEURS DES SELLES** (nouveau)
```typescript
export const STOOL_COLORS = [
  { value: 'brown', label: 'Marron', color: 'bg-amber-100', textColor: 'text-amber-800', medicalNote: 'Normal' },
  { value: 'dark_brown', label: 'Marron foncé', color: 'bg-amber-200', textColor: 'text-amber-900', medicalNote: 'Normal' },
  { value: 'light_brown', label: 'Marron clair', color: 'bg-yellow-100', textColor: 'text-yellow-800', medicalNote: 'Normal' },
  { value: 'yellow', label: 'Jaune', color: 'bg-yellow-200', textColor: 'text-yellow-900', medicalNote: 'Attention - Malabsorption possible' },
  { value: 'green', label: 'Vert', color: 'bg-green-200', textColor: 'text-green-900', medicalNote: 'Attention - Transit rapide' },
  { value: 'black', label: 'Noir', color: 'bg-gray-800', textColor: 'text-white', medicalNote: 'Urgent - Saignement digestif haut possible' },
  { value: 'red', label: 'Rouge', color: 'bg-red-200', textColor: 'text-red-900', medicalNote: 'Urgent - Saignement digestif bas' },
  { value: 'pale', label: 'Pâle/Blanc', color: 'bg-gray-100', textColor: 'text-gray-800', medicalNote: 'Attention - Problème biliaire possible' },
  { value: 'other', label: 'Autre', color: 'bg-purple-100', textColor: 'text-purple-800', medicalNote: 'À préciser' }
];
```

### 2. **EFFORT D'ÉVACUATION** (nouveau)
```typescript
export const EVACUATION_EFFORTS = [
  { value: 'easy', label: 'Facile', color: 'bg-green-100', textColor: 'text-green-800', icon: '😌' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100', textColor: 'text-blue-800', icon: '😐' },
  { value: 'difficult', label: 'Difficile', color: 'bg-orange-100', textColor: 'text-orange-800', icon: '😰' },
  { value: 'very_difficult', label: 'Très difficile', color: 'bg-red-100', textColor: 'text-red-800', icon: '😣' }
];
```

### 3. **DURÉES PRÉDÉFINIES** (nouveau)
```typescript
export const DURATION_PRESETS = [
  { value: 2, label: '2 min', color: 'bg-green-100' },
  { value: 5, label: '5 min', color: 'bg-green-100' },
  { value: 10, label: '10 min', color: 'bg-blue-100' },
  { value: 15, label: '15 min', color: 'bg-yellow-100' },
  { value: 20, label: '20 min', color: 'bg-orange-100' },
  { value: 30, label: '30 min+', color: 'bg-red-100' }
];
```

### 4. **NIVEAUX DE DOULEUR** (nouveau)
```typescript
export const PAIN_LEVELS = [
  { value: 0, label: 'Aucune', color: 'bg-green-100', textColor: 'text-green-800', emoji: '😊' },
  { value: 1, label: 'Très légère', color: 'bg-green-200', textColor: 'text-green-800', emoji: '🙂' },
  { value: 2, label: 'Légère', color: 'bg-yellow-100', textColor: 'text-yellow-800', emoji: '😐' },
  { value: 3, label: 'Modérée', color: 'bg-yellow-200', textColor: 'text-yellow-800', emoji: '😕' },
  { value: 4, label: 'Gênante', color: 'bg-orange-100', textColor: 'text-orange-800', emoji: '😰' },
  { value: 5, label: 'Forte', color: 'bg-orange-200', textColor: 'text-orange-800', emoji: '😣' },
  { value: 6, label: 'Très forte', color: 'bg-red-100', textColor: 'text-red-800', emoji: '😖' },
  { value: 7, label: 'Sévère', color: 'bg-red-200', textColor: 'text-red-800', emoji: '😫' },
  { value: 8, label: 'Très sévère', color: 'bg-red-300', textColor: 'text-red-900', emoji: '😵' },
  { value: 9, label: 'Insupportable', color: 'bg-red-400', textColor: 'text-red-900', emoji: '😱' },
  { value: 10, label: 'Maximale', color: 'bg-red-500', textColor: 'text-white', emoji: '🆘' }
];
```

## 🔄 **CONSTANTES À MODIFIER**

### 1. **STOOL_CONSISTENCIES** - Ajouter Type 8
```typescript
// AJOUTER à la fin du tableau existant :
{
  value: 8,
  label: 'Envie afécale',
  description: 'Envie d\'aller aux toilettes sans production de selles',
  icon: 'type8',
  medicalNote: 'Type 8 - Envie sans selles',
  backgroundColor: 'bg-purple-50',
  selectedColor: 'bg-purple-200 text-purple-900'
}
```

### 2. **URGENCY_LEVELS** - Enrichir avec icônes
```typescript
// MODIFIER le tableau existant :
export const URGENCY_LEVELS = [
  { value: 'none', label: 'Aucune', color: 'bg-gray-100', textColor: 'text-gray-800', icon: '😌' },
  { value: 'moderate', label: 'Modérée', color: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '😐' },
  { value: 'severe', label: 'Sévère', color: 'bg-red-100', textColor: 'text-red-800', icon: '🏃‍♂️' }
];
```

### 3. **BLOOD_LEVELS** - Enrichir avec descriptions médicales
```typescript
// MODIFIER le tableau existant :
export const BLOOD_LEVELS = [
  { value: 'none', label: 'Aucune', color: 'bg-gray-100', textColor: 'text-gray-800', medicalNote: 'Normal' },
  { value: 'trace', label: 'Trace', color: 'bg-yellow-100', textColor: 'text-yellow-800', medicalNote: 'Surveillance' },
  { value: 'moderate', label: 'Modérée', color: 'bg-orange-100', textColor: 'text-orange-800', medicalNote: 'Attention' },
  { value: 'severe', label: 'Sévère', color: 'bg-red-100', textColor: 'text-red-800', medicalNote: 'Urgent' }
];
```

### 4. **MUCUS_LEVELS** - Enrichir avec descriptions médicales
```typescript
// MODIFIER le tableau existant :
export const MUCUS_LEVELS = [
  { value: 'none', label: 'Aucune', color: 'bg-gray-100', textColor: 'text-gray-800', medicalNote: 'Normal' },
  { value: 'trace', label: 'Trace', color: 'bg-yellow-100', textColor: 'text-yellow-800', medicalNote: 'Surveillance' },
  { value: 'moderate', label: 'Modérée', color: 'bg-orange-100', textColor: 'text-orange-800', medicalNote: 'Inflammation possible' },
  { value: 'severe', label: 'Sévère', color: 'bg-red-100', textColor: 'text-red-800', medicalNote: 'Inflammation active' }
];
```

## 🎯 **NOUVELLES FONCTIONS UTILITAIRES À AJOUTER**

### 1. **Validation des combinaisons**
```typescript
export const validateStoolEntry = (data: StoolFormData) => {
  const errors: string[] = [];
  
  // Type 0 ne peut pas avoir de sang/mucus
  if (data.consistency === 0 && (data.blood_level !== 'none' || data.mucus_level !== 'none')) {
    errors.push('Une absence de selles ne peut pas contenir de sang ou de mucosité');
  }
  
  // Couleur noire avec sang = alerte
  if (data.stool_color === 'black' && data.blood_level !== 'none') {
    errors.push('Selles noires avec sang : consultez immédiatement un médecin');
  }
  
  return errors;
};
```

### 2. **Alertes médicales**
```typescript
export const getMedicalAlerts = (data: StoolFormData): string[] => {
  const alerts: string[] = [];
  
  if (data.stool_color === 'black') alerts.push('Selles noires - Possible saignement digestif haut');
  if (data.stool_color === 'red') alerts.push('Selles rouges - Possible saignement digestif bas');
  if (data.blood_level === 'severe') alerts.push('Sang important - Consultation médicale recommandée');
  if (data.pain_level >= 7) alerts.push('Douleur sévère - Consultation médicale recommandée');
  
  return alerts;
};
```

## 📋 **RÉSUMÉ DES ACTIONS**

### ✅ **À conserver (déjà bien fait)**
- Structure existante des constantes
- Nommage cohérent
- Couleurs Tailwind harmonisées

### ➕ **À ajouter (4 nouvelles constantes)**
- `STOOL_COLORS` - 9 couleurs avec notes médicales
- `EVACUATION_EFFORTS` - 4 niveaux d'effort
- `DURATION_PRESETS` - 6 durées prédéfinies
- `PAIN_LEVELS` - 11 niveaux de douleur (0-10)

### 🔄 **À enrichir (4 constantes existantes)**
- `STOOL_CONSISTENCIES` - Ajouter Type 8
- `URGENCY_LEVELS` - Ajouter icônes et textColor
- `BLOOD_LEVELS` - Ajouter notes médicales et textColor
- `MUCUS_LEVELS` - Ajouter notes médicales et textColor

### 🛠️ **À créer (2 fonctions utilitaires)**
- `validateStoolEntry()` - Validation des combinaisons
- `getMedicalAlerts()` - Alertes médicales automatiques

**Total estimé :** ~150 lignes de constantes + 50 lignes de fonctions = **200 lignes de code**
