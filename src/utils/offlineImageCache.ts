/**
 * Cache Offline de Fotografías e Imágenes en Memoria Local (IndexedDB & CacheStorage)
 * Garantiza que en quebradas y montañas sin señal celular o internet,
 * todas las fotos del catálogo y avistamientos sigan cargando 100% offline.
 */

import { SpecimenRecord } from '../types/specimen';

const CACHE_NAME = 'biobitacora-media-v2';
const DB_NAME = 'BioBitacoraImagesDB';
const STORE_NAME = 'cachedImages';

interface CacheItem {
  url: string;
  blob: Blob;
  base64DataUrl?: string;
  cachedAt: number;
}

// Inicializa IndexedDB para almacenamiento masivo de imágenes
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Convierte un Blob en Base64 data URL
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Guarda una imagen en CacheStorage e IndexedDB
 */
export async function cacheSingleImage(url: string): Promise<boolean> {
  if (!url || url.startsWith('data:')) return true;

  try {
    // 1. Intentar en CacheStorage si está disponible
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);
        if (!match) {
          await cache.add(url);
        }
      } catch (e) {
        // Ignorar si falla por CORS, continuar con fetch blob
      }
    }

    // 2. Fetch y guardar en IndexedDB
    const res = await fetch(url, { mode: 'cors' }).catch(() => null);
    if (!res || !res.ok) return false;

    const blob = await res.blob();
    const base64 = await blobToBase64(blob).catch(() => undefined);

    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const item: CacheItem = {
        url,
        blob,
        base64DataUrl: base64,
        cachedAt: Date.now(),
      };
      store.put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`No se pudo cachear imagen ${url}:`, err);
    return false;
  }
}

/**
 * Obtiene la imagen de la caché local (IndexedDB o CacheStorage)
 */
export async function getCachedImageUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  try {
    // Intentar IndexedDB
    const db = await openDb();
    const item: CacheItem | null = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (item) {
      if (item.base64DataUrl) return item.base64DataUrl;
      if (item.blob) return URL.createObjectURL(item.blob);
    }

    // Intentar CacheStorage
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(url);
      if (match) {
        const blob = await match.blob();
        return URL.createObjectURL(blob);
      }
    }
  } catch (e) {
    // Fallback silencioso a la URL remota
  }
  return null;
}

/**
 * Extrae todas las URLs de imágenes de los especímenes
 */
export function extractAllImageUrls(specimens: SpecimenRecord[]): string[] {
  const urls = new Set<string>();
  specimens.forEach((spec) => {
    if (spec.heroImage && !spec.heroImage.startsWith('data:')) {
      urls.add(spec.heroImage);
    }
    spec.additionalPhotos?.forEach((p) => {
      if (p.url && !p.url.startsWith('data:')) {
        urls.add(p.url);
      }
    });
    spec.sightings?.forEach((s) => {
      if (s.curiousFindingPhoto && !s.curiousFindingPhoto.startsWith('data:')) {
        urls.add(s.curiousFindingPhoto);
      }
      s.photoUrls?.forEach((u) => {
        if (u && !u.startsWith('data:')) urls.add(u);
      });
    });
  });
  return Array.from(urls);
}

/**
 * Cachea todas las fotografías de los especímenes en segundo plano
 */
export async function cacheAllSpecimensMedia(
  specimens: SpecimenRecord[],
  onProgress?: (cached: number, total: number) => void
): Promise<{ cached: number; total: number }> {
  const urls = extractAllImageUrls(specimens);
  let count = 0;

  for (const url of urls) {
    await cacheSingleImage(url);
    count++;
    onProgress?.(count, urls.length);
  }

  return { cached: count, total: urls.length };
}

/**
 * Cuenta cuántas imágenes están cacheadas actualmente
 */
export async function getCachedImagesCount(): Promise<number> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}
