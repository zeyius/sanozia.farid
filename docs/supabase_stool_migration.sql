-- =====================================================
-- MIGRATION SUPABASE - AMÉLIORATION MODÈLE SELLES
-- =====================================================
-- Version: 1.0 (Corrigée)
-- Date: 2025-08-03
-- Description: Ajout des nouvelles colonnes pour enrichir le suivi des selles
-- IMPORTANT: Les niveaux sont gérés via les constantes TypeScript, pas de contraintes CHECK hardcodées

-- =====================================================
-- ÉTAPE 1: AJOUT DES NOUVELLES COLONNES
-- =====================================================

-- Ajouter les nouvelles colonnes à la table stools existante
-- IMPORTANT: Pas de contraintes CHECK pour les niveaux (gérés par les constantes TS)
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
-- ÉTAPE 3: MISE À JOUR DES CONTRAINTES
-- =====================================================

-- Étendre la contrainte consistency pour inclure le type 8 (envie afécale)
-- IMPORTANT: Validation gérée côté TypeScript, pas de contraintes CHECK
ALTER TABLE stools 
DROP CONSTRAINT IF EXISTS stools_consistency_check;

-- Pas de nouvelles contraintes - validation 100% côté TypeScript

-- =====================================================
-- ÉTAPE 4: OPTIMISATION DES INDEX
-- =====================================================

-- Index pour les requêtes par profil et date (déjà existant normalement)
CREATE INDEX IF NOT EXISTS idx_stools_profile_date 
ON stools(profile_id, stool_date DESC);

-- Index pour les recherches par consistance
CREATE INDEX IF NOT EXISTS idx_stools_consistency 
ON stools(consistency);

-- Index pour les cas avec sang ou mucus (pour les alertes médicales)
CREATE INDEX IF NOT EXISTS idx_stools_blood_mucus 
ON stools(blood_level, mucus_level) 
WHERE blood_level != 'none' OR mucus_level != 'none';

-- Index pour les cas d'urgence médicale
CREATE INDEX IF NOT EXISTS idx_stools_medical_alerts 
ON stools(stool_color, pain_level) 
WHERE stool_color IN ('black', 'red') OR pain_level >= 7;

-- =====================================================
-- ÉTAPE 5: TRIGGER POUR UPDATED_AT
-- =====================================================

-- Créer ou remplacer la fonction de mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur la table stools (si pas déjà existant)
DROP TRIGGER IF EXISTS update_stools_updated_at ON stools;
CREATE TRIGGER update_stools_updated_at 
  BEFORE UPDATE ON stools
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 6: POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Vérifier que RLS est activé
ALTER TABLE stools ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres données
DROP POLICY IF EXISTS "Users can view own stools" ON stools;
CREATE POLICY "Users can view own stools" ON stools
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Politique pour que les utilisateurs ne puissent insérer que leurs propres données
DROP POLICY IF EXISTS "Users can insert own stools" ON stools;
CREATE POLICY "Users can insert own stools" ON stools
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Politique pour que les utilisateurs ne puissent modifier que leurs propres données
DROP POLICY IF EXISTS "Users can update own stools" ON stools;
CREATE POLICY "Users can update own stools" ON stools
  FOR UPDATE USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Politique pour que les utilisateurs ne puissent supprimer que leurs propres données
DROP POLICY IF EXISTS "Users can delete own stools" ON stools;
CREATE POLICY "Users can delete own stools" ON stools
  FOR DELETE USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- ÉTAPE 7: VUES UTILITAIRES (OPTIONNEL)
-- =====================================================

-- Vue pour les alertes médicales
CREATE OR REPLACE VIEW stool_medical_alerts AS
SELECT 
  s.*,
  p.name as patient_name,
  CASE 
    WHEN s.stool_color = 'black' THEN 'Selles noires - Possible saignement digestif haut'
    WHEN s.stool_color = 'red' THEN 'Selles rouges - Possible saignement digestif bas'
    WHEN s.blood_level = 'severe' THEN 'Sang important - Consultation recommandée'
    WHEN s.pain_level >= 7 THEN 'Douleur sévère - Consultation recommandée'
    ELSE NULL
  END as medical_alert
FROM stools s
JOIN profiles p ON s.profile_id = p.id
WHERE s.stool_color IN ('black', 'red') 
   OR s.blood_level = 'severe' 
   OR s.pain_level >= 7;

-- Vue pour les statistiques hebdomadaires
CREATE OR REPLACE VIEW stool_weekly_stats AS
SELECT 
  profile_id,
  DATE_TRUNC('week', stool_date) as week_start,
  COUNT(*) as total_entries,
  AVG(consistency) as avg_consistency,
  COUNT(CASE WHEN blood_level != 'none' THEN 1 END) as blood_episodes,
  COUNT(CASE WHEN mucus_level != 'none' THEN 1 END) as mucus_episodes,
  AVG(pain_level) as avg_pain,
  AVG(duration_minutes) as avg_duration
FROM stools
WHERE stool_date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY profile_id, DATE_TRUNC('week', stool_date)
ORDER BY profile_id, week_start DESC;

-- =====================================================
-- ÉTAPE 8: VALIDATION POST-MIGRATION
-- =====================================================

-- Vérifier que toutes les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stools' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'stools' 
  AND table_schema = 'public';

-- Compter les enregistrements migrés
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN blood_level != 'none' THEN 1 END) as with_blood,
  COUNT(CASE WHEN mucus_level != 'none' THEN 1 END) as with_mucus,
  COUNT(CASE WHEN stool_color IS NOT NULL THEN 1 END) as with_color,
  COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as with_notes
FROM stools;

-- =====================================================
-- ÉTAPE 9: NETTOYAGE (À EXÉCUTER APRÈS VALIDATION)
-- =====================================================

-- ATTENTION: N'exécuter ces commandes qu'après validation complète
-- de la migration et mise à jour du code TypeScript

-- Supprimer les anciennes colonnes boolean (après validation)
-- ALTER TABLE stools DROP COLUMN IF EXISTS has_blood;
-- ALTER TABLE stools DROP COLUMN IF EXISTS has_mucus;

-- =====================================================
-- ROLLBACK (EN CAS DE PROBLÈME)
-- =====================================================

-- En cas de problème, script de rollback:
/*
-- Supprimer les nouvelles colonnes
ALTER TABLE stools 
DROP COLUMN IF EXISTS blood_level,
DROP COLUMN IF EXISTS mucus_level,
DROP COLUMN IF EXISTS stool_color,
DROP COLUMN IF EXISTS evacuation_effort,
DROP COLUMN IF EXISTS duration_minutes,
DROP COLUMN IF EXISTS pain_level,
DROP COLUMN IF EXISTS notes;

-- Remettre l'ancienne contrainte consistency
ALTER TABLE stools 
DROP CONSTRAINT IF EXISTS stools_consistency_check;
ALTER TABLE stools 
ADD CONSTRAINT stools_consistency_check 
CHECK (consistency >= 0 AND consistency <= 7);

-- Supprimer les vues
DROP VIEW IF EXISTS stool_medical_alerts;
DROP VIEW IF EXISTS stool_weekly_stats;
*/
