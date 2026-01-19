import React, { useState, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

/**
 * Modal pour éditer une visite existante
 */
export function VisiteEditModal({ visite, onSave, onClose }) {
  const [formData, setFormData] = useState({ ...visite });
  const [isSaving, setIsSaving] = useState(false);

  // Mettre à jour un champ
  const updateField = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Sauvegarder les modifications
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h2 className="text-lg font-bold text-blue-800">
            Modifier la visite - {formData.nom_prenom || 'Patient'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">

            {/* Données fixes (lecture seule) */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700 mb-3">Informations Patient (lecture seule)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">ID Patient:</span>
                  <div className="font-medium">{formData.id_patient || '-'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Nom Prénom:</span>
                  <div className="font-medium">{formData.nom_prenom || '-'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Date Naissance:</span>
                  <div className="font-medium">{formData.date_naissance || '-'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Sexe:</span>
                  <div className="font-medium">{formData.sexe || '-'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Type Fente:</span>
                  <div className="font-medium">{formData.type_fente || '-'}</div>
                </div>
              </div>
            </div>

            {/* Données variables (modifiables) */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3">Données de la Visite</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Données anthropométriques */}
                <div>
                  <label className="block text-xs text-green-700 font-medium mb-1">Date Consult. *</label>
                  <input
                    type="date"
                    value={formData.date_consult || ''}
                    onChange={(e) => updateField('date_consult', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-green-700 font-medium mb-1">Poids (g) *</label>
                  <input
                    type="number"
                    value={formData.poids_g || ''}
                    onChange={(e) => updateField('poids_g', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-green-700 font-medium mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.taille_cm || ''}
                    onChange={(e) => updateField('taille_cm', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-green-700 font-medium mb-1">PB (mm)</label>
                  <input
                    type="number"
                    value={formData.pb_mm || ''}
                    onChange={(e) => updateField('pb_mm', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  />
                </div>

                {/* Alimentation */}
                <div>
                  <label className="block text-xs text-green-700 font-medium mb-1">Mode Alim.</label>
                  <select
                    value={formData.mode_alim || ''}
                    onChange={(e) => updateField('mode_alim', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.diff_succion || ''}
                    onChange={(e) => updateField('diff_succion', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.fuite_nasale || ''}
                    onChange={(e) => updateField('fuite_nasale', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.vomiss || ''}
                    onChange={(e) => updateField('vomiss', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.conseil_nutri || ''}
                    onChange={(e) => updateField('conseil_nutri', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.tech_specifique || ''}
                    onChange={(e) => updateField('tech_specifique', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.dispositif_spec || ''}
                    onChange={(e) => updateField('dispositif_spec', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.prescription || ''}
                    onChange={(e) => updateField('prescription', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.ref_nutri || ''}
                    onChange={(e) => updateField('ref_nutri', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.complication || ''}
                    onChange={(e) => updateField('complication', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.suivi_programme || ''}
                    onChange={(e) => updateField('suivi_programme', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                    value={formData.perte_vue || ''}
                    onChange={(e) => updateField('perte_vue', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="">--</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                    <option value="NP">NP</option>
                  </select>
                </div>
              </div>

              <p className="mt-3 text-xs text-green-600">
                * Champs obligatoires
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.date_consult || !formData.poids_g}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
