import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle, CheckCircle, Eye, Edit3, Plus, Trash2, Image } from 'lucide-react';
import { extractMedicalData, generatePatientId } from '../lib/gemini';

// Clé API depuis les variables d'environnement
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Composant pour importer des fiches médicales via photo ou caméra
 * Utilise Gemini Vision pour extraire les données
 * Permet l'édition avant création
 */
export function ImageImport({ onImportComplete, existingPatientIds = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [editablePatient, setEditablePatient] = useState(null);
  const [editableVisites, setEditableVisites] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Ouvrir le sélecteur de fichiers
  const handleSelectFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Ouvrir la caméra
  const handleOpenCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  // Gérer la sélection de fichiers ou capture caméra
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      setImages(prev => [...prev, ...imageFiles]);
      setError(null);
      setExtractedData(null);
      setEditablePatient(null);
      setEditableVisites([]);
    }
    e.target.value = '';
  }, []);

  // Supprimer une image
  const removeImage = useCallback((index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Lancer l'extraction
  const handleExtract = useCallback(async () => {
    if (!GEMINI_API_KEY) {
      setError('Clé API Gemini non configurée. Ajoutez VITE_GEMINI_API_KEY dans le fichier .env');
      return;
    }

    if (images.length === 0) {
      setError('Veuillez sélectionner au moins une image');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await extractMedicalData(images, GEMINI_API_KEY);
      setExtractedData(data);

      // Préparer les données éditables
      const patientId = data.patient?.nom_prenom
        ? generatePatientId(data.patient.nom_prenom, existingPatientIds)
        : '';

      setEditablePatient({
        id_patient: patientId,
        id_fiche: data.patient?.id_fiche || '',
        nom_prenom: data.patient?.nom_prenom || '',
        date_naissance: data.patient?.date_naissance || '',
        poids_naissance_g: data.patient?.poids_naissance_g || '',
        taille_naissance_cm: data.patient?.taille_naissance_cm || '',
        sexe: data.patient?.sexe || '',
        type_fente: data.patient?.type_fente || '',
        lateralite: data.patient?.lateralite || '',
        severite: data.patient?.severite || '',
        malform_assoc: data.patient?.malform_assoc || '',
        prof_mere: data.patient?.prof_mere || '',
        prof_pere: data.patient?.prof_pere || '',
        milieu_residence: data.patient?.milieu_residence || ''
      });

      setEditableVisites((data.visites || []).map((v, i) => ({
        id: i,
        date_consult: v.date_consult || '',
        poids_g: v.poids_g || '',
        taille_cm: v.taille_cm || '',
        pb_mm: v.pb_mm || ''
      })));

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [images, existingPatientIds]);

  // Mettre à jour un champ patient
  const updatePatientField = useCallback((field, value) => {
    setEditablePatient(prev => ({ ...prev, [field]: value }));
  }, []);

  // Mettre à jour un champ visite
  const updateVisiteField = useCallback((index, field, value) => {
    setEditableVisites(prev => prev.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    ));
  }, []);

  // Ajouter une visite
  const addVisite = useCallback(() => {
    setEditableVisites(prev => [...prev, {
      id: Date.now(),
      date_consult: '',
      poids_g: '',
      taille_cm: '',
      pb_mm: ''
    }]);
  }, []);

  // Supprimer une visite
  const removeVisite = useCallback((index) => {
    setEditableVisites(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Confirmer l'import
  const handleConfirmImport = useCallback(async () => {
    if (!editablePatient) return;

    setIsProcessing(true);

    try {
      // Préparer les visites avec données patient
      let visites = editableVisites.map(v => ({
        ...editablePatient,
        date_consult: v.date_consult,
        poids_g: v.poids_g,
        taille_cm: v.taille_cm,
        pb_mm: v.pb_mm
      }));

      // Si pas de visites, créer une ligne avec juste les données patient
      if (visites.length === 0) {
        visites = [{
          ...editablePatient,
          date_consult: '',
          poids_g: '',
          taille_cm: '',
          pb_mm: ''
        }];
      }

      await onImportComplete(visites);

      // Reset
      setIsOpen(false);
      setImages([]);
      setExtractedData(null);
      setEditablePatient(null);
      setEditableVisites([]);
      setError(null);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [editablePatient, editableVisites, onImportComplete]);

  // Fermer
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setImages([]);
    setExtractedData(null);
    setEditablePatient(null);
    setEditableVisites([]);
    setError(null);
  }, []);

  // Bouton d'ouverture
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Camera size={18} />
        Importer depuis photo
      </button>
    );
  }

  // Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-purple-50">
          <h2 className="text-lg font-bold text-purple-800 flex items-center gap-2">
            <Camera size={24} />
            Importer depuis photo
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Zone upload (si pas encore de données extraites) */}
          {!editablePatient && (
            <>
              {/* Boutons Caméra et Fichiers */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Bouton Caméra */}
                <button
                  onClick={handleOpenCamera}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Camera size={48} className="text-purple-500" />
                  <span className="text-purple-700 font-medium">Prendre une photo</span>
                  <span className="text-xs text-purple-400">Utiliser la caméra</span>
                </button>

                {/* Bouton Fichiers */}
                <button
                  onClick={handleSelectFiles}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Image size={48} className="text-blue-500" />
                  <span className="text-blue-700 font-medium">Choisir une image</span>
                  <span className="text-xs text-blue-400">Depuis la galerie</span>
                </button>
              </div>

              {/* Inputs cachés */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Preview images */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Images ({images.length})</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {/* Bouton ajouter plus */}
                    <button
                      onClick={handleOpenCamera}
                      className="w-full h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50"
                    >
                      <Plus size={24} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Bouton extraction */}
              {images.length > 0 && (
                <button
                  onClick={handleExtract}
                  disabled={isProcessing}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><Loader2 size={20} className="animate-spin" /> Analyse en cours...</>
                  ) : (
                    <><Eye size={20} /> Analyser avec Gemini</>
                  )}
                </button>
              )}
            </>
          )}

          {/* Formulaire d'édition */}
          {editablePatient && (
            <div className="space-y-6">
              {/* Confiance */}
              {extractedData?.confiance && (
                <div className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
                  extractedData.confiance === 'haute' ? 'bg-green-100 text-green-700' :
                  extractedData.confiance === 'moyenne' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <CheckCircle size={16} />
                  Confiance: {extractedData.confiance}
                  {extractedData.notes && <span className="ml-2 text-xs">- {extractedData.notes}</span>}
                </div>
              )}

              {/* Données Patient */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Edit3 size={18} />
                  Données Patient (modifiables)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">ID Patient</label>
                    <input
                      type="text"
                      value={editablePatient.id_patient}
                      onChange={(e) => updatePatientField('id_patient', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">ID Fiche</label>
                    <input
                      type="text"
                      value={editablePatient.id_fiche}
                      onChange={(e) => updatePatientField('id_fiche', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Nom Prénom</label>
                    <input
                      type="text"
                      value={editablePatient.nom_prenom}
                      onChange={(e) => updatePatientField('nom_prenom', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Date Naissance</label>
                    <input
                      type="date"
                      value={editablePatient.date_naissance}
                      onChange={(e) => updatePatientField('date_naissance', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Poids Naiss. (g)</label>
                    <input
                      type="number"
                      value={editablePatient.poids_naissance_g}
                      onChange={(e) => updatePatientField('poids_naissance_g', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Taille Naiss. (cm)</label>
                    <input
                      type="number"
                      value={editablePatient.taille_naissance_cm}
                      onChange={(e) => updatePatientField('taille_naissance_cm', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Sexe</label>
                    <select
                      value={editablePatient.sexe}
                      onChange={(e) => updatePatientField('sexe', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    >
                      <option value="">--</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Type Fente</label>
                    <select
                      value={editablePatient.type_fente}
                      onChange={(e) => updatePatientField('type_fente', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    >
                      <option value="">--</option>
                      <option value="Labiale">Labiale</option>
                      <option value="Palatine">Palatine</option>
                      <option value="Labiopalatine">Labiopalatine</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Latéralité</label>
                    <select
                      value={editablePatient.lateralite}
                      onChange={(e) => updatePatientField('lateralite', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    >
                      <option value="">--</option>
                      <option value="Gauche">Gauche</option>
                      <option value="Droite">Droite</option>
                      <option value="Bilatérale">Bilatérale</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Sévérité</label>
                    <select
                      value={editablePatient.severite}
                      onChange={(e) => updatePatientField('severite', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    >
                      <option value="">--</option>
                      <option value="Complète">Complète</option>
                      <option value="Incomplète">Incomplète</option>
                      <option value="NP">NP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Malf. Assoc.</label>
                    <select
                      value={editablePatient.malform_assoc}
                      onChange={(e) => updatePatientField('malform_assoc', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    >
                      <option value="">--</option>
                      <option value="Oui">Oui</option>
                      <option value="Non">Non</option>
                      <option value="NP">NP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Prof. Mère</label>
                    <input
                      type="text"
                      value={editablePatient.prof_mere}
                      onChange={(e) => updatePatientField('prof_mere', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Prof. Père</label>
                    <input
                      type="text"
                      value={editablePatient.prof_pere}
                      onChange={(e) => updatePatientField('prof_pere', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Lieu Résidence</label>
                    <input
                      type="text"
                      value={editablePatient.milieu_residence}
                      onChange={(e) => updatePatientField('milieu_residence', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                      placeholder="Ville/Village"
                    />
                  </div>
                </div>
              </div>

              {/* Visites */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-green-800 flex items-center gap-2">
                    <Edit3 size={18} />
                    Visites ({editableVisites.length})
                  </h3>
                  <button
                    onClick={addVisite}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-green-700 bg-green-200 rounded hover:bg-green-300"
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>

                {editableVisites.length === 0 ? (
                  <p className="text-sm text-green-600 italic">Aucune visite. Les données patient seront créées sans visite.</p>
                ) : (
                  <div className="space-y-3">
                    {editableVisites.map((visite, index) => (
                      <div key={visite.id} className="flex items-center gap-3 p-2 bg-white rounded border border-green-200">
                        <span className="text-xs text-green-600 font-bold w-6">#{index + 1}</span>
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-green-600">Date</label>
                            <input
                              type="date"
                              value={visite.date_consult}
                              onChange={(e) => updateVisiteField(index, 'date_consult', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-green-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-green-600">Poids (g)</label>
                            <input
                              type="number"
                              value={visite.poids_g}
                              onChange={(e) => updateVisiteField(index, 'poids_g', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-green-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-green-600">Taille (cm)</label>
                            <input
                              type="number"
                              value={visite.taille_cm}
                              onChange={(e) => updateVisiteField(index, 'taille_cm', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-green-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-green-600">PB (mm)</label>
                            <input
                              type="number"
                              value={visite.pb_mm}
                              onChange={(e) => updateVisiteField(index, 'pb_mm', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-green-300 rounded"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeVisite(index)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={() => {
              setExtractedData(null);
              setEditablePatient(null);
              setEditableVisites([]);
              setImages([]);
            }}
            className={`px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50 ${!editablePatient ? 'invisible' : ''}`}
          >
            Recommencer
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            {editablePatient && (
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Créer {Math.max(editableVisites.length, 1)} ligne(s)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
