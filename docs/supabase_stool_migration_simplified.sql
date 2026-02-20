-- =====================================================
-- MIGRATION SUPABASE - MODÈLE SELLES SIMPLIFIÉ
-- =====================================================
-- Version: 2.0 (Ultra-simplifié)
-- Date: 2025-08-03
-- Description: Ajout des nouvelles colonnes sans contraintes
-- PHILOSOPHIE: Validation 100% côté TypeScript via constantes

-- =====================================================
-- ÉTAPE 1: AJOUT DES NOUVELLES COLONNES
-- =====================================================

ALTER TABLE stools 
ADD COLUMN IF NOT EXISTS blood_level TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS mucus_level TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS stool_color TEXT,
ADD COLUMN IF NOT EXISTS evacuation_effort TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS pain_level INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- ÉTAPE 2: MIGRATION DES DONNÉES EXISTANTES
-- =====================================================

-- Migrer has_blood vers blood_level
UPDATE stools 
SET blood_level = CASE 
  WHEN has_blood = true THEN 'trace'
  WHEN has_blood = false THEN 'none'
  ELSE 'none'
END
WHERE blood_level = 'none' AND has_blood IS NOT NULL;

-- Migrer has_mucus vers mucus_level
UPDATE stools 
SET mucus_level = CASE 
  WHEN has_mucus = true THEN 'trace'
  WHEN has_mucus = false THEN 'none'
  ELSE 'none'
END
WHERE mucus_level = 'none' AND has_mucus IS NOT NULL;

-- Définir des valeurs par défaut pour les nouvelles colonnes
UPDATE stools 
SET 
  stool_color = 'brown',
  evacuation_effort = 'normal',
  duration_minutes = 5,
  pain_level = 0
WHERE stool_color IS NULL 
   OR evacuation_effort IS NULL 
   OR duration_minutes IS NULL 
   OR pain_level IS NULL;

-- =====================================================
-- ÉTAPE 3: SUPPRESSION DES CONTRAINTES EXISTANTES
-- =====================================================

-- Supprimer toutes les contraintes CHECK existantes
ALTER TABLE stools DROP CONSTRAINT IF EXISTS stools_consistency_check;
ALTER TABLE stools DROP CONSTRAINT IF EXISTS stools_coherence_check;

-- =====================================================
-- ÉTAPE 4: INDEX POUR PERFORMANCE (OPTIONNEL)
-- =====================================================

-- Index pour les requêtes par profil et date
CREATE INDEX IF NOT EXISTS idx_stools_profile_date 
ON stools(profile_id, stool_date DESC);

-- Index pour les recherches par consistance
CREATE INDEX IF NOT EXISTS idx_stools_consistency 
ON stools(consistency);

-- =====================================================
-- ÉTAPE 5: TRIGGER POUR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stools_updated_at ON stools;
CREATE TRIGGER update_stools_updated_at 
  BEFORE UPDATE ON stools
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 6: VALIDATION POST-MIGRATION
-- =====================================================

-- Vérifier que toutes les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stools' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Compter les enregistrements migrés
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN blood_level != 'none' THEN 1 END) as with_blood,
  COUNT(CASE WHEN mucus_level != 'none' THEN 1 END) as with_mucus,
  COUNT(CASE WHEN stool_color IS NOT NULL THEN 1 END) as with_color,
  COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as with_notes
FROM stools;

-- =====================================================
-- ÉTAPE 7: NETTOYAGE (APRÈS VALIDATION COMPLÈTE)
-- =====================================================

-- ATTENTION: N'exécuter qu'après validation complète du code TypeScript
-- Supprimer les anciennes colonnes boolean
-- ALTER TABLE stools DROP COLUMN IF EXISTS has_blood;
-- ALTER TABLE stools DROP COLUMN IF EXISTS has_mucus;

-- =====================================================
-- ROLLBACK COMPLET (EN CAS DE PROBLÈME)
-- =====================================================

/*
-- Script de rollback complet
ALTER TABLE stools 
DROP COLUMN IF EXISTS blood_level,
DROP COLUMN IF EXISTS mucus_level,
DROP COLUMN IF EXISTS stool_color,
DROP COLUMN IF EXISTS evacuation_effort,
DROP COLUMN IF EXISTS duration_minutes,
DROP COLUMN IF EXISTS pain_level,
DROP COLUMN IF EXISTS notes;

DROP TRIGGER IF EXISTS update_stools_updated_at ON stools;
*/
