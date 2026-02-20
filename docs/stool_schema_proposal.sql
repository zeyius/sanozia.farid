-- PROPOSITION D'AMÉLIORATION DU SCHÉMA STOOLS
-- Migration progressive avec rétrocompatibilité

-- 1. SCHÉMA ACTUEL (pour référence)
/*
CREATE TABLE stools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  consistency INTEGER NOT NULL,
  has_blood BOOLEAN,
  has_mucus BOOLEAN,
  urgency TEXT CHECK (urgency IN ('none', 'moderate', 'severe')),
  stool_date DATE NOT NULL,
  stool_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 2. NOUVEAU SCHÉMA PROPOSÉ
CREATE TABLE stools_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  
  -- ÉCHELLE DE BRISTOL (0-8)
  consistency INTEGER NOT NULL CHECK (consistency >= 0 AND consistency <= 8),
  
  -- SANG : niveaux médicaux précis
  blood_level TEXT NOT NULL DEFAULT 'none' 
    CHECK (blood_level IN ('none', 'trace', 'moderate', 'severe')),
  
  -- MUCOSITÉ : niveaux médicaux précis  
  mucus_level TEXT NOT NULL DEFAULT 'none'
    CHECK (mucus_level IN ('none', 'trace', 'moderate', 'severe')),
  
  -- URGENCE
  urgency TEXT NOT NULL DEFAULT 'none'
    CHECK (urgency IN ('none', 'moderate', 'severe')),
  
  -- NOUVELLES MÉTADONNÉES MÉDICALES
  stool_color TEXT CHECK (stool_color IN ('brown', 'dark_brown', 'light_brown', 'yellow', 'green', 'black', 'red', 'pale', 'other')),
  
  evacuation_effort TEXT CHECK (evacuation_effort IN ('easy', 'normal', 'difficult', 'very_difficult')),
  
  duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 120),
  
  -- NOTES LIBRES
  notes TEXT,
  
  -- CONTEXTE MÉDICAL
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  
  -- TIMING
  stool_date DATE NOT NULL,
  stool_time TIME NOT NULL,
  
  -- AUDIT
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- INDEX pour performance
  CONSTRAINT valid_stool_entry CHECK (
    -- Type 0 (aucune selle) ne peut pas avoir de sang/mucus
    (consistency = 0 AND blood_level = 'none' AND mucus_level = 'none') OR
    (consistency > 0)
  )
);

-- 3. MIGRATION PROGRESSIVE
-- Étape 1: Ajouter les nouvelles colonnes à la table existante
ALTER TABLE stools 
ADD COLUMN blood_level TEXT DEFAULT 'none' CHECK (blood_level IN ('none', 'trace', 'moderate', 'severe')),
ADD COLUMN mucus_level TEXT DEFAULT 'none' CHECK (mucus_level IN ('none', 'trace', 'moderate', 'severe')),
ADD COLUMN stool_color TEXT CHECK (stool_color IN ('brown', 'dark_brown', 'light_brown', 'yellow', 'green', 'black', 'red', 'pale', 'other')),
ADD COLUMN evacuation_effort TEXT CHECK (evacuation_effort IN ('easy', 'normal', 'difficult', 'very_difficult')),
ADD COLUMN duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 120),
ADD COLUMN notes TEXT,
ADD COLUMN pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10);

-- Étape 2: Migrer les données existantes
UPDATE stools SET 
  blood_level = CASE 
    WHEN has_blood = true THEN 'trace'
    ELSE 'none'
  END,
  mucus_level = CASE 
    WHEN has_mucus = true THEN 'trace'
    ELSE 'none'
  END;

-- Étape 3: Supprimer les anciennes colonnes (après validation)
-- ALTER TABLE stools DROP COLUMN has_blood;
-- ALTER TABLE stools DROP COLUMN has_mucus;

-- 4. INDEX POUR PERFORMANCE
CREATE INDEX idx_stools_profile_date ON stools(profile_id, stool_date DESC);
CREATE INDEX idx_stools_consistency ON stools(consistency);
CREATE INDEX idx_stools_blood_mucus ON stools(blood_level, mucus_level) WHERE blood_level != 'none' OR mucus_level != 'none';

-- 5. TRIGGER POUR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stools_updated_at BEFORE UPDATE ON stools
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
