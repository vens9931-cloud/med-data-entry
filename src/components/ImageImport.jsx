import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle, CheckCircle, Eye, Edit3, Plus, Trash2, Image, Smartphone, Monitor, Settings } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { extractMedicalData, generatePatientId, loadAIConfig, getProviderName, getActiveApiKey } from '../lib/aiService';
import { generateSessionId, getMobileUploadUrl, listSessionImages, downloadImageAsFile, clearSession, subscribeToSession } from '../lib/imageSync';
import { ApiSettings } from './ApiSettings';

/**
 * Composant pour importer des fiches médicales via photo, caméra ou téléphone
 */
export function ImageImport({ onImportComplete, existingPatientIds = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'local' ou 'phone'
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [editablePatient, setEditablePatient] = useState(null);
  const [editableVisites, setEditableVisites] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // État pour le mode téléphone
  const [sessionId, setSessionId] = useState(null);
  const [mobileUrl, setMobileUrl] = useState('');
  const [receivedImages, setReceivedImages] = useState([]);
  const unsubscribeRef = useRef(null);

  // État pour les paramètres API
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState(loadAIConfig());

  // Démarrer une session mobile
  const startMobileSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setMobileUrl(getMobileUploadUrl(newSessionId));
    setReceivedImages([]);
    setMode('phone');

    // Écouter les nouvelles images
    unsubscribeRef.current = subscribeToSession(newSessionId, async (path) => {
      try {
        const file = await downloadImageAsFile(path);
        setReceivedImages(prev => [...prev, file]);
      } catch (err) {
        console.error('Erreur réception image:', err);
      }
    });
  }, []);

  // Arrêter la session mobile
  const stopMobileSession = useCallback(async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (sessionId) {
      try {
        await clearSession(sessionId);
      } catch (err) {
        console.error('Erreur nettoyage session:', err);
      }
    }
    setSessionId(null);
    setMobileUrl('');
  }, [sessionId]);

  // Utiliser les images reçues du téléphone
  const useReceivedImages = useCallback(() => {
    setImages(receivedImages);
    stopMobileSession();
    setMode('local');
  }, [receivedImages, stopMobileSession]);

  // Cleanup à la fermeture
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Ouvrir le sélecteur de fichiers
  const handleSelectFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Ouvrir la caméra
  const handleOpenCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  // Gérer la sélection de fichiers
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      setImages(prev => [...prev, ...imageFiles]);
      setError(null);
    }
    e.target.value = '';
  }, []);

  // Supprimer une image
  const removeImage = useCallback((index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Recharger la config API quand les paramètres sont fermés
  const handleApiSettingsClose = useCallback(() => {
    setShowApiSettings(false);
    setAiConfig(loadAIConfig());
  }, []);

  // Lancer l'extraction
  const handleExtract = useCallback(async () => {
    const currentConfig = loadAIConfig();
    const apiKey = getActiveApiKey(currentConfig);

    if (!apiKey) {
      setError(`Aucune clé API ${currentConfig.provider === 'grok' ? 'Grok' : 'Gemini'} configurée. Cliquez sur "Paramètres API" pour en ajouter une.`);
      return;
    }

    if (images.length === 0) {
      setError('Veuillez sélectionner au moins une image');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await extractMedicalData(images, currentConfig);
      setExtractedData(data);
      setAiConfig(loadAIConfig()); // Recharger au cas où la clé a été rotée

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
      let visites = editableVisites.map(v => ({
        ...editablePatient,
        // Données variables
        date_consult: v.date_consult,
        poids_g: v.poids_g,
        taille_cm: v.taille_cm,
        pb_mm: v.pb_mm,
        mode_alim: v.mode_alim,
        diff_succion: v.diff_succion,
        fuite_nasale: v.fuite_nasale,
        vomiss: v.vomiss,
        conseil_nutri: v.conseil_nutri,
        tech_specifique: v.tech_specifique,
        dispositif_spec: v.dispositif_spec,
        prescription: v.prescription,
        ref_nutri: v.ref_nutri,
        complication: v.complication,
        suivi_programme: v.suivi_programme,
        perte_vue: v.perte_vue
      }));

      if (visites.length === 0) {
        visites = [{
          ...editablePatient,
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
        }];
      }

      await onImportComplete(visites);

      // Reset complet
      handleClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [editablePatient, editableVisites, onImportComplete]);

  // Fermer et reset
  const handleClose = useCallback(() => {
    stopMobileSession();
    setIsOpen(false);
    setMode(null);
    setImages([]);
    setExtractedData(null);
    setEditablePatient(null);
    setEditableVisites([]);
    setError(null);
    setReceivedImages([]);
  }, [stopMobileSession]);

  // Recommencer
  const handleRestart = useCallback(() => {
    setExtractedData(null);
    setEditablePatient(null);
    setEditableVisites([]);
    setImages([]);
    setMode(null);
    setReceivedImages([]);
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
          <button onClick={handleClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Choix du mode */}
          {!mode && !editablePatient && (
            <div className="grid grid-cols-2 gap-4">
              {/* Mode PC */}
              <button
                onClick={() => setMode('local')}
                className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Monitor size={56} className="text-blue-500" />
                <span className="text-blue-700 font-semibold text-lg">Sur ce PC</span>
                <span className="text-sm text-blue-400 text-center">Prendre une photo ou choisir un fichier</span>
              </button>

              {/* Mode Téléphone */}
              <button
                onClick={startMobileSession}
                className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <Smartphone size={56} className="text-purple-500" />
                <span className="text-purple-700 font-semibold text-lg">Depuis téléphone</span>
                <span className="text-sm text-purple-400 text-center">Scanner le QR code avec votre téléphone</span>
              </button>
            </div>
          )}

          {/* Mode Téléphone - QR Code */}
          {mode === 'phone' && !editablePatient && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Scannez ce QR code avec votre téléphone</h3>

              <div className="p-4 bg-white border-4 border-purple-200 rounded-2xl shadow-lg">
                <QRCodeSVG value={mobileUrl} size={200} />
              </div>

              <p className="mt-4 text-sm text-gray-500 text-center max-w-md">
                Ouvrez l'appareil photo de votre téléphone et pointez vers le QR code.
                Vous pourrez prendre des photos qui apparaîtront ici.
              </p>

              {/* Images reçues */}
              {receivedImages.length > 0 && (
                <div className="mt-6 w-full">
                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    {receivedImages.length} image(s) reçue(s)
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {receivedImages.map((file, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-green-300">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Reçue ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={useReceivedImages}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle size={20} />
                    Utiliser ces images
                  </button>
                </div>
              )}

              <button
                onClick={() => { stopMobileSession(); setMode(null); }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                ← Retour
              </button>
            </div>
          )}

          {/* Mode Local - Upload */}
          {mode === 'local' && !editablePatient && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={handleOpenCamera}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Camera size={48} className="text-purple-500" />
                  <span className="text-purple-700 font-medium">Prendre une photo</span>
                </button>

                <button
                  onClick={handleSelectFiles}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Image size={48} className="text-blue-500" />
                  <span className="text-blue-700 font-medium">Choisir une image</span>
                </button>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

              {images.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Images ({images.length})</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((file, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img src={URL.createObjectURL(file)} alt={`Image ${index + 1}`} className="w-full h-full object-cover rounded-lg border" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button onClick={handleOpenCamera} className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400">
                      <Plus size={24} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              )}

              {images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleExtract}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <><Loader2 size={20} className="animate-spin" /> Analyse en cours...</>
                    ) : (
                      <><Eye size={20} /> Analyser avec {getProviderName(aiConfig)}</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowApiSettings(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Settings size={16} /> Paramètres API
                  </button>
                </div>
              )}

              <button onClick={() => setMode(null)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">← Retour</button>
            </>
          )}

          {/* Formulaire d'édition */}
          {editablePatient && (
            <div className="space-y-6">
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
                  <Edit3 size={18} /> Données Patient
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'id_patient', label: 'ID Patient', type: 'text' },
                    { key: 'id_fiche', label: 'ID Fiche', type: 'text' },
                    { key: 'nom_prenom', label: 'Nom Prénom', type: 'text' },
                    { key: 'date_naissance', label: 'Date Naissance', type: 'date' },
                    { key: 'poids_naissance_g', label: 'Poids Naiss. (g)', type: 'number' },
                    { key: 'taille_naissance_cm', label: 'Taille Naiss. (cm)', type: 'number' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-blue-600 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={editablePatient[field.key]}
                        onChange={(e) => updatePatientField(field.key, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Sexe</label>
                    <select value={editablePatient.sexe} onChange={(e) => updatePatientField('sexe', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded">
                      <option value="">--</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Type Fente</label>
                    <select value={editablePatient.type_fente} onChange={(e) => updatePatientField('type_fente', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded">
                      <option value="">--</option>
                      <option value="Labiale">Labiale</option>
                      <option value="Palatine">Palatine</option>
                      <option value="Labiopalatine">Labiopalatine</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Latéralité</label>
                    <select value={editablePatient.lateralite} onChange={(e) => updatePatientField('lateralite', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded">
                      <option value="">--</option>
                      <option value="Gauche">Gauche</option>
                      <option value="Droite">Droite</option>
                      <option value="Bilatérale">Bilatérale</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Sévérité</label>
                    <select value={editablePatient.severite} onChange={(e) => updatePatientField('severite', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded">
                      <option value="">--</option>
                      <option value="Complète">Complète</option>
                      <option value="Incomplète">Incomplète</option>
                      <option value="NP">NP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Malf. Assoc.</label>
                    <select value={editablePatient.malform_assoc} onChange={(e) => updatePatientField('malform_assoc', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded">
                      <option value="">--</option>
                      <option value="Oui">Oui</option>
                      <option value="Non">Non</option>
                      <option value="NP">NP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Prof. Mère</label>
                    <input type="text" value={editablePatient.prof_mere} onChange={(e) => updatePatientField('prof_mere', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded" />
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Prof. Père</label>
                    <input type="text" value={editablePatient.prof_pere} onChange={(e) => updatePatientField('prof_pere', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded" />
                  </div>

                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Lieu Résidence</label>
                    <input type="text" value={editablePatient.milieu_residence} onChange={(e) => updatePatientField('milieu_residence', e.target.value)} className="w-full px-2 py-1 text-sm border border-blue-300 rounded" placeholder="Ville/Village" />
                  </div>
                </div>
              </div>

              {/* Visites */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-green-800 flex items-center gap-2">
                    <Edit3 size={18} /> Visites ({editableVisites.length})
                  </h3>
                  <button onClick={addVisite} className="flex items-center gap-1 px-2 py-1 text-sm text-green-700 bg-green-200 rounded hover:bg-green-300">
                    <Plus size={14} /> Ajouter
                  </button>
                </div>

                {editableVisites.length === 0 ? (
                  <p className="text-sm text-green-600 italic">Aucune visite.</p>
                ) : (
                  <div className="space-y-4">
                    {editableVisites.map((visite, index) => (
                      <div key={visite.id} className="p-3 bg-white rounded border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-green-700 font-bold">Visite #{index + 1}</span>
                          <button onClick={() => removeVisite(index)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {/* Données anthropométriques */}
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Date Consult.</label>
                            <input type="date" value={visite.date_consult} onChange={(e) => updateVisiteField(index, 'date_consult', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Poids (g)</label>
                            <input type="number" value={visite.poids_g} onChange={(e) => updateVisiteField(index, 'poids_g', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Taille (cm)</label>
                            <input type="number" value={visite.taille_cm} onChange={(e) => updateVisiteField(index, 'taille_cm', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">PB (mm)</label>
                            <input type="number" value={visite.pb_mm} onChange={(e) => updateVisiteField(index, 'pb_mm', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded" />
                          </div>

                          {/* Alimentation */}
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Mode Alim.</label>
                            <select value={visite.mode_alim || ''} onChange={(e) => updateVisiteField(index, 'mode_alim', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="AME">AME</option>
                              <option value="Mixte">Mixte</option>
                              <option value="Artificiel">Artificiel</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Diff. Succion</label>
                            <select value={visite.diff_succion || ''} onChange={(e) => updateVisiteField(index, 'diff_succion', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Fuite Nasale</label>
                            <select value={visite.fuite_nasale || ''} onChange={(e) => updateVisiteField(index, 'fuite_nasale', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Vomissements</label>
                            <select value={visite.vomiss || ''} onChange={(e) => updateVisiteField(index, 'vomiss', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>

                          {/* Prise en charge */}
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Conseil Nutri</label>
                            <select value={visite.conseil_nutri || ''} onChange={(e) => updateVisiteField(index, 'conseil_nutri', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Tech. Spéc.</label>
                            <select value={visite.tech_specifique || ''} onChange={(e) => updateVisiteField(index, 'tech_specifique', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Disp. Spéc.</label>
                            <select value={visite.dispositif_spec || ''} onChange={(e) => updateVisiteField(index, 'dispositif_spec', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Prescription</label>
                            <select value={visite.prescription || ''} onChange={(e) => updateVisiteField(index, 'prescription', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Réf. Nutri</label>
                            <select value={visite.ref_nutri || ''} onChange={(e) => updateVisiteField(index, 'ref_nutri', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>

                          {/* Suivi */}
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Complication</label>
                            <select value={visite.complication || ''} onChange={(e) => updateVisiteField(index, 'complication', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Suivi Programm.</label>
                            <select value={visite.suivi_programme || ''} onChange={(e) => updateVisiteField(index, 'suivi_programme', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
                              <option value="">--</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="NP">NP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-600 mb-1">Perte de Vue</label>
                            <select value={visite.perte_vue || ''} onChange={(e) => updateVisiteField(index, 'perte_vue', e.target.value)} className="w-full px-2 py-1 text-sm border border-green-300 rounded">
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
            onClick={handleRestart}
            className={`px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50 ${!editablePatient && !mode ? 'invisible' : ''}`}
          >
            Recommencer
          </button>
          <div className="flex gap-3">
            <button onClick={handleClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            {editablePatient && (
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Créer {Math.max(editableVisites.length, 1)} ligne(s)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal des paramètres API */}
      {showApiSettings && (
        <ApiSettings onClose={handleApiSettingsClose} />
      )}
    </div>
  );
}
