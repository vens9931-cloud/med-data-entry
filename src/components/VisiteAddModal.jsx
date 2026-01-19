import React, { useState, useCallback } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';

/**
 * Modal pour ajouter une ou plusieurs visites pour un même patient
 */
export function VisiteAddModal({ onSave, onClose, existingPatientIds = [] }) {
  // Données patient (fixes - une seule fois)
  const [patientData, setPatientData] = useState({
    id_patient: '',
    id_fiche: '',
    nom_prenom: '',
    date_naissance: '',
    poids_naissance_g: '',
    taille_naissance_cm: '',
    sexe: '',
    type_fente: '',
    lateralite: '',
    severite: '',
    malform_assoc: '',
    prof_mere: '',
    prof_pere: '',
    milieu_residence: '',
    nb_enfants: ''
  });

  // Liste des visites (variables - peut en avoir plusieurs)
  const [visites, setVisites] = useState([
    {
      id: Date.now(),
      date_consult: '',
      poids_g: '',
      taille_cm: '',
      pb_mm: '',
      mode_alim: '',
      diff_succion: '',
      fuite_nasale: '',
      vomiss: '',
      conseil_nutri: '',
      tech_specifique: '',
      dispositif_spec: '',
      prescription: '',
      ref_nutri: '',
      complication: '',
      suivi_programme: '',
      perte_vue: ''
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // Mettre à jour un champ patient
  const updatePatientField = useCallback((key, value) => {
    setPatientData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Mettre à jour un champ de visite
  const updateVisiteField = useCallback((index, key, value) => {
    setVisites(prev => prev.map((v, i) =>
      i === index ? { ...v, [key]: value } : v
    ));
  }, []);

  // Ajouter une nouvelle visite
  const addVisite = useCallback(() => {
    setVisites(prev => [...prev, {
      id: Date.now(),
      date_consult: '',
      poids_g: '',
      taille_cm: '',
      pb_mm: '',
      mode_alim: '',
      diff_succion: '',
      fuite_nasale: '',
      vomiss: '',
      conseil_nutri: '',
      tech_specifique: '',
      dispositif_spec: '',
      prescription: '',
      ref_nutri: '',
      complication: '',
      suivi_programme: '',
      perte_vue: ''
    }]);
  }, []);

  // Supprimer une visite
  const removeVisite = useCallback((index) => {
    if (visites.length > 1) {
      setVisites(prev => prev.filter((_, i) => i !== index));
    }
  }, [visites.length]);

  // Sauvegarder toutes les visites
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Combiner données patient + chaque visite
      const visitesComplete = visites.map(v => ({
        ...patientData,
        ...v
      }));

      await onSave(visitesComplete);
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  }, [patientData, visites, onSave, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-green-50">
          <h2 className="text-lg font-bold text-green-800 flex items-center gap-2">
            <Plus size={24} />
            Ajouter des visites pour un patient
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">

            {/* Données Patient (fixes - une seule fois) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">Informations Patient (une seule fois)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">ID Patient *</label>
                  <input
                    type="text"
                    value={patientData.id_patient}
                    onChange={(e) => updatePatientField('id_patient', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Ex: COMPAORE_001"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">ID Fiche</label>
                  <input
                    type="text"
                    value={patientData.id_fiche}
                    onChange={(e) => updatePatientField('id_fiche', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Ex: 2024/001234"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Nom Prénom *</label>
                  <input
                    type="text"
                    value={patientData.nom_prenom}
                    onChange={(e) => updatePatientField('nom_prenom', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Date Naissance *</label>
                  <input
                    type="date"
                    value={patientData.date_naissance}
                    onChange={(e) => updatePatientField('date_naissance', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Poids Naiss. (g)</label>
                  <input
                    type="number"
                    value={patientData.poids_naissance_g}
                    onChange={(e) => updatePatientField('poids_naissance_g', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Taille Naiss. (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={patientData.taille_naissance_cm}
                    onChange={(e) => updatePatientField('taille_naissance_cm', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Sexe</label>
                  <select
                    value={patientData.sexe}
                    onChange={(e) => updatePatientField('sexe', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">--</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Type Fente</label>
                  <select
                    value={patientData.type_fente}
                    onChange={(e) => updatePatientField('type_fente', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">--</option>
                    <option value="Labiale">Labiale</option>
                    <option value="Palatine">Palatine</option>
                    <option value="Labiopalatine">Labiopalatine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Latéralité</label>
                  <select
                    value={patientData.lateralite}
                    onChange={(e) => updatePatientField('lateralite', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">--</option>
                    <option value="Gauche">Gauche</option>
                    <option value="Droite">Droite</option>
                    <option value="Bilatérale">Bilatérale</option>
                    <option value="NA">NA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Sévérité</label>
                  <select
                    value={patientData.severite}
                    onChange={(e) => updatePatientField('severite', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">--</option>
                    <option value="Complète">Complète</option>
                    <option value="Incomplète">Incomplète</option>
                    <option value="NP">NP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Malf. Assoc.</label>
                  <select
                    value={patientData.malform_assoc}
                    onChange={(e) => updatePatientField('malform_assoc', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">--</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                    <option value="NP">NP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Prof. Mère</label>
                  <input
                    type="text"
                    value={patientData.prof_mere}
                    onChange={(e) => updatePatientField('prof_mere', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Prof. Père</label>
                  <input
                    type="text"
                    value={patientData.prof_pere}
                    onChange={(e) => updatePatientField('prof_pere', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Milieu Résidence</label>
                  <input
                    type="text"
                    value={patientData.milieu_residence}
                    onChange={(e) => updatePatientField('milieu_residence', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Ville/Village"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 font-medium mb-1">Nb Enfants</label>
                  <input
                    type="text"
                    value={patientData.nb_enfants}
                    onChange={(e) => updatePatientField('nb_enfants', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Liste des Visites (variables - peut en avoir plusieurs) */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-green-800">
                  Visites ({visites.length})
                </h3>
                <button
                  onClick={addVisite}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                >
                  <Plus size={16} />
                  Ajouter une visite
                </button>
              </div>

              <div className="space-y-4">
                {visites.map((visite, index) => (
                  <div key={visite.id} className="p-3 bg-white rounded border border-green-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-700 font-bold">Visite #{index + 1}</span>
                      {visites.length > 1 && (
                        <button
                          onClick={() => removeVisite(index)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="Supprimer cette visite"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {/* Données anthropométriques */}
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Date Consult. *</label>
                        <input
                          type="date"
                          value={visite.date_consult}
                          onChange={(e) => updateVisiteField(index, 'date_consult', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Poids (g) *</label>
                        <input
                          type="number"
                          value={visite.poids_g}
                          onChange={(e) => updateVisiteField(index, 'poids_g', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Taille (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={visite.taille_cm}
                          onChange={(e) => updateVisiteField(index, 'taille_cm', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">PB (mm)</label>
                        <input
                          type="number"
                          value={visite.pb_mm}
                          onChange={(e) => updateVisiteField(index, 'pb_mm', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        />
                      </div>

                      {/* Alimentation */}
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Mode Alim.</label>
                        <select
                          value={visite.mode_alim}
                          onChange={(e) => updateVisiteField(index, 'mode_alim', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="AME">AME</option>
                          <option value="Mixte">Mixte</option>
                          <option value="Artificiel">Artificiel</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Diff. Succion</label>
                        <select
                          value={visite.diff_succion}
                          onChange={(e) => updateVisiteField(index, 'diff_succion', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Fuite Nasale</label>
                        <select
                          value={visite.fuite_nasale}
                          onChange={(e) => updateVisiteField(index, 'fuite_nasale', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Vomissements</label>
                        <select
                          value={visite.vomiss}
                          onChange={(e) => updateVisiteField(index, 'vomiss', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>

                      {/* Prise en charge */}
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Conseil Nutri</label>
                        <select
                          value={visite.conseil_nutri}
                          onChange={(e) => updateVisiteField(index, 'conseil_nutri', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Tech. Spéc.</label>
                        <select
                          value={visite.tech_specifique}
                          onChange={(e) => updateVisiteField(index, 'tech_specifique', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Disp. Spéc.</label>
                        <select
                          value={visite.dispositif_spec}
                          onChange={(e) => updateVisiteField(index, 'dispositif_spec', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Prescription</label>
                        <select
                          value={visite.prescription}
                          onChange={(e) => updateVisiteField(index, 'prescription', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Réf. Nutri</label>
                        <select
                          value={visite.ref_nutri}
                          onChange={(e) => updateVisiteField(index, 'ref_nutri', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>

                      {/* Suivi */}
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Complication</label>
                        <select
                          value={visite.complication}
                          onChange={(e) => updateVisiteField(index, 'complication', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Suivi Programm.</label>
                        <select
                          value={visite.suivi_programme}
                          onChange={(e) => updateVisiteField(index, 'suivi_programme', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-green-700 font-medium mb-1">Perte de Vue</label>
                        <select
                          value={visite.perte_vue}
                          onChange={(e) => updateVisiteField(index, 'perte_vue', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">--</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="NP">NP</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-green-600">
                * Champs obligatoires pour chaque visite
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {visites.length} visite{visites.length > 1 ? 's' : ''} à enregistrer
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !patientData.id_patient || !patientData.nom_prenom || !patientData.date_naissance}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Enregistrer {visites.length > 1 ? `les ${visites.length} visites` : 'la visite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Bouton pour ouvrir le modal d'ajout
 */
export function VisiteAddButton({ onImportComplete, existingPatientIds }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Plus size={18} />
        Ajouter une visite
      </button>

      {isOpen && (
        <VisiteAddModal
          onSave={onImportComplete}
          onClose={() => setIsOpen(false)}
          existingPatientIds={existingPatientIds}
        />
      )}
    </>
  );
}
