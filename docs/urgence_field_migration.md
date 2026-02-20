# Migration du champ "Urgence" - Documentation

## 📋 Résumé

Le champ **urgence** a été ajouté à la table `stools` dans Supabase avec une approche multilingue utilisant des valeurs numériques en base de données.

## 🗄️ Structure en base de données

### Champ ajouté
- **Nom** : `urgence`
- **Type** : `INTEGER`
- **Valeurs** : `0`, `1`, `2`
- **Défaut** : `0`
- **Contrainte** : `CHECK (urgence >= 0 AND urgence <= 2)`
- **Index** : `idx_stools_urgence`

### Mapping des valeurs

| Valeur DB | Valeur Interface | Label FR | Label EN |
|-----------|------------------|----------|----------|
| `0` | `'none'` | Aucune | None |
| `1` | `'moderate'` | Modérée | Moderate |
| `2` | `'severe'` | Sévère | Severe |

## 📁 Fichiers modifiés

### 1. Migration SQL
**Fichier** : `supabase/migrations/20251017000000_add_urgence_field_to_stools.sql`

```sql
-- Ajoute le champ urgence avec contraintes et index
ALTER TABLE stools ADD COLUMN urgence INTEGER DEFAULT 0;
COMMENT ON COLUMN stools.urgence IS 'Niveau d''urgence: 0=Aucune, 1=Modérée, 2=Sévère';
ALTER TABLE stools ADD CONSTRAINT check_urgence_values CHECK (urgence >= 0 AND urgence <= 2);
CREATE INDEX idx_stools_urgence ON stools(urgence);
UPDATE stools SET urgence = 0 WHERE urgence IS NULL;
```

### 2. Service (src/features/stool/services/stoolService.ts)

**Fonctions de conversion ajoutées** :
```typescript
urgenceToNumber(urgence: 'none' | 'moderate' | 'severe'): number
urgenceFromNumber(urgence: number | null | undefined): 'none' | 'moderate' | 'severe'
```

**Modifications** :
- `createStool()` : Convertit `urgency` string → `urgence` number avant insertion
- `createStoolAlternative()` : Même conversion
- `getStools()` : Sélectionne le champ `urgence` de la DB
- `updateStool()` : Convertit `urgency` → `urgence` lors des mises à jour

### 3. Hook Dashboard (src/features/dashboard/hooks/useDashboardData.ts)

**Type `addStool` mis à jour** :
```typescript
urgency?: 'none' | 'moderate' | 'severe'  // Ajouté
```

### 4. Page Historique (src/features/history/pages/HistoryPage.tsx)

**Restauration après suppression** :
- Inclut maintenant le champ `urgency` lors de la restauration d'une selle supprimée

## 🔄 Flux de données

### Enregistrement d'une selle

```
Interface (urgency: 'moderate')
    ↓
stoolService.createStool()
    ↓
Conversion: 'moderate' → 1
    ↓
Supabase INSERT (urgence: 1)
```

### Récupération d'une selle

```
Supabase SELECT (urgence: 1)
    ↓
stoolService.getStools()
    ↓
Pas de conversion automatique
    ↓
Interface reçoit: urgence: 1
    ↓
Interface utilise: urgency: 'moderate' (conversion locale si nécessaire)
```

### Mise à jour d'une selle

```
Interface (urgency: 'severe')
    ↓
stoolService.updateStool()
    ↓
Conversion: 'severe' → 2
    ↓
Supabase UPDATE (urgence: 2)
```

## ✅ Compatibilité

### Données existantes
- ✅ Toutes les selles existantes ont `urgence = 0` (Aucune)
- ✅ Rétrocompatible : les anciennes selles sans urgence fonctionnent normalement

### Interface
- ✅ Les formulaires utilisent les valeurs string ('none', 'moderate', 'severe')
- ✅ La conversion est transparente pour l'utilisateur
- ✅ Les dropdowns sont uniformisés entre enregistrement et édition

## 🚀 Instructions de déploiement

### 1. Exécuter la migration

```bash
# Dans Supabase Dashboard > SQL Editor
# Copier-coller le contenu de:
supabase/migrations/20251017000000_add_urgence_field_to_stools.sql
```

Ou via CLI :
```bash
supabase db push
```

### 2. Vérifier la migration

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'stools' AND column_name = 'urgence';

-- Vérifier les contraintes
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_urgence_values';

-- Vérifier l'index
SELECT indexname FROM pg_indexes WHERE tablename = 'stools' AND indexname = 'idx_stools_urgence';

-- Vérifier les données existantes
SELECT urgence, COUNT(*) FROM stools GROUP BY urgence;
```

### 3. Tester l'application

1. **Enregistrement** : Créer une nouvelle selle avec différents niveaux d'urgence
2. **Affichage** : Vérifier que l'historique affiche correctement
3. **Édition** : Modifier l'urgence d'une selle existante
4. **Suppression/Restauration** : Supprimer puis restaurer une selle

## 🔍 Requêtes SQL utiles

### Statistiques par urgence
```sql
SELECT 
  urgence,
  CASE 
    WHEN urgence = 0 THEN 'Aucune'
    WHEN urgence = 1 THEN 'Modérée'
    WHEN urgence = 2 THEN 'Sévère'
  END as label,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM stools
GROUP BY urgence
ORDER BY urgence;
```

### Selles avec urgence par date
```sql
SELECT 
  stool_date,
  urgence,
  consistency,
  blood_level,
  mucus_level
FROM stools
WHERE urgence > 0
ORDER BY stool_date DESC, stool_time DESC;
```

## 📝 Notes importantes

1. **Valeurs numériques** : L'utilisation de valeurs numériques facilite :
   - Les requêtes SQL (ORDER BY, comparaisons)
   - L'internationalisation future
   - Les statistiques et analyses

2. **Conversion transparente** : L'interface continue d'utiliser des strings pour la clarté du code

3. **Extensibilité** : Facile d'ajouter de nouveaux niveaux si nécessaire :
   ```sql
   -- Modifier la contrainte
   ALTER TABLE stools DROP CONSTRAINT check_urgence_values;
   ALTER TABLE stools ADD CONSTRAINT check_urgence_values CHECK (urgence >= 0 AND urgence <= 3);
   ```

4. **Performance** : L'index `idx_stools_urgence` optimise les requêtes filtrant par urgence

## 🐛 Résolution de problèmes

### Erreur : "column urgence does not exist"
```bash
# Solution : Exécuter la migration
supabase db push
```

### Valeurs incorrectes en base
```sql
-- Vérifier les valeurs
SELECT DISTINCT urgence FROM stools;

-- Corriger si nécessaire
UPDATE stools SET urgence = 0 WHERE urgence IS NULL OR urgence < 0 OR urgence > 2;
```

### Conversion échoue dans l'interface
```typescript
// Vérifier que les fonctions de conversion sont utilisées
stoolService.urgenceToNumber('moderate')  // Devrait retourner 1
stoolService.urgenceFromNumber(1)         // Devrait retourner 'moderate'
```


