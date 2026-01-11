import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Colonnes fixes à auto-remplir (excluant id_patient)
export const FIXED_COLUMNS_KEYS = [
  'id_fiche',
  'nom_prenom',
  'date_naissance',
  'poids_naissance_g',
  'taille_naissance_cm',
  'sexe',
  'type_fente',
  'lateralite',
  'severite',
  'malform_assoc',
  'prof_mere',
  'prof_pere',
  'milieu_residence',
  'nb_enfants'
];

/**
 * Hook pour la recherche de patient et l'auto-remplissage
 */
export function usePatientLookup() {

  /**
   * Rechercher les données d'un patient existant par id_patient
   * Retourne les colonnes fixes de la visite la plus récente
   */
  const lookupPatient = useCallback(async (idPatient) => {
    if (!idPatient || idPatient.trim() === '') {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('visites')
        .select(FIXED_COLUMNS_KEYS.join(','))
        .eq('id_patient', idPatient.trim())
        .not('nom_prenom', 'is', null) // Ne prendre que les visites avec au moins nom_prenom rempli
        .not('nom_prenom', 'eq', '') // Exclure aussi les chaînes vides
        .order('date_consult', { ascending: false, nullsFirst: false }) // Trier par date de consultation réelle
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Convertir null en chaîne vide
        return Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            value === null ? '' : value
          ])
        );
      }

      return null;
    } catch (err) {
      console.error('Erreur lors de la recherche du patient:', err);
      return null;
    }
  }, []);

  /**
   * Obtenir tous les IDs de patients uniques pour l'autocomplétion
   */
  const getPatientIds = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('visites')
        .select('id_patient')
        .not('id_patient', 'is', null)
        .not('id_patient', 'eq', '')
        .order('id_patient');

      if (error) throw error;

      // Retourner les IDs uniques
      const uniqueIds = [...new Set((data || []).map(row => row.id_patient))];
      return uniqueIds;
    } catch (err) {
      console.error('Erreur lors de la récupération des IDs patients:', err);
      return [];
    }
  }, []);

  return {
    lookupPatient,
    getPatientIds,
    FIXED_COLUMNS_KEYS
  };
}
