# Corrections - Urgence et Persistance des éditions

## 🐛 Problèmes corrigés

### 1. ❌ L'urgence ne s'enregistre pas en DB
**Cause** : Le champ `urgence` manquait dans les types TypeScript générés  
**Solution** : Ajout du champ dans `src/lib/database.ts`

### 2. ❌ L'édition des selles ne persiste pas (disparaît au refresh)
**Cause** : `updateStool()` faisait seulement une mise à jour locale sans appeler le service  
**Solution** : Correction pour appeler `stoolService.updateStool()` et persister en DB

### 3. ❌ Erreurs TypeScript dans stoolService.ts
**Cause** : Types Supabase incomplets  
**Solution** : Mise à jour des types + correction de la signature de `updateStool`

## 📝 Fichiers modifiés

### 1. `src/lib/database.ts`
**Ajout du champ `urgence: number` dans les types de la table `stools`**

```typescript
stools: {
  Row: {
    // ... autres champs
    urgence: number  // ← AJOUTÉ
    blood_level: string | null
    // ...
  }
  Insert: {
    // ... autres champs
    urgence?: number  // ← AJOUTÉ (optionnel car valeur par défaut)
    blood_level?: string | null
    // ...
  }
  Update: {
    // ... autres champs
    urgence?: number  // ← AJOUTÉ
    blood_level?: string | null
    // ...
  }
}
```

### 2. `src/features/dashboard/hooks/useDashboardData.ts`
**Correction de `updateStool` pour persister en DB**

```typescript
// AVANT (❌ ne persistait pas)
const updateStool = (updatedStool: Stool) => {
  setStools(prev => prev.map(stool => 
    stool.id === updatedStool.id ? updatedStool : stool
  ));
};

// APRÈS (✅ persiste en DB)
const updateStool = async (updatedStool: Stool) => {
  try {
    // Persister en DB via le service
    const savedStool = await stoolService.updateStool(updatedStool.id, updatedStool);
    
    // Mettre à jour l'état local avec les données sauvegardées
    setStools(prev => prev.map(stool => 
      stool.id === savedStool.id ? savedStool : stool
    ));
    
    return savedStool;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la selle:', error);
    throw error;
  }
};
```

### 3. `src/features/history/hooks/useStoolEditor.ts`
**Corrections pour gérer la promesse asynchrone**

```typescript
// Signature mise à jour
export function useStoolEditor(
  addStool: (data: any) => Promise<any>,
  updateStool: (stool: any) => Promise<any>  // ← CHANGÉ de void à Promise<any>
)

// Dans handleSaveStool
await updateStool(updatedStool);  // ← AJOUT de await
```

## 🔄 Flux de données complet

### Enregistrement d'une nouvelle selle

```
Interface (urgency: 'moderate')
    ↓
addStool() dans useDashboardData
    ↓
stoolService.createStool()
    ↓
Conversion: 'moderate' → 1 (urgenceToNumber)
    ↓
Supabase INSERT (urgence: 1)
    ↓
Retour: Stool avec urgence: 1
    ↓
État local mis à jour
```

### Édition d'une selle existante

```
Interface (urgency: 'severe')
    ↓
handleSaveStool() dans useStoolEditor
    ↓
await updateStool() dans useDashboardData  ← CORRECTION
    ↓
stoolService.updateStool()
    ↓
Conversion: 'severe' → 2 (urgenceToNumber)
    ↓
Supabase UPDATE (urgence: 2)  ← PERSISTÉ EN DB
    ↓
Retour: Stool sauvegardée avec urgence: 2
    ↓
État local mis à jour avec données DB
```

### Récupération des selles

```
Supabase SELECT * (urgence: 1)
    ↓
stoolService.getStools()
    ↓
Retour: Stool[] avec urgence: 1 (valeur numérique)
    ↓
Interface utilise: urgency: 'moderate' (conversion dans hook)
```

## ✅ Vérifications post-déploiement

### 1. Vérifier que le champ existe en DB
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'stools' AND column_name = 'urgence';
```

**Résultat attendu** :
```
urgence | integer | 0
```

### 2. Tester l'enregistrement
1. Créer une nouvelle selle avec urgence "Sévère"
2. Vérifier en DB :
```sql
SELECT id, consistency, urgence, stool_date, stool_time 
FROM stools 
ORDER BY created_at DESC 
LIMIT 1;
```
**Résultat attendu** : `urgence = 2`

### 3. Tester l'édition
1. Éditer une selle et changer l'urgence de "Aucune" → "Modérée"
2. Sauvegarder
3. Rafraîchir la page (F5)
4. **Vérifier** : L'urgence doit rester "Modérée" (persistée en DB)
5. Vérifier en DB :
```sql
SELECT urgence FROM stools WHERE id = 'ID_DE_LA_SELLE';
```
**Résultat attendu** : `urgence = 1`

### 4. Vérifier les données existantes
```sql
-- Toutes les anciennes selles doivent avoir urgence = 0
SELECT urgence, COUNT(*) 
FROM stools 
GROUP BY urgence;
```

## 🔧 Actions à effectuer

### ⚠️ IMPORTANT : Redémarrer le serveur de développement

L'erreur TypeScript que vous voyez dans l'IDE devrait disparaître après un redémarrage :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

**Raison** : TypeScript met en cache les types. Le redémarrage force le rechargement des types mis à jour depuis `database.ts`.

### Tests recommandés

1. ✅ **Créer une selle** avec chaque niveau d'urgence
2. ✅ **Éditer une selle** et changer son urgence
3. ✅ **Rafraîchir la page** (F5) et vérifier que les modifications persistent
4. ✅ **Supprimer puis restaurer** une selle avec urgence
5. ✅ **Vérifier l'historique** affiche bien l'urgence

## 📊 Statistiques utiles

### Selles par niveau d'urgence
```sql
SELECT 
  urgence,
  CASE 
    WHEN urgence = 0 THEN 'Aucune'
    WHEN urgence = 1 THEN 'Modérée'
    WHEN urgence = 2 THEN 'Sévère'
  END as label_fr,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM stools
GROUP BY urgence
ORDER BY urgence;
```

### Évolution de l'urgence dans le temps
```sql
SELECT 
  DATE(stool_date) as date,
  AVG(urgence) as urgence_moyenne,
  MAX(urgence) as urgence_max,
  COUNT(*) as nb_selles
FROM stools
WHERE stool_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(stool_date)
ORDER BY date DESC;
```

## 🐛 Résolution de problèmes

### L'urgence ne s'affiche toujours pas
```typescript
// Dans useStoolEditor, vérifier que urgency est bien chargée
const handleEditStool = (stool: Stool) => {
  console.log('Urgence en DB:', (stool as any).urgence);  // Devrait être 0, 1 ou 2
  console.log('Urgence convertie:', stoolService.urgenceFromNumber((stool as any).urgence));
  // Devrait être 'none', 'moderate' ou 'severe'
};
```

### L'édition ne persiste toujours pas
```typescript
// Vérifier que updateStool est bien async dans useDashboardData
console.log('Avant update DB');
const savedStool = await stoolService.updateStool(updatedStool.id, updatedStool);
console.log('Après update DB:', savedStool);
```

### Erreur "column urgence does not exist"
```sql
-- Vérifier que la migration a bien été exécutée
SELECT * FROM information_schema.columns 
WHERE table_name = 'stools' AND column_name = 'urgence';

-- Si vide, réexécuter la migration
ALTER TABLE stools ADD COLUMN urgence INTEGER DEFAULT 0;
```

## 📚 Références

- Migration SQL : `supabase/migrations/20251017000000_add_urgence_field_to_stools.sql`
- Documentation complète : `docs/urgence_field_migration.md`
- Types DB : `src/lib/database.ts`
- Service : `src/features/stool/services/stoolService.ts`

## ✨ Améliorations apportées

1. ✅ **Persistance garantie** : Les éditions sont maintenant sauvegardées en DB
2. ✅ **Types à jour** : TypeScript connaît le champ `urgence`
3. ✅ **Conversion automatique** : String ↔ Number transparent pour l'utilisateur
4. ✅ **Rétrocompatibilité** : Les anciennes selles ont urgence = 0 (Aucune)
5. ✅ **Gestion d'erreurs** : Try/catch avec logs pour déboguer


