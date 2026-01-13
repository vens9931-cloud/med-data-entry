/**
 * Service Gemini API pour l'extraction de données depuis des images de fiches médicales
 * Utilise Gemini 1.5 Flash (gratuit) avec capacité vision
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Convertit un fichier image en base64
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Retirer le préfixe "data:image/...;base64,"
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
  // Fallback basé sur l'extension
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
 * Extrait les données médicales depuis une ou plusieurs images
 * @param {File[]} imageFiles - Fichiers images à analyser
 * @param {string} apiKey - Clé API Gemini
 * @returns {Promise<Object>} Données extraites
 */
export async function extractMedicalData(imageFiles, apiKey) {
  if (!apiKey) {
    throw new Error('Clé API Gemini requise. Obtenez-la sur https://aistudio.google.com/app/apikey');
  }

  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Aucune image fournie');
  }

  try {
    // Préparer les images en base64
    const imageParts = await Promise.all(
      imageFiles.map(async (file) => ({
        inline_data: {
          mime_type: getMimeType(file),
          data: await fileToBase64(file)
        }
      }))
    );

    // Construire la requête
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

    // Appel API
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
    }

    const data = await response.json();

    // Extraire le texte de la réponse
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Réponse vide de Gemini');
    }

    // Parser le JSON (enlever les éventuels backticks markdown)
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

    const extractedData = JSON.parse(jsonStr);

    return extractedData;

  } catch (error) {
    console.error('Erreur extraction Gemini:', error);
    throw error;
  }
}

/**
 * Génère un ID patient à partir du nom
 * Format: NOM_XXX (ex: COMPAORE_001)
 */
export function generatePatientId(nomPrenom, existingIds = []) {
  if (!nomPrenom) return '';

  // Extraire le nom de famille (premier mot)
  const nom = nomPrenom.split(' ')[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Compter les patients existants avec ce nom
  const sameNameIds = existingIds.filter(id => id.startsWith(nom + '_'));
  const nextNumber = sameNameIds.length + 1;

  return `${nom}_${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Vérifie si la clé API Gemini est valide
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
