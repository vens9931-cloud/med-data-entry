/**
 * Service unifié pour l'extraction de données médicales via IA
 * Supporte Gemini (Google) et Grok (xAI)
 */

// URLs des APIs
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Clé pour le localStorage
const AI_CONFIG_KEY = 'ai_config';

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  provider: 'gemini', // 'gemini' ou 'grok'
  geminiKeys: [], // Liste des clés Gemini
  currentGeminiKeyIndex: 0, // Index de la clé Gemini active
  grokKey: '' // Clé Grok
};

/**
 * Charge la configuration depuis le localStorage
 */
export function loadAIConfig() {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      // Migration: si l'ancienne config n'a pas geminiKeys, créer la liste
      if (!config.geminiKeys && config.geminiKey) {
        config.geminiKeys = [config.geminiKey];
        delete config.geminiKey;
      }
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (e) {
    console.error('Erreur chargement config AI:', e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Sauvegarde la configuration dans le localStorage
 */
export function saveAIConfig(config) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Erreur sauvegarde config AI:', e);
  }
}

/**
 * Récupère la clé API active selon le provider
 */
export function getActiveApiKey(config) {
  if (config.provider === 'grok') {
    return config.grokKey;
  }
  // Gemini: retourne la clé à l'index courant
  if (config.geminiKeys.length > 0) {
    const index = Math.min(config.currentGeminiKeyIndex, config.geminiKeys.length - 1);
    return config.geminiKeys[index];
  }
  return '';
}

/**
 * Passe à la clé Gemini suivante (rotation)
 */
export function rotateGeminiKey(config) {
  if (config.geminiKeys.length <= 1) return config;

  const newIndex = (config.currentGeminiKeyIndex + 1) % config.geminiKeys.length;
  const newConfig = { ...config, currentGeminiKeyIndex: newIndex };
  saveAIConfig(newConfig);
  return newConfig;
}

/**
 * Convertit un fichier image en base64
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Détermine le type MIME de l'image
 */
function getMimeType(file) {
  const type = file.type;
  if (type.startsWith('image/')) return type;
  const ext = file.name.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Prompt système pour l'extraction des données médicales
 */
const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'extraction de données médicales depuis des fiches de consultation pour enfants avec fentes orofaciales.

CONTEXTE:
- Les fiches sont du CHU Pédiatrique Charles de Gaulle (Ouagadougou, Burkina Faso)
- Elles contiennent des données patient (identité, type de fente) et des données de visites (poids, taille, date)
- L'écriture est souvent manuscrite et peut être difficile à lire

TYPES DE FICHES:
1. FICHE RECTO (identification): Contient ID, nom, prénom, date naissance, sexe, type de fente, infos parents
2. FICHE VERSO (suivi des visites): Liste de dates avec poids (Pds), taille (T), périmètre brachial (PB)
3. PAGE INTERMÉDIAIRE: Peut contenir des données de suivi additionnelles

FORMAT DES DONNÉES DE VISITE AU VERSO:
- Format typique: "JJ/MM/AAAA Pds= XXXXg T= XXcm PB= XXXmm"
- Le poids peut être en grammes (g) ou kilogrammes (kg) - convertir en grammes
- La taille est en centimètres (cm)
- Le PB (périmètre brachial) est en millimètres (mm)

CHAMPS À EXTRAIRE:

Données fixes (patient):
- id_fiche: Numéro de dossier (format AAAA/XXXXXX)
- nom_prenom: Nom et prénom de l'enfant
- date_naissance: Date de naissance (format AAAA-MM-JJ)
- poids_naissance_g: Poids à la naissance en grammes
- taille_naissance_cm: Taille à la naissance en cm
- sexe: M ou F
- type_fente: "Labiale", "Palatine" ou "Labiopalatine"
- lateralite: "Gauche", "Droite", "Bilatérale" ou "NA"
- severite: "Complète", "Incomplète" ou "NP"
- malform_assoc: "Oui", "Non" ou "NP"
- prof_mere: Profession de la mère
- prof_pere: Profession du père
- milieu_residence: Lieu de résidence actuelle de la mère (ville ou village, ex: "Tangony", "Ouagadougou")

Données variables (par visite):
- date_consult: Date de consultation (format AAAA-MM-JJ)
- poids_g: Poids en grammes (convertir si en kg)
- taille_cm: Taille en centimètres
- pb_mm: Périmètre brachial en millimètres (optionnel)

INSTRUCTIONS:
1. Analyse l'image attentivement
2. Extrais TOUTES les visites si c'est une fiche verso avec plusieurs dates
3. Retourne les données au format JSON strict

RÉPONSE ATTENDUE (JSON uniquement, pas de texte avant ou après):
{
  "type": "recto" | "verso" | "mixte",
  "patient": {
    "id_fiche": "...",
    "nom_prenom": "...",
    "date_naissance": "AAAA-MM-JJ",
    "poids_naissance_g": number | null,
    "taille_naissance_cm": number | null,
    "sexe": "M" | "F" | null,
    "type_fente": "Labiale" | "Palatine" | "Labiopalatine" | null,
    "lateralite": "Gauche" | "Droite" | "Bilatérale" | "NA" | null,
    "severite": "Complète" | "Incomplète" | "NP" | null,
    "malform_assoc": "Oui" | "Non" | "NP" | null,
    "prof_mere": "...",
    "prof_pere": "...",
    "milieu_residence": "string (ville/village)" | null
  },
  "visites": [
    {
      "date_consult": "AAAA-MM-JJ",
      "poids_g": number,
      "taille_cm": number | null,
      "pb_mm": number | null
    }
  ],
  "confiance": "haute" | "moyenne" | "basse",
  "notes": "Remarques sur la qualité de lecture ou incertitudes"
}

Si un champ n'est pas lisible ou absent, mettre null.
Pour les dates, convertir JJ/MM/AAAA en AAAA-MM-JJ.
Pour le poids en kg (ex: 3.200kg), convertir en grammes (3200).`;

/**
 * Extrait les données via Gemini API
 */
async function extractWithGemini(imageFiles, apiKey) {
  const imageParts = await Promise.all(
    imageFiles.map(async (file) => ({
      inline_data: {
        mime_type: getMimeType(file),
        data: await fileToBase64(file)
      }
    }))
  );

  const requestBody = {
    contents: [{
      parts: [
        { text: EXTRACTION_PROMPT },
        ...imageParts,
        { text: "Analyse ces images et extrais les données médicales au format JSON." }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || `Erreur API Gemini: ${response.status}`;

    // Détecter les erreurs de quota
    if (response.status === 429 || errorMessage.includes('quota') || errorMessage.includes('rate')) {
      throw new Error('QUOTA_EXCEEDED:' + errorMessage);
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('Réponse vide de Gemini');
  }

  return responseText;
}

/**
 * Extrait les données via Grok API (xAI)
 */
async function extractWithGrok(imageFiles, apiKey) {
  // Préparer les images en base64 pour Grok
  const imageContents = await Promise.all(
    imageFiles.map(async (file) => ({
      type: 'image_url',
      image_url: {
        url: `data:${getMimeType(file)};base64,${await fileToBase64(file)}`
      }
    }))
  );

  const requestBody = {
    model: 'grok-2-vision-latest',
    messages: [
      {
        role: 'system',
        content: EXTRACTION_PROMPT
      },
      {
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: 'Analyse ces images et extrais les données médicales au format JSON.'
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 8192
  };

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur API Grok: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content;

  if (!responseText) {
    throw new Error('Réponse vide de Grok');
  }

  return responseText;
}

/**
 * Parse le JSON de la réponse (enlève les backticks markdown si présents)
 */
function parseResponseJson(responseText) {
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();
  return JSON.parse(jsonStr);
}

/**
 * Extrait les données médicales depuis une ou plusieurs images
 * Utilise le provider configuré (Gemini ou Grok)
 * @param {File[]} imageFiles - Fichiers images à analyser
 * @param {Object} config - Configuration AI (optionnel, charge depuis localStorage si non fourni)
 * @returns {Promise<Object>} Données extraites
 */
export async function extractMedicalData(imageFiles, config = null) {
  if (!config) {
    config = loadAIConfig();
  }

  const apiKey = getActiveApiKey(config);

  if (!apiKey) {
    const providerName = config.provider === 'grok' ? 'Grok' : 'Gemini';
    throw new Error(`Clé API ${providerName} non configurée. Allez dans Paramètres pour configurer vos clés API.`);
  }

  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Aucune image fournie');
  }

  try {
    let responseText;

    if (config.provider === 'grok') {
      responseText = await extractWithGrok(imageFiles, apiKey);
    } else {
      try {
        responseText = await extractWithGemini(imageFiles, apiKey);
      } catch (error) {
        // Si quota dépassé et qu'on a d'autres clés, essayer la suivante
        if (error.message.startsWith('QUOTA_EXCEEDED:') && config.geminiKeys.length > 1) {
          console.log('Quota Gemini atteint, rotation vers la clé suivante...');
          const newConfig = rotateGeminiKey(config);
          const newApiKey = getActiveApiKey(newConfig);
          responseText = await extractWithGemini(imageFiles, newApiKey);
        } else {
          throw new Error(error.message.replace('QUOTA_EXCEEDED:', ''));
        }
      }
    }

    return parseResponseJson(responseText);

  } catch (error) {
    console.error(`Erreur extraction ${config.provider}:`, error);
    throw error;
  }
}

/**
 * Génère un ID patient à partir du nom
 * Format: NOM_XXX (ex: COMPAORE_001)
 */
export function generatePatientId(nomPrenom, existingIds = []) {
  if (!nomPrenom) return '';

  const nom = nomPrenom.split(' ')[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sameNameIds = existingIds.filter(id => id.startsWith(nom + '_'));
  const nextNumber = sameNameIds.length + 1;

  return `${nom}_${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Teste une clé API Gemini
 */
export async function testGeminiApiKey(apiKey) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Test' }] }]
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Teste une clé API Grok
 */
export async function testGrokApiKey(apiKey) {
  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 10
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Retourne le nom du provider actif
 */
export function getProviderName(config) {
  return config.provider === 'grok' ? 'Grok (xAI)' : 'Gemini (Google)';
}
