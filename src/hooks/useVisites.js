import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook personnalisé pour gérer les données de visites avec Supabase
 * Fournit les opérations CRUD, la synchronisation temps réel et les états de chargement
 */
export function useVisites() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const subscriptionRef = useRef(null);

  // ========== RÉCUPÉRER TOUTES LES VISITES ==========
  const fetchVisites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: visites, error: fetchError } = await supabase
        .from('visites')
        .select('*')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Transformer les données (convertir null en chaîne vide pour les inputs)
      const transformedData = (visites || []).map(row => ({
        ...row,
        ...Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            value === null ? '' : value
          ])
        )
      }));

      setData(transformedData);
    } catch (err) {
      console.error('Erreur lors du chargement des visites:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ========== AJOUTER UNE NOUVELLE VISITE ==========
  const addRow = useCallback(async (patientData = {}) => {
    try {
      setIsSyncing(true);

      const newRow = {
        // Colonnes fixes - peuvent être pré-remplies
        id_patient: patientData.id_patient || '',
        id_fiche: patientData.id_fiche || null,
        nom_prenom: patientData.nom_prenom || null,
        date_naissance: patientData.date_naissance || null,
        sexe: patientData.sexe || null,
        type_fente: patientData.type_fente || null,
        lateralite: patientData.lateralite || null,
        severite: patientData.severite || null,
        malform_assoc: patientData.malform_assoc || null,
        prof_mere: patientData.prof_mere || null,
        prof_pere: patientData.prof_pere || null,
        milieu_residence: patientData.milieu_residence || null,
        nb_enfants: patientData.nb_enfants || null,
        // Colonnes variables - toujours vides pour nouvelle visite
        date_consult: null,
        poids_g: null,
        taille_cm: null,
        pb_mm: null,
        mode_alim: null,
        diff_succion: null,
        fuite_nasale: null,
        vomiss: null,
        conseil_nutri: null,
        tech_specifique: null,
        dispositif_spec: null,
        prescription: null,
        ref_nutri: null,
        complication: null
      };

      const { data: insertedRow, error: insertError } = await supabase
        .from('visites')
        .insert([newRow])
        .select()
        .single();

      if (insertError) throw insertError;

      // Transformer et ajouter à l'état local
      const transformedRow = {
        ...insertedRow,
        ...Object.fromEntries(
          Object.entries(insertedRow).map(([key, value]) => [
            key,
            value === null ? '' : value
          ])
        )
      };

      setData(prev => [...prev, transformedRow]);
      return transformedRow;
    } catch (err) {
      console.error('Erreur lors de l\'ajout:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ========== METTRE À JOUR UNE CELLULE ==========
  const updateCell = useCallback(async (id, key, value) => {
    try {
      setIsSyncing(true);

      // Convertir chaîne vide en null pour la base de données
      const dbValue = value === '' ? null : value;

      const { error: updateError } = await supabase
        .from('visites')
        .update({ [key]: dbValue })
        .eq('id', id);

      if (updateError) throw updateError;

      // Mise à jour optimiste
      setData(prev => prev.map(row =>
        row.id === id ? { ...row, [key]: value } : row
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.message);
      await fetchVisites();
    } finally {
      setIsSyncing(false);
    }
  }, [fetchVisites]);

  // ========== SUPPRIMER UNE LIGNE ==========
  const deleteRow = useCallback(async (id) => {
    try {
      setIsSyncing(true);

      const { error: deleteError } = await supabase
        .from('visites')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Mise à jour optimiste
      setData(prev => prev.filter(row => row.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message);
      await fetchVisites();
    } finally {
      setIsSyncing(false);
    }
  }, [fetchVisites]);

  // ========== MISE À JOUR MULTIPLE (pour auto-fill) ==========
  const updateMultipleCells = useCallback(async (id, updates) => {
    try {
      setIsSyncing(true);

      // Convertir chaînes vides en null
      const dbUpdates = Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [
          key,
          value === '' ? null : value
        ])
      );

      const { error: updateError } = await supabase
        .from('visites')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Mise à jour optimiste
      setData(prev => prev.map(row =>
        row.id === id ? { ...row, ...updates } : row
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour multiple:', err);
      setError(err.message);
      await fetchVisites();
    } finally {
      setIsSyncing(false);
    }
  }, [fetchVisites]);

  // ========== CHARGEMENT INITIAL & SUBSCRIPTION TEMPS RÉEL ==========
  useEffect(() => {
    fetchVisites();

    // Configuration de la subscription temps réel
    subscriptionRef.current = supabase
      .channel('visites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visites'
        },
        (payload) => {
          console.log('Mise à jour temps réel:', payload.eventType);

          switch (payload.eventType) {
            case 'INSERT':
              setData(prev => {
                if (prev.some(row => row.id === payload.new.id)) {
                  return prev;
                }
                const transformedRow = {
                  ...payload.new,
                  ...Object.fromEntries(
                    Object.entries(payload.new).map(([key, value]) => [
                      key,
                      value === null ? '' : value
                    ])
                  )
                };
                return [...prev, transformedRow];
              });
              break;

            case 'UPDATE':
              setData(prev => prev.map(row =>
                row.id === payload.new.id
                  ? {
                      ...row,
                      ...payload.new,
                      ...Object.fromEntries(
                        Object.entries(payload.new).map(([key, value]) => [
                          key,
                          value === null ? '' : value
                        ])
                      )
                    }
                  : row
              ));
              break;

            case 'DELETE':
              setData(prev => prev.filter(row => row.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    // Nettoyage à la désinscription
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [fetchVisites]);

  // Fonction pour effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    isSyncing,
    addRow,
    updateCell,
    deleteRow,
    updateMultipleCells,
    refetch: fetchVisites,
    clearError
  };
}
