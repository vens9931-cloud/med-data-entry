import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Download,
  Trash2,
  Users,
  Calendar,
  FileSpreadsheet,
  BookOpen,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Baby,
  Heart,
  Info,
  Settings,
  Edit,
  MoreVertical
} from 'lucide-react';

// Imports Supabase
import { useVisites } from './hooks/useVisites';
import { PatientIdInput } from './components/PatientIdInput';
import { StatusIndicator, ErrorMessage, TableSkeleton } from './components/StatusIndicator';
import { ImageImport } from './components/ImageImport';
import { ApiSettings } from './components/ApiSettings';
import { VisiteEditModal } from './components/VisiteEditModal';
import { VisiteAddButton } from './components/VisiteAddModal';

// =============================================================================
// TYPES ET CONSTANTES
// =============================================================================

// Options pour les champs select
const SELECT_OPTIONS = {
  sexe: ['M', 'F'],
  type_fente: ['Labiale', 'Palatine', 'Labiopalatine'],
  lateralite: ['Gauche', 'Droite', 'Bilatérale', 'NA'],
  severite: ['Complète', 'Incomplète', 'NP'],
  malform_assoc: ['Oui', 'Non', 'NP'],
  milieu_residence: ['Urbain', 'Périurbain', 'Rural'],
  mode_alim: ['AME', 'Mixte', 'Artificiel', 'NP'],
  oui_non_np: ['Oui', 'Non', 'NP']
};

// Définition des colonnes
const FIXED_COLUMNS = [
  { key: 'id_patient', label: 'ID Patient', type: 'text' },
  { key: 'id_fiche', label: 'ID Fiche', type: 'text' },
  { key: 'nom_prenom', label: 'Nom Prénom', type: 'text' },
  { key: 'date_naissance', label: 'Date Naiss.', type: 'date' },
  { key: 'poids_naissance_g', label: 'Poids Naiss. (g)', type: 'number' },
  { key: 'taille_naissance_cm', label: 'Taille Naiss. (cm)', type: 'number' },
  { key: 'sexe', label: 'Sexe', type: 'select', options: SELECT_OPTIONS.sexe },
  { key: 'type_fente', label: 'Type Fente', type: 'select', options: SELECT_OPTIONS.type_fente },
  { key: 'lateralite', label: 'Latéralité', type: 'select', options: SELECT_OPTIONS.lateralite },
  { key: 'severite', label: 'Sévérité', type: 'select', options: SELECT_OPTIONS.severite },
  { key: 'malform_assoc', label: 'Malf. Assoc.', type: 'select', options: SELECT_OPTIONS.malform_assoc },
  { key: 'prof_mere', label: 'Prof. Mère', type: 'text' },
  { key: 'prof_pere', label: 'Prof. Père', type: 'text' },
  { key: 'milieu_residence', label: 'Milieu Rés.', type: 'text' },
  { key: 'nb_enfants', label: 'Nb Enfants', type: 'text' }
];

const VARIABLE_COLUMNS = [
  { key: 'date_consult', label: 'Date Consult.', type: 'date' },
  { key: 'poids_g', label: 'Poids (g)', type: 'number' },
  { key: 'taille_cm', label: 'Taille (cm)', type: 'number' },
  { key: 'pb_mm', label: 'PB (mm)', type: 'number' },
  { key: 'mode_alim', label: 'Mode Alim.', type: 'select', options: SELECT_OPTIONS.mode_alim },
  { key: 'diff_succion', label: 'Diff. Succion', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'fuite_nasale', label: 'Fuite Nasale', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'vomiss', label: 'Vomiss.', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'conseil_nutri', label: 'Conseil Nutri', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'tech_specifique', label: 'Tech. Spéc.', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'dispositif_spec', label: 'Disp. Spéc.', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'prescription', label: 'Prescription', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'ref_nutri', label: 'Réf. Nutri', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'complication', label: 'Complication', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'suivi_programme', label: 'Suivi Programm.', type: 'select', options: SELECT_OPTIONS.oui_non_np },
  { key: 'perte_vue', label: 'Perte de Vue', type: 'select', options: SELECT_OPTIONS.oui_non_np }
];

const CALCULATED_COLUMNS = [
  { key: 'num_visite', label: 'N° Visite' },
  { key: 'age_jours', label: 'Âge (j)' },
  { key: 'age_mois', label: 'Âge (mois)' },
  { key: 'cat_age', label: 'Cat. Âge' },
  { key: 'annee', label: 'Année' },
  { key: 'periode', label: 'Période' },
  { key: 'score_pec', label: 'Score PEC' },
  { key: 'poids_precedent', label: 'Poids Préc.' },
  { key: 'gain_ponderal_g', label: 'Gain (g)' },
  { key: 'delai_jours', label: 'Délai (j)' },
  { key: 'gain_g_par_jour', label: 'Gain/jour' },
  { key: 'amelio_poids', label: 'Amélio. Poids' }
];

// Données initiales avec 3 visites de SAOUNSE
const INITIAL_DATA = [
  {
    id: '1',
    id_patient: 'SAOUNSE_001',
    id_fiche: '2023/006926',
    nom_prenom: 'SAOUNSE Gervine',
    date_naissance: '2023-04-11',
    sexe: 'F',
    type_fente: 'Labiopalatine',
    lateralite: 'Gauche',
    severite: 'Complète',
    malform_assoc: 'Non',
    prof_mere: 'Ménagère',
    prof_pere: 'Cultivateur',
    milieu_residence: 'Périurbain',
    nb_enfants: '6',
    date_consult: '2023-04-12',
    poids_g: 2890,
    taille_cm: 51,
    pb_mm: '',
    mode_alim: 'AME',
    diff_succion: 'NP',
    fuite_nasale: 'NP',
    vomiss: 'NP',
    conseil_nutri: 'Oui',
    tech_specifique: 'Oui',
    dispositif_spec: 'NP',
    prescription: 'NP',
    ref_nutri: 'NP',
    complication: 'NP'
  },
  {
    id: '2',
    id_patient: 'SAOUNSE_001',
    id_fiche: '2023/006926',
    nom_prenom: 'SAOUNSE Gervine',
    date_naissance: '2023-04-11',
    sexe: 'F',
    type_fente: 'Labiopalatine',
    lateralite: 'Gauche',
    severite: 'Complète',
    malform_assoc: 'Non',
    prof_mere: 'Ménagère',
    prof_pere: 'Cultivateur',
    milieu_residence: 'Périurbain',
    nb_enfants: '6',
    date_consult: '2023-06-27',
    poids_g: 2900,
    taille_cm: '',
    pb_mm: '',
    mode_alim: 'NP',
    diff_succion: 'NP',
    fuite_nasale: 'NP',
    vomiss: 'NP',
    conseil_nutri: 'NP',
    tech_specifique: 'NP',
    dispositif_spec: 'NP',
    prescription: 'NP',
    ref_nutri: 'NP',
    complication: 'NP'
  },
  {
    id: '3',
    id_patient: 'SAOUNSE_001',
    id_fiche: '2023/006926',
    nom_prenom: 'SAOUNSE Gervine',
    date_naissance: '2023-04-11',
    sexe: 'F',
    type_fente: 'Labiopalatine',
    lateralite: 'Gauche',
    severite: 'Complète',
    malform_assoc: 'Non',
    prof_mere: 'Ménagère',
    prof_pere: 'Cultivateur',
    milieu_residence: 'Périurbain',
    nb_enfants: '6',
    date_consult: '2023-07-27',
    poids_g: 3700,
    taille_cm: 57,
    pb_mm: '',
    mode_alim: 'NP',
    diff_succion: 'NP',
    fuite_nasale: 'NP',
    vomiss: 'NP',
    conseil_nutri: 'NP',
    tech_specifique: 'NP',
    dispositif_spec: 'NP',
    prescription: 'NP',
    ref_nutri: 'NP',
    complication: 'NP'
  }
];

// =============================================================================
// FONCTIONS DE CALCUL
// =============================================================================

/**
 * Calcule toutes les colonnes dérivées pour une ligne donnée
 */
function calculateDerivedData(row, allRows, rowIndex) {
  const derived = {};

  // Filtrer les visites du même patient, triées par date
  const patientVisits = allRows
    .map((r, idx) => ({ ...r, originalIndex: idx }))
    .filter(r => r.id_patient === row.id_patient && r.id_patient !== '')
    .sort((a, b) => new Date(a.date_consult) - new Date(b.date_consult));

  // Trouver l'index de cette visite parmi les visites du patient
  const visitIndex = patientVisits.findIndex(v => v.originalIndex === rowIndex);

  // num_visite : numéro de la visite pour ce patient
  derived.num_visite = visitIndex >= 0 ? visitIndex + 1 : '';

  // age_jours et age_mois
  if (row.date_consult && row.date_naissance) {
    const dateConsult = new Date(row.date_consult);
    const dateNaissance = new Date(row.date_naissance);
    const diffTime = dateConsult - dateNaissance;
    const ageJours = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    derived.age_jours = ageJours >= 0 ? ageJours : '';
    derived.age_mois = ageJours >= 0 ? Math.round((ageJours / 30.44) * 10) / 10 : '';

    // cat_age
    if (derived.age_mois !== '') {
      if (derived.age_mois < 1) {
        derived.cat_age = 'Nouveau-né';
      } else if (derived.age_mois < 12) {
        derived.cat_age = 'Nourrisson';
      } else {
        derived.cat_age = 'Petit enfant';
      }
    } else {
      derived.cat_age = '';
    }
  } else {
    derived.age_jours = '';
    derived.age_mois = '';
    derived.cat_age = '';
  }

  // annee et periode
  if (row.date_consult) {
    const annee = new Date(row.date_consult).getFullYear();
    derived.annee = annee;

    if (annee <= 2016) {
      derived.periode = '2014-2016';
    } else if (annee <= 2019) {
      derived.periode = '2017-2019';
    } else if (annee <= 2022) {
      derived.periode = '2020-2022';
    } else {
      derived.periode = '2023-2025';
    }
  } else {
    derived.annee = '';
    derived.periode = '';
  }

  // score_pec : somme des "Oui" dans les 5 champs
  const pecFields = ['conseil_nutri', 'tech_specifique', 'dispositif_spec', 'prescription', 'ref_nutri'];
  derived.score_pec = pecFields.filter(f => row[f] === 'Oui').length;

  // Calculs basés sur la visite précédente
  if (visitIndex > 0) {
    const previousVisit = patientVisits[visitIndex - 1];

    // poids_precedent
    derived.poids_precedent = previousVisit.poids_g || '';

    // gain_ponderal_g
    if (row.poids_g && previousVisit.poids_g) {
      derived.gain_ponderal_g = row.poids_g - previousVisit.poids_g;
    } else {
      derived.gain_ponderal_g = '';
    }

    // delai_jours
    if (row.date_consult && previousVisit.date_consult) {
      const currentDate = new Date(row.date_consult);
      const prevDate = new Date(previousVisit.date_consult);
      derived.delai_jours = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
    } else {
      derived.delai_jours = '';
    }

    // gain_g_par_jour
    if (derived.gain_ponderal_g !== '' && derived.delai_jours && derived.delai_jours > 0) {
      derived.gain_g_par_jour = Math.round((derived.gain_ponderal_g / derived.delai_jours) * 10) / 10;
    } else {
      derived.gain_g_par_jour = '';
    }

    // amelio_poids
    if (derived.gain_g_par_jour !== '') {
      if (derived.gain_g_par_jour >= 20) {
        derived.amelio_poids = 'Oui';
      } else if (derived.gain_g_par_jour >= 1) {
        derived.amelio_poids = 'Insuffisant';
      } else {
        derived.amelio_poids = 'Non';
      }
    } else {
      derived.amelio_poids = 'NA';
    }
  } else {
    derived.poids_precedent = '';
    derived.gain_ponderal_g = '';
    derived.delai_jours = '';
    derived.gain_g_par_jour = '';
    derived.amelio_poids = 'NA';
  }

  return derived;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function NutritionalTrackingApp() {
  const [activeTab, setActiveTab] = useState('saisie');
  // État local pour les valeurs en cours de saisie (pour mise à jour immédiate de l'UI)
  const [localValues, setLocalValues] = useState({});
  // État pour afficher/masquer le modal de configuration API
  const [showApiSettings, setShowApiSettings] = useState(false);
  // État pour le modal d'édition de visite
  const [editingVisite, setEditingVisite] = useState(null);

  // Hook Supabase pour les données
  const {
    data,
    loading,
    error,
    isSyncing,
    addRow: addRowToDb,
    updateCell: updateCellInDb,
    deleteRow: deleteRowFromDb,
    updateMultipleCells,
    refetch,
    clearError
  } = useVisites();

  // Fusionner les données avec les valeurs locales en cours de saisie
  const dataWithLocalValues = useMemo(() => {
    return data.map(row => {
      const rowKey = row.id;
      const localRow = localValues[rowKey] || {};
      return { ...row, ...localRow };
    });
  }, [data, localValues]);

  // Calculer les données dérivées pour toutes les lignes
  const dataWithCalculations = useMemo(() => {
    return dataWithLocalValues.map((row, index) => ({
      ...row,
      ...calculateDerivedData(row, dataWithLocalValues, index)
    }));
  }, [dataWithLocalValues]);

  // Statistiques
  const stats = useMemo(() => {
    const uniquePatients = new Set(dataWithLocalValues.filter(r => r.id_patient).map(r => r.id_patient));
    const visitsWithGoodGain = dataWithCalculations.filter(r => r.gain_g_par_jour >= 20).length;
    const visitsWithConseil = dataWithLocalValues.filter(r => r.conseil_nutri === 'Oui').length;
    const totalScorePec = dataWithCalculations.reduce((sum, r) => sum + (r.score_pec || 0), 0);
    const avgScorePec = data.length > 0 ? (totalScorePec / data.length).toFixed(1) : 0;

    // Détail par patient
    const patientDetails = [];
    uniquePatients.forEach(patientId => {
      const patientVisits = dataWithCalculations
        .filter(r => r.id_patient === patientId)
        .sort((a, b) => new Date(a.date_consult) - new Date(b.date_consult));

      if (patientVisits.length > 0) {
        const firstVisit = patientVisits[0];
        const lastVisit = patientVisits[patientVisits.length - 1];
        const gainTotal = (lastVisit.poids_g || 0) - (firstVisit.poids_g || 0);

        patientDetails.push({
          id: patientId,
          nom: firstVisit.nom_prenom,
          nbVisites: patientVisits.length,
          gainTotal,
          premierPoids: firstVisit.poids_g,
          dernierPoids: lastVisit.poids_g
        });
      }
    });

    return {
      totalVisites: dataWithLocalValues.length,
      totalPatients: uniquePatients.size,
      avgScorePec,
      visitsWithGoodGain,
      visitsWithConseil,
      patientDetails
    };
  }, [dataWithLocalValues, dataWithCalculations]);

  // Ajouter une nouvelle ligne (via Supabase)
  const addRow = useCallback(async () => {
    try {
      await addRowToDb({});
    } catch (err) {
      console.error('Échec de l\'ajout:', err);
    }
  }, [addRowToDb]);

  // Supprimer une ligne (via Supabase)
  const deleteRow = useCallback(async (id) => {
    try {
      await deleteRowFromDb(id);
    } catch (err) {
      console.error('Échec de la suppression:', err);
    }
  }, [deleteRowFromDb]);

  // Mettre à jour une cellule localement (pour mise à jour immédiate de l'UI)
  const updateCellLocal = useCallback((id, key, value) => {
    setLocalValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value
      }
    }));
  }, []);

  // Sauvegarder une cellule dans Supabase (appelé au onBlur pour texte/number)
  const saveCellToDb = useCallback(async (id, key, value) => {
    try {
      await updateCellInDb(id, key, value);
      // Nettoyer la valeur locale après sauvegarde réussie
      setLocalValues(prev => {
        const newValues = { ...prev };
        if (newValues[id]) {
          delete newValues[id][key];
          if (Object.keys(newValues[id]).length === 0) {
            delete newValues[id];
          }
        }
        return newValues;
      });
    } catch (err) {
      console.error('Échec de la mise à jour:', err);
    }
  }, [updateCellInDb]);

  // Mettre à jour une cellule (via Supabase) - pour selects et dates (sauvegarde immédiate)
  const updateCell = useCallback(async (id, key, value) => {
    try {
      await updateCellInDb(id, key, value);
    } catch (err) {
      console.error('Échec de la mise à jour:', err);
    }
  }, [updateCellInDb]);

  // Auto-remplissage des données patient
  const handleAutoFill = useCallback(async (rowId, patientData) => {
    try {
      await updateMultipleCells(rowId, patientData);
    } catch (err) {
      console.error('Échec de l\'auto-remplissage:', err);
    }
  }, [updateMultipleCells]);

  // Importer des visites depuis une image (OCR + Gemini)
  const handleImageImport = useCallback(async (visites) => {
    try {
      // Créer chaque visite en séquence
      for (const visite of visites) {
        const newRow = await addRowToDb({});
        if (newRow && newRow.id) {
          // Mettre à jour avec les données extraites
          await updateMultipleCells(newRow.id, visite);
        }
      }
    } catch (err) {
      console.error('Échec de l\'import depuis image:', err);
      throw err;
    }
  }, [addRowToDb, updateMultipleCells]);

  // Obtenir la liste des IDs patients existants (pour générer les nouveaux IDs)
  const existingPatientIds = useMemo(() => {
    return [...new Set(data.filter(r => r.id_patient).map(r => r.id_patient))];
  }, [data]);

  // Sauvegarder les modifications depuis le modal d'édition
  const handleSaveEdit = useCallback(async (updatedVisite) => {
    try {
      await updateMultipleCells(updatedVisite.id, updatedVisite);
    } catch (err) {
      console.error('Échec de la sauvegarde:', err);
      throw err;
    }
  }, [updateMultipleCells]);

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = [
      ...FIXED_COLUMNS.map(c => c.key),
      ...VARIABLE_COLUMNS.map(c => c.key),
      ...CALCULATED_COLUMNS.map(c => c.key)
    ];

    const csvContent = [
      headers.join(';'),
      ...dataWithCalculations.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          return String(val).includes(';') ? `"${val}"` : val;
        }).join(';')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'donnees_fentes_nutritionnelles.csv';
    link.click();
  }, [dataWithCalculations]);

  // Rendu des cellules en lecture seule
  const renderCell = (row, column, isFixed) => {
    const value = row[column.key];
    const bgColor = isFixed ? 'bg-blue-50' : 'bg-green-50';

    // Affichage simple en lecture seule
    return (
      <div className={`w-full px-2 py-1.5 text-xs ${bgColor} rounded`}>
        {value || '-'}
      </div>
    );
  };

  // Rendu des cellules calculées avec alertes visuelles
  const renderCalculatedCell = (row, column) => {
    const value = row[column.key];
    let bgColor = 'bg-yellow-100';
    let textColor = 'text-gray-800';

    // Alertes visuelles pour gain_g_par_jour
    if (column.key === 'gain_g_par_jour' && value !== '' && value !== 'NA') {
      if (value >= 20) {
        bgColor = 'bg-green-200';
        textColor = 'text-green-800';
      } else if (value >= 1) {
        bgColor = 'bg-orange-200';
        textColor = 'text-orange-800';
      } else if (value < 0) {
        bgColor = 'bg-red-200';
        textColor = 'text-red-800';
      }
    }

    // Alertes visuelles pour amelio_poids
    if (column.key === 'amelio_poids') {
      if (value === 'Oui') {
        bgColor = 'bg-green-200';
        textColor = 'text-green-800';
      } else if (value === 'Insuffisant') {
        bgColor = 'bg-orange-200';
        textColor = 'text-orange-800';
      } else if (value === 'Non') {
        bgColor = 'bg-red-200';
        textColor = 'text-red-800';
      }
    }

    return (
      <div className={`px-2 py-1 text-xs text-center ${bgColor} ${textColor} rounded`}>
        {value !== '' ? value : '-'}
      </div>
    );
  };

  // =============================================================================
  // ONGLET SAISIE
  // =============================================================================

  const renderSaisieTab = () => (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <div className="flex items-center gap-4">
          <VisiteAddButton
            onImportComplete={handleImageImport}
            existingPatientIds={existingPatientIds}
          />
          <ImageImport
            onImportComplete={handleImageImport}
            existingPatientIds={existingPatientIds}
          />
          <button
            onClick={exportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            Exporter CSV
          </button>
        </div>
        <div className="flex items-center gap-6">
          {/* Indicateur de statut Supabase */}
          <StatusIndicator
            loading={loading}
            error={error}
            isSyncing={isSyncing}
            onRetry={refetch}
          />
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={18} />
            <span className="font-medium">{stats.totalVisites} visites</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users size={18} />
            <span className="font-medium">{stats.totalPatients} patients</span>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
        <>
        <table className="w-full border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            {/* Ligne de groupes */}
            <tr>
              <th
                colSpan={FIXED_COLUMNS.length}
                className="px-2 py-2 text-xs font-bold text-white bg-blue-600 border border-blue-700"
              >
                🔵 DONNÉES FIXES (recopier pour chaque visite du même patient)
              </th>
              <th
                colSpan={VARIABLE_COLUMNS.length}
                className="px-2 py-2 text-xs font-bold text-white bg-green-600 border border-green-700"
              >
                🟢 DONNÉES VARIABLES (changer à chaque visite)
              </th>
              <th
                colSpan={CALCULATED_COLUMNS.length}
                className="px-2 py-2 text-xs font-bold text-gray-800 bg-yellow-400 border border-yellow-500"
              >
                🟡 CALCULS AUTOMATIQUES
              </th>
              <th className="px-2 py-2 bg-gray-200 border">Actions</th>
            </tr>
            {/* Ligne de colonnes */}
            <tr>
              {FIXED_COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-xs font-semibold text-blue-900 bg-blue-200 border border-blue-300 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {VARIABLE_COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-xs font-semibold text-green-900 bg-green-200 border border-green-300 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {CALCULATED_COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-xs font-semibold text-yellow-900 bg-yellow-200 border border-yellow-300 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 text-xs font-semibold text-gray-700 bg-gray-200 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dataWithCalculations.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {FIXED_COLUMNS.map(col => (
                  <td key={col.key} className="px-1 py-1 border border-gray-200">
                    {renderCell(row, col, true)}
                  </td>
                ))}
                {VARIABLE_COLUMNS.map(col => (
                  <td key={col.key} className="px-1 py-1 border border-gray-200">
                    {renderCell(row, col, false)}
                  </td>
                ))}
                {CALCULATED_COLUMNS.map(col => (
                  <td key={col.key} className="px-1 py-1 border border-gray-200">
                    {renderCalculatedCell(row, col)}
                  </td>
                ))}
                <td className="px-2 py-1 text-center border border-gray-200">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setEditingVisite(row)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                      title="Modifier cette visite"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                      title="Supprimer cette ligne"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileSpreadsheet size={48} className="mb-4 opacity-50" />
            <p>Aucune donnée. Cliquez sur "Importer depuis photo" pour commencer la saisie.</p>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );

  // =============================================================================
  // ONGLET GUIDE
  // =============================================================================

  const renderGuideTab = () => (
    <div className="p-6 overflow-y-auto h-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BookOpen size={28} />
        Guide de saisie des données
      </h2>

      {/* Principe fondamental */}
      <div className="p-4 mb-6 bg-blue-100 border-l-4 border-blue-600 rounded-r-lg">
        <h3 className="font-bold text-blue-800 text-lg mb-2">📌 PRINCIPE FONDAMENTAL</h3>
        <p className="text-blue-900 font-semibold text-xl">UNE LIGNE = UNE VISITE</p>
        <p className="text-blue-800 mt-2">
          Si un enfant vient 6 fois en consultation, il aura <strong>6 lignes</strong> dans le tableau.
          Les données fixes (identité, type de fente...) sont recopiées sur chaque ligne.
          Les données variables (poids, taille, interventions...) changent à chaque visite.
        </p>
      </div>

      {/* Colonnes bleues */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-700 text-lg mb-3">🔵 COLONNES BLEUES - Données fixes</h3>
        <p className="text-gray-700 mb-3">Ces données ne changent JAMAIS pour un même patient :</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>id_patient</strong> : Identifiant unique du patient (ex: SAOUNSE_001)</li>
          <li><strong>id_fiche</strong> : Numéro de dossier médical (ex: 2023/006926)</li>
          <li><strong>nom_prenom</strong> : Nom complet du patient</li>
          <li><strong>date_naissance</strong> : Date de naissance</li>
          <li><strong>poids_naissance_g</strong> : Poids à la naissance en grammes</li>
          <li><strong>taille_naissance_cm</strong> : Taille à la naissance en centimètres</li>
          <li><strong>sexe</strong> : M (Masculin) ou F (Féminin)</li>
          <li><strong>type_fente</strong> : Labiale, Palatine, ou Labiopalatine</li>
          <li><strong>lateralite</strong> : Gauche, Droite, Bilatérale, ou NA</li>
          <li><strong>severite</strong> : Complète, Incomplète, ou NP (Non Précisé)</li>
          <li><strong>malform_assoc</strong> : Malformations associées (Oui/Non/NP)</li>
          <li><strong>prof_mere / prof_pere</strong> : Profession des parents</li>
          <li><strong>milieu_residence</strong> : Milieu de résidence (texte libre)</li>
          <li><strong>nb_enfants</strong> : Nombre d'enfants dans la fratrie</li>
        </ul>
      </div>

      {/* Colonnes vertes */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-bold text-green-700 text-lg mb-3">🟢 COLONNES VERTES - Données variables</h3>
        <p className="text-gray-700 mb-3">Ces données CHANGENT à chaque visite :</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>date_consult</strong> : Date de la consultation</li>
          <li><strong>poids_g</strong> : Poids en grammes</li>
          <li><strong>taille_cm</strong> : Taille en centimètres</li>
          <li><strong>pb_mm</strong> : Périmètre brachial en millimètres (optionnel)</li>
          <li><strong>mode_alim</strong> : AME (Allaitement Maternel Exclusif), Mixte, Artificiel, NP</li>
          <li><strong>diff_succion</strong> : Difficultés de succion</li>
          <li><strong>fuite_nasale</strong> : Présence de fuites nasales</li>
          <li><strong>vomiss</strong> : Vomissements</li>
          <li><strong>conseil_nutri</strong> : Conseil nutritionnel donné</li>
          <li><strong>tech_specifique</strong> : Technique spécifique enseignée</li>
          <li><strong>dispositif_spec</strong> : Dispositif spécifique fourni</li>
          <li><strong>prescription</strong> : Prescription médicale</li>
          <li><strong>ref_nutri</strong> : Référence vers nutritionniste</li>
          <li><strong>complication</strong> : Présence de complications</li>
          <li><strong>suivi_programme</strong> : Visite programmée (Oui) ou consultation spontanée (Non)</li>
          <li><strong>perte_vue</strong> : Patient perdu de vue (Oui) ou suivi actif (Non)</li>
        </ul>
      </div>

      {/* Colonnes jaunes */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-yellow-700 text-lg mb-3">🟡 COLONNES JAUNES - Calculs automatiques</h3>
        <p className="text-gray-700 mb-3">Ces colonnes sont en <strong>LECTURE SEULE</strong> et se calculent automatiquement :</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>num_visite</strong> : Numéro de visite pour ce patient (1, 2, 3...)</li>
          <li><strong>age_jours</strong> : Âge en jours (date_consult - date_naissance)</li>
          <li><strong>age_mois</strong> : Âge en mois (age_jours / 30.44)</li>
          <li><strong>cat_age</strong> : Catégorie d'âge (Nouveau-né &lt;1 mois, Nourrisson &lt;12 mois, Petit enfant)</li>
          <li><strong>annee</strong> : Année de la consultation</li>
          <li><strong>periode</strong> : Période (2014-2016, 2017-2019, 2020-2022, 2023-2025)</li>
          <li><strong>score_pec</strong> : Score de prise en charge (0-5) = nombre de "Oui" parmi conseil, technique, dispositif, prescription, référence</li>
          <li><strong>poids_precedent</strong> : Poids à la visite précédente</li>
          <li><strong>gain_ponderal_g</strong> : Gain de poids (poids actuel - poids précédent)</li>
          <li><strong>delai_jours</strong> : Nombre de jours depuis la dernière visite</li>
          <li><strong>gain_g_par_jour</strong> : Gain pondéral quotidien (gain / délai)</li>
          <li><strong>amelio_poids</strong> : "Oui" si gain ≥20g/j, "Insuffisant" si 1-19g/j, "Non" si négatif</li>
        </ul>
      </div>

      {/* Exemple pratique */}
      <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
        <h3 className="font-bold text-green-800 text-lg mb-3">✅ EXEMPLE PRATIQUE : SAOUNSE Gervine</h3>
        <p className="text-gray-700 mb-2">Patient avec 3 visites :</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-green-200">
              <th className="border border-green-400 px-2 py-1">Visite</th>
              <th className="border border-green-400 px-2 py-1">Date</th>
              <th className="border border-green-400 px-2 py-1">Poids (g)</th>
              <th className="border border-green-400 px-2 py-1">Gain/jour</th>
              <th className="border border-green-400 px-2 py-1">Amélioration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-green-400 px-2 py-1 text-center">1</td>
              <td className="border border-green-400 px-2 py-1">12/04/2023</td>
              <td className="border border-green-400 px-2 py-1 text-center">2890</td>
              <td className="border border-green-400 px-2 py-1 text-center">-</td>
              <td className="border border-green-400 px-2 py-1 text-center">NA</td>
            </tr>
            <tr>
              <td className="border border-green-400 px-2 py-1 text-center">2</td>
              <td className="border border-green-400 px-2 py-1">27/06/2023</td>
              <td className="border border-green-400 px-2 py-1 text-center">2900</td>
              <td className="border border-green-400 px-2 py-1 text-center text-orange-600">0.1</td>
              <td className="border border-green-400 px-2 py-1 text-center text-orange-600">Insuffisant</td>
            </tr>
            <tr>
              <td className="border border-green-400 px-2 py-1 text-center">3</td>
              <td className="border border-green-400 px-2 py-1">27/07/2023</td>
              <td className="border border-green-400 px-2 py-1 text-center">3700</td>
              <td className="border border-green-400 px-2 py-1 text-center text-green-600">26.7</td>
              <td className="border border-green-400 px-2 py-1 text-center text-green-600">Oui</td>
            </tr>
          </tbody>
        </table>
        <p className="text-gray-700 mt-2">
          <strong>Gain total :</strong> 3700 - 2890 = <strong className="text-green-700">+810g</strong>
        </p>
      </div>

      {/* Erreurs à éviter */}
      <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
        <h3 className="font-bold text-red-800 text-lg mb-3">🚨 ERREURS À ÉVITER</h3>
        <ul className="list-disc pl-6 text-red-800 space-y-2">
          <li>Ne pas créer une nouvelle ligne pour chaque visite (une seule ligne par patient = ERREUR)</li>
          <li>Oublier de recopier les données fixes quand on ajoute une nouvelle visite</li>
          <li>Modifier les données fixes d'une visite à l'autre</li>
          <li>Laisser le champ id_patient vide (empêche les calculs automatiques)</li>
          <li>Inverser les dates (date_consult doit être ≥ date_naissance)</li>
          <li>Saisir le poids en kg au lieu de grammes</li>
          <li>Modifier les colonnes jaunes (elles sont en lecture seule)</li>
        </ul>
      </div>

      {/* Codes à utiliser */}
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <h3 className="font-bold text-gray-800 text-lg mb-3">📊 CODES À UTILISER</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Sexe :</strong>
            <ul className="list-disc pl-5 text-gray-700">
              <li>M = Masculin</li>
              <li>F = Féminin</li>
            </ul>
          </div>
          <div>
            <strong>Type de fente :</strong>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Labiale</li>
              <li>Palatine</li>
              <li>Labiopalatine</li>
            </ul>
          </div>
          <div>
            <strong>Latéralité :</strong>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Gauche</li>
              <li>Droite</li>
              <li>Bilatérale</li>
              <li>NA</li>
            </ul>
          </div>
          <div>
            <strong>Sévérité :</strong>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Complète</li>
              <li>Incomplète</li>
              <li>NP</li>
            </ul>
          </div>
          <div>
            <strong>Mode alimentation :</strong>
            <ul className="list-disc pl-5 text-gray-700">
              <li>AME = Allaitement Maternel Exclusif</li>
              <li>Mixte</li>
              <li>Artificiel</li>
              <li>NP</li>
            </ul>
          </div>
          <div>
            <strong>Milieu résidence :</strong>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Urbain</li>
              <li>Périurbain</li>
              <li>Rural</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // ONGLET INDICATEURS
  // =============================================================================

  const renderIndicateursTab = () => (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 size={28} />
        Indicateurs de suivi
      </h2>

      {/* Cartes principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-6 bg-blue-100 border border-blue-300 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-blue-600" size={24} />
            <span className="text-blue-700 font-medium">Total Visites</span>
          </div>
          <p className="text-4xl font-bold text-blue-800">{stats.totalVisites}</p>
        </div>

        <div className="p-6 bg-green-100 border border-green-300 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-green-600" size={24} />
            <span className="text-green-700 font-medium">Total Patients</span>
          </div>
          <p className="text-4xl font-bold text-green-800">{stats.totalPatients}</p>
        </div>

        <div className="p-6 bg-purple-100 border border-purple-300 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-purple-600" size={24} />
            <span className="text-purple-700 font-medium">Score PEC Moyen</span>
          </div>
          <p className="text-4xl font-bold text-purple-800">{stats.avgScorePec}/5</p>
        </div>
      </div>

      {/* Cartes secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600" size={24} />
            <span className="text-green-700 font-medium">Amélioration pondérale (≥20g/j)</span>
          </div>
          <p className="text-3xl font-bold text-green-800">{stats.visitsWithGoodGain}</p>
          <p className="text-sm text-green-600 mt-1">visites avec gain ≥ 20g/jour</p>
        </div>

        <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="text-blue-600" size={24} />
            <span className="text-blue-700 font-medium">Conseil nutritionnel donné</span>
          </div>
          <p className="text-3xl font-bold text-blue-800">{stats.visitsWithConseil}</p>
          <p className="text-sm text-blue-600 mt-1">visites avec conseil</p>
        </div>
      </div>

      {/* Détail par patient */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Baby size={20} />
          Détail par patient
        </h3>

        {stats.patientDetails.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun patient enregistré</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left border">ID Patient</th>
                  <th className="px-4 py-2 text-left border">Nom</th>
                  <th className="px-4 py-2 text-center border">Nb Visites</th>
                  <th className="px-4 py-2 text-center border">1er Poids (g)</th>
                  <th className="px-4 py-2 text-center border">Dernier Poids (g)</th>
                  <th className="px-4 py-2 text-center border">Gain Total (g)</th>
                </tr>
              </thead>
              <tbody>
                {stats.patientDetails.map(patient => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border font-mono text-xs">{patient.id}</td>
                    <td className="px-4 py-2 border">{patient.nom}</td>
                    <td className="px-4 py-2 border text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {patient.nbVisites}
                      </span>
                    </td>
                    <td className="px-4 py-2 border text-center">{patient.premierPoids || '-'}</td>
                    <td className="px-4 py-2 border text-center">{patient.dernierPoids || '-'}</td>
                    <td className="px-4 py-2 border text-center">
                      {patient.gainTotal !== 0 && patient.premierPoids && patient.dernierPoids ? (
                        <span className={`flex items-center justify-center gap-1 font-medium ${
                          patient.gainTotal >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {patient.gainTotal >= 0 ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                          {patient.gainTotal >= 0 ? '+' : ''}{patient.gainTotal}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Info size={16} />
          Légende des indicateurs
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            <span>Gain ≥ 20g/jour = Amélioration</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={16} />
            <span>Gain 1-19g/jour = Insuffisant</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="text-red-500" size={16} />
            <span>Gain &lt; 0 = Perte de poids</span>
          </div>
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // RENDU PRINCIPAL
  // =============================================================================

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Suivi Nutritionnel - Fentes Orofaciales
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              CHU Pédiatrique Charles de Gaulle - Ouagadougou, Burkina Faso
            </p>
          </div>
          <button
            onClick={() => setShowApiSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            title="Configurer les clés API"
          >
            <Settings size={20} />
            <span className="hidden sm:inline">Paramètres API</span>
          </button>
        </div>
      </header>

      {/* Navigation par onglets */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => setActiveTab('saisie')}
            className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'saisie'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet size={18} />
            Saisie des données
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={18} />
            Guide de saisie
          </button>
          <button
            onClick={() => setActiveTab('indicateurs')}
            className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'indicateurs'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={18} />
            Indicateurs
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'saisie' && renderSaisieTab()}
        {activeTab === 'guide' && renderGuideTab()}
        {activeTab === 'indicateurs' && renderIndicateursTab()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-xs py-2 px-4 text-center">
        Application développée pour le mémoire : État des lieux sur la prise en charge nutritionnelle
        des nouveaux-nés, nourrissons et petits enfants présentant une fente orofaciale au CHUPCDG
      </footer>

      {/* Message d'erreur toast */}
      <ErrorMessage error={error} onDismiss={clearError} />

      {/* Modal de configuration API */}
      {showApiSettings && (
        <ApiSettings onClose={() => setShowApiSettings(false)} />
      )}

      {/* Modal d'édition de visite */}
      {editingVisite && (
        <VisiteEditModal
          visite={editingVisite}
          onSave={handleSaveEdit}
          onClose={() => setEditingVisite(null)}
        />
      )}
    </div>
  );
}
