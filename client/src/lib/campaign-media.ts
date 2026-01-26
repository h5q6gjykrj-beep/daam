const DB_NAME = 'daam_media_db_v1';
const STORE_NAME = 'campaign_media';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  
  return dbPromise;
}

export async function saveCampaignMedia(blob: Blob): Promise<string> {
  const db = await openDB();
  const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id: mediaId, blob });
    
    request.onsuccess = () => resolve(mediaId);
    request.onerror = () => reject(new Error('Failed to save media'));
  });
}

export async function getCampaignMedia(mediaId: string): Promise<Blob | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(mediaId);
    
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.blob : null);
    };
    request.onerror = () => reject(new Error('Failed to get media'));
  });
}

export async function deleteCampaignMedia(mediaId: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(mediaId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete media'));
  });
}

interface VideoValidationSuccess {
  ok: true;
  meta: {
    mime: string;
    durationSec: number;
    sizeBytes: number;
  };
}

interface VideoValidationFailure {
  ok: false;
  reason: string;
}

type VideoValidationResult = VideoValidationSuccess | VideoValidationFailure;

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_DURATION_SEC = 10;
const ALLOWED_MIMES = ['video/mp4', 'video/webm'];

export async function validateCampaignVideo(file: File): Promise<VideoValidationResult> {
  if (!ALLOWED_MIMES.includes(file.type)) {
    return {
      ok: false,
      reason: `Invalid video format. Allowed: ${ALLOWED_MIMES.join(', ')}`
    };
  }
  
  if (file.size > MAX_SIZE_BYTES) {
    return {
      ok: false,
      reason: `Video size exceeds 8MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
    };
  }
  
  try {
    const durationSec = await getVideoDuration(file);
    
    if (durationSec > MAX_DURATION_SEC) {
      return {
        ok: false,
        reason: `Video duration exceeds 10 seconds (${durationSec.toFixed(1)}s)`
      };
    }
    
    return {
      ok: true,
      meta: {
        mime: file.type,
        durationSec: Math.round(durationSec * 10) / 10,
        sizeBytes: file.size
      }
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'Failed to read video duration'
    };
  }
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = url;
  });
}

export const VIDEO_VALIDATION_LIMITS = {
  maxSizeBytes: MAX_SIZE_BYTES,
  maxDurationSec: MAX_DURATION_SEC,
  allowedMimes: ALLOWED_MIMES
};
