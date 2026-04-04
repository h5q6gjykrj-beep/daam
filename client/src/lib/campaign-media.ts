/**
 * TODO: Replace IndexedDB with server-backed storage before production launch.
 * 
 * Current implementation uses IndexedDB for media files which means:
 * - Media is browser-specific and won't sync across devices
 * - Data is limited by browser IndexedDB quotas
 * - Data can be cleared by user browser actions
 * 
 * Migration path:
 * 1. Set up object storage (S3, Cloudflare R2, or similar)
 * 2. Create server API endpoints for upload/download
 * 3. Replace saveCampaignAttachment() with upload API
 * 4. Replace getCampaignAttachmentBlob() with download/URL API
 * 5. Handle authentication and signed URLs
 */

import type { CampaignAttachment, CampaignAttachmentKind } from '@/types/campaign';

const DB_NAME = 'daam_media_db_v1';
const STORE_NAME = 'campaign_media';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

// Attachment validation limits
export const ATTACHMENT_LIMITS = {
  image: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    maxCount: 5,
    allowedMimes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  },
  file: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxCount: 3,
    allowedMimes: ['application/pdf']
  },
  video: {
    maxSizeBytes: 8 * 1024 * 1024, // 8MB
    maxCount: 1,
    maxDurationSec: 10,
    allowedMimes: ['video/mp4', 'video/webm']
  }
};

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

// Attachment validation
interface AttachmentValidationSuccess {
  ok: true;
  meta: {
    kind: CampaignAttachmentKind;
    name: string;
    mime: string;
    sizeBytes: number;
    durationSec?: number;
  };
}

interface AttachmentValidationFailure {
  ok: false;
  reason: string;
  reasonAr: string;
}

type AttachmentValidationResult = AttachmentValidationSuccess | AttachmentValidationFailure;

export function detectAttachmentKind(file: File): CampaignAttachmentKind | null {
  if (ATTACHMENT_LIMITS.image.allowedMimes.includes(file.type)) return 'image';
  if (ATTACHMENT_LIMITS.file.allowedMimes.includes(file.type)) return 'file';
  if (ATTACHMENT_LIMITS.video.allowedMimes.includes(file.type)) return 'video';
  return null;
}

export async function validateAttachment(
  file: File,
  kind: CampaignAttachmentKind,
  currentCount: number
): Promise<AttachmentValidationResult> {
  const limits = ATTACHMENT_LIMITS[kind];
  
  // Check mime type
  if (!limits.allowedMimes.includes(file.type)) {
    return {
      ok: false,
      reason: `Invalid format. Allowed: ${limits.allowedMimes.join(', ')}`,
      reasonAr: `صيغة غير مدعومة. المسموح: ${limits.allowedMimes.join(', ')}`
    };
  }
  
  // Check size
  if (file.size > limits.maxSizeBytes) {
    const maxMB = limits.maxSizeBytes / (1024 * 1024);
    const fileMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      ok: false,
      reason: `File size exceeds ${maxMB}MB limit (${fileMB}MB)`,
      reasonAr: `حجم الملف يتجاوز الحد ${maxMB}MB (${fileMB}MB)`
    };
  }
  
  // Check count
  if (currentCount >= limits.maxCount) {
    return {
      ok: false,
      reason: `Maximum ${limits.maxCount} ${kind}(s) allowed`,
      reasonAr: `الحد الأقصى ${limits.maxCount} ${kind === 'image' ? 'صور' : kind === 'file' ? 'ملفات' : 'فيديو'}`
    };
  }
  
  // For video, check duration
  if (kind === 'video') {
    try {
      const durationSec = await getVideoDuration(file);
      if (durationSec > ATTACHMENT_LIMITS.video.maxDurationSec) {
        return {
          ok: false,
          reason: `Video duration exceeds ${ATTACHMENT_LIMITS.video.maxDurationSec} seconds (${durationSec.toFixed(1)}s)`,
          reasonAr: `مدة الفيديو تتجاوز ${ATTACHMENT_LIMITS.video.maxDurationSec} ثواني (${durationSec.toFixed(1)}ث)`
        };
      }
      return {
        ok: true,
        meta: {
          kind,
          name: file.name,
          mime: file.type,
          sizeBytes: file.size,
          durationSec: Math.round(durationSec * 10) / 10
        }
      };
    } catch {
      return {
        ok: false,
        reason: 'Failed to read video duration',
        reasonAr: 'فشل قراءة مدة الفيديو'
      };
    }
  }
  
  return {
    ok: true,
    meta: {
      kind,
      name: file.name,
      mime: file.type,
      sizeBytes: file.size
    }
  };
}

export async function saveCampaignAttachment(file: File): Promise<CampaignAttachment> {
  const kind = detectAttachmentKind(file);
  if (!kind) {
    throw new Error('Unsupported file type');
  }

  // Images are uploaded to Cloudinary; the returned URL is used as the id
  // so it's accessible from any device.
  if (kind === 'image') {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/campaign-image', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Image upload failed');
    }
    const { url } = await res.json();
    return { id: url, kind, name: file.name, mime: file.type, sizeBytes: file.size };
  }

  // Videos → Cloudinary (resource_type: video)
  if (kind === 'video') {
    let durationSec: number | undefined;
    try {
      durationSec = await getVideoDuration(file);
      durationSec = Math.round(durationSec * 10) / 10;
    } catch {}
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/campaign-video', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Video upload failed');
    }
    const { url } = await res.json();
    return { id: url, kind, name: file.name, mime: file.type, sizeBytes: file.size, durationSec };
  }

  // PDF files → Cloudinary (resource_type: raw)
  if (kind === 'file') {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/campaign-file', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'File upload failed');
    }
    const { url } = await res.json();
    return { id: url, kind, name: file.name, mime: file.type, sizeBytes: file.size };
  }

  throw new Error('Unsupported file type');
}

export async function getCampaignAttachmentBlob(mediaId: string): Promise<Blob | null> {
  return getCampaignMedia(mediaId);
}

export async function deleteCampaignAttachment(mediaId: string): Promise<void> {
  return deleteCampaignMedia(mediaId);
}
