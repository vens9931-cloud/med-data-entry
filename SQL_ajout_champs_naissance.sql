-- =============================================================================
-- SQL pour ajouter les champs poids_naissance_g et taille_naissance_cm
-- =============================================================================
-- À exécuter dans Supabase SQL Editor
-- Ces champs sont nécessaires pour les calculs nutritionnels (Poids/âge, Taille/âge)

-- Ajouter les colonnes poids_naissance_g et taille_naissance_cm à la table visites
ALTER TABLE visites 
ADD COLUMN IF NOT EXISTS poids_naissance_g NUMERIC,
ADD COLUMN IF NOT EXISTS taille_naissance_cm NUMERIC;

-- Vérification : Afficher la structure de la table pour confirmer l'ajout
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'visites' 
  AND column_name IN ('poids_naissance_g', 'taille_naissance_cm')
ORDER BY column_name;
