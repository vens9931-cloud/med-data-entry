/**
 * Service de synchronisation d'images entre téléphone et PC
 * Utilise Supabase Storage pour le transfert
 */

import { supabase } from './supabase';

const BUCKET_NAME = 'fiches-temp';
const SESSION_EXPIRY_HOURS = 1;

/**
 * Génère un ID de session unique
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée l'URL de la page mobile pour upload
 */
export function getMobileUploadUrl(sessionId) {
  // Utilise l'URL actuelle comme base
  const baseUrl = window.location.origin;
  return `${baseUrl}/mobile-upload.html?session=${sessionId}`;
}

/**
 * Upload une image vers Supabase Storage
 */
export async function uploadImage(sessionId, file) {
  const fileName = `${sessionId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Erreur upload: ${error.message}`);
  }

  return data.path;
}

/**
 * Liste les images d'une session
 */
export async function listSessionImages(sessionId) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(sessionId);

  if (error) {
    // Si le dossier n'existe pas encore, retourner vide
    if (error.message.includes('not found')) {
      return [];
    }
    throw new Error(`Erreur liste: ${error.message}`);
  }

  return data || [];
}

/**
 * Récupère l'URL publique d'une image
 */
export function getImageUrl(path) {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Télécharge une image comme File object
 */
export async function downloadImageAsFile(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(path);

  if (error) {
    throw new Error(`Erreur téléchargement: ${error.message}`);
  }

  // Convertir le Blob en File
  const fileName = path.split('/').pop();
  return new File([data], fileName, { type: data.type });
}

/**
 * Supprime les images d'une session
 */
export async function clearSession(sessionId) {
  const images = await listSessionImages(sessionId);

  if (images.length > 0) {
    const paths = images.map(img => `${sessionId}/${img.name}`);
    await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);
  }
}

/**
 * Écoute les nouvelles images d'une session (polling)
 */
export function subscribeToSession(sessionId, onNewImage, intervalMs = 2000) {
  let knownImages = new Set();
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const images = await listSessionImages(sessionId);

      for (const img of images) {
        if (!knownImages.has(img.name)) {
          knownImages.add(img.name);
          const path = `${sessionId}/${img.name}`;
          onNewImage(path);
        }
      }
    } catch (err) {
      console.error('Erreur polling:', err);
    }

    if (isActive) {
      setTimeout(poll, intervalMs);
    }
  };

  // Démarrer le polling
  poll();

  // Retourner une fonction pour arrêter
  return () => {
    isActive = false;
  };
}
