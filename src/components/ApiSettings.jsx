import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Key, Plus, Trash2, Check, X, Loader2, AlertCircle, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  loadAIConfig,
  saveAIConfig,
  testGeminiApiKey,
  testGrokApiKey,
  getProviderName
} from '../lib/aiService';

/**
 * Composant pour configurer les clés API (Gemini et Grok)
 */
export function ApiSettings({ onClose }) {
  const [config, setConfig] = useState(loadAIConfig());
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [newGrokKey, setNewGrokKey] = useState('');
  const [testingKey, setTestingKey] = useState(null); // 'gemini-0', 'gemini-1', 'grok', etc.
  const [testResults, setTestResults] = useState({}); // { 'gemini-0': true/false, ... }
  const [isSaving, setIsSaving] = useState(false);

  // Charger la config au montage
  useEffect(() => {
    setConfig(loadAIConfig());
  }, []);

  // Changer le provider actif
  const toggleProvider = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      provider: prev.provider === 'gemini' ? 'grok' : 'gemini'
    }));
  }, []);

  // Ajouter une clé Gemini
  const addGeminiKey = useCallback(() => {
    if (!newGeminiKey.trim()) return;
    setConfig(prev => ({
      ...prev,
      geminiKeys: [...prev.geminiKeys, newGeminiKey.trim()]
    }));
    setNewGeminiKey('');
  }, [newGeminiKey]);

  // Supprimer une clé Gemini
  const removeGeminiKey = useCallback((index) => {
    setConfig(prev => {
      const newKeys = prev.geminiKeys.filter((_, i) => i !== index);
      // Ajuster l'index courant si nécessaire
      let newIndex = prev.currentGeminiKeyIndex;
      if (newIndex >= newKeys.length) {
        newIndex = Math.max(0, newKeys.length - 1);
      }
      return {
        ...prev,
        geminiKeys: newKeys,
        currentGeminiKeyIndex: newIndex
      };
    });
    // Supprimer le résultat de test correspondant
    setTestResults(prev => {
      const newResults = { ...prev };
      delete newResults[`gemini-${index}`];
      return newResults;
    });
  }, []);

  // Définir la clé Gemini active
  const setActiveGeminiKey = useCallback((index) => {
    setConfig(prev => ({
      ...prev,
      currentGeminiKeyIndex: index
    }));
  }, []);

  // Mettre à jour la clé Grok
  const updateGrokKey = useCallback((value) => {
    setConfig(prev => ({
      ...prev,
      grokKey: value
    }));
  }, []);

  // Tester une clé Gemini
  const testGemini = useCallback(async (key, index) => {
    const testId = `gemini-${index}`;
    setTestingKey(testId);
    try {
      const isValid = await testGeminiApiKey(key);
      setTestResults(prev => ({ ...prev, [testId]: isValid }));
    } catch {
      setTestResults(prev => ({ ...prev, [testId]: false }));
    }
    setTestingKey(null);
  }, []);

  // Tester la clé Grok
  const testGrok = useCallback(async () => {
    if (!config.grokKey) return;
    setTestingKey('grok');
    try {
      const isValid = await testGrokApiKey(config.grokKey);
      setTestResults(prev => ({ ...prev, grok: isValid }));
    } catch {
      setTestResults(prev => ({ ...prev, grok: false }));
    }
    setTestingKey(null);
  }, [config.grokKey]);

  // Sauvegarder la configuration
  const handleSave = useCallback(() => {
    setIsSaving(true);
    saveAIConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      onClose?.();
    }, 500);
  }, [config, onClose]);

  // Masquer une clé API pour l'affichage
  const maskKey = (key) => {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Settings size={24} />
            Configuration des API IA
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Sélection du provider */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-700 mb-3">Provider actif</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleProvider}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
              >
                {config.provider === 'gemini' ? (
                  <ToggleLeft size={32} className="text-blue-500" />
                ) : (
                  <ToggleRight size={32} className="text-purple-500" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-gray-800">{getProviderName(config)}</div>
                  <div className="text-xs text-gray-500">Cliquer pour changer</div>
                </div>
              </button>

              <div className="flex-1 text-sm text-gray-600">
                {config.provider === 'gemini' ? (
                  <p>Gemini de Google - Limites de quota (gratuit)</p>
                ) : (
                  <p>Grok de xAI - Pas de limite de quota</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Gemini */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                <Key size={18} />
                Clés API Gemini ({config.geminiKeys.length})
              </h3>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Obtenir une clé <ExternalLink size={12} />
              </a>
            </div>

            {/* Liste des clés Gemini */}
            <div className="space-y-2 mb-3">
              {config.geminiKeys.length === 0 ? (
                <p className="text-sm text-blue-600 italic">Aucune clé configurée</p>
              ) : (
                config.geminiKeys.map((key, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      index === config.currentGeminiKeyIndex
                        ? 'bg-blue-100 border-blue-400'
                        : 'bg-white border-blue-200'
                    }`}
                  >
                    <button
                      onClick={() => setActiveGeminiKey(index)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        index === config.currentGeminiKeyIndex
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {index === config.currentGeminiKeyIndex && (
                        <Check size={12} className="text-white" />
                      )}
                    </button>

                    <span className="flex-1 font-mono text-sm text-gray-600">
                      {maskKey(key)}
                    </span>

                    {/* Résultat du test */}
                    {testResults[`gemini-${index}`] !== undefined && (
                      testResults[`gemini-${index}`] ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500" />
                      )
                    )}

                    <button
                      onClick={() => testGemini(key, index)}
                      disabled={testingKey === `gemini-${index}`}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50"
                    >
                      {testingKey === `gemini-${index}` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Tester'
                      )}
                    </button>

                    <button
                      onClick={() => removeGeminiKey(index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Ajouter une nouvelle clé Gemini */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newGeminiKey}
                onChange={(e) => setNewGeminiKey(e.target.value)}
                placeholder="Coller une nouvelle clé Gemini..."
                className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={addGeminiKey}
                disabled={!newGeminiKey.trim()}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>

            <p className="mt-2 text-xs text-blue-600">
              Vous pouvez ajouter plusieurs clés. En cas de quota atteint, la clé suivante sera utilisée automatiquement.
            </p>
          </div>

          {/* Section Grok */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                <Key size={18} />
                Clé API Grok (xAI)
              </h3>
              <a
                href="https://console.x.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                Obtenir une clé <ExternalLink size={12} />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={config.grokKey}
                onChange={(e) => updateGrokKey(e.target.value)}
                placeholder="Coller votre clé Grok..."
                className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />

              {/* Résultat du test */}
              {testResults.grok !== undefined && (
                testResults.grok ? (
                  <div className="flex items-center px-2 text-green-600">
                    <Check size={16} />
                  </div>
                ) : (
                  <div className="flex items-center px-2 text-red-600">
                    <AlertCircle size={16} />
                  </div>
                )
              )}

              <button
                onClick={testGrok}
                disabled={!config.grokKey || testingKey === 'grok'}
                className="px-3 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-100 disabled:opacity-50"
              >
                {testingKey === 'grok' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Tester'
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-purple-600">
              Grok n'a pas de limite de quota contrairement à Gemini gratuit.
            </p>
          </div>

          {/* Info sur le provider actif */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <p className="text-sm text-gray-600">
              <strong>Provider actif:</strong> {getProviderName(config)}
              {config.provider === 'gemini' && config.geminiKeys.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  (Clé {config.currentGeminiKeyIndex + 1}/{config.geminiKeys.length})
                </span>
              )}
            </p>
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
            disabled={isSaving}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
