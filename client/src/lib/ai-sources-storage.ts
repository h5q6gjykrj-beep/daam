// AI Training Sources Storage Layer - Replaceable Architecture
// Key: daam_ai_sources_v1

import { IKeyValueStorage, LocalStorageStorage } from './ai-settings-storage';
import { aiAuditRepo, aiMetricsRepo } from './ai-audit-storage';

// ============================================
// Types & Interfaces
// ============================================

export type TrainingSourceType = 'note' | 'summary' | 'article' | 'qa' | 'link' | 'file_meta';
export type TrainingSourceLanguage = 'ar' | 'en' | 'mixed';
export type TrainingSourceStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

export interface TrainingSource {
  id: string;
  type: TrainingSourceType;
  title: string;
  language: TrainingSourceLanguage;
  tags: string[];
  content: string;
  linkUrl: string | null;
  status: TrainingSourceStatus;
  createdByUserId: string;
  createdByName: string | null;
  createdAt: number;
  reviewedByUserId: string | null;
  reviewedByName: string | null;
  reviewedAt: number | null;
  reviewNotes: string | null;
  updatedAt: number;
}

export interface CreateTrainingSourceInput {
  type: TrainingSourceType;
  title: string;
  language: TrainingSourceLanguage;
  tags: string[];
  content: string;
  linkUrl: string | null;
  createdByUserId: string;
  createdByName: string | null;
}

export interface UpdateTrainingSourceInput {
  title?: string;
  language?: TrainingSourceLanguage;
  tags?: string[];
  content?: string;
  linkUrl?: string | null;
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `src-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// Training Sources Repository
// ============================================

const SOURCES_KEY = 'daam_ai_sources_v1';

export class TrainingSourcesRepo {
  private storage: IKeyValueStorage;

  constructor(storage: IKeyValueStorage) {
    this.storage = storage;
  }

  private getSources(): TrainingSource[] {
    return this.storage.get<TrainingSource[]>(SOURCES_KEY) || [];
  }

  private saveSources(sources: TrainingSource[]): void {
    this.storage.set(SOURCES_KEY, sources);
    window.dispatchEvent(new CustomEvent('aiSourcesUpdated'));
  }

  create(input: CreateTrainingSourceInput, logAudit: boolean = true): TrainingSource {
    const now = Date.now();
    const source: TrainingSource = {
      id: generateId(),
      type: input.type,
      title: input.title,
      language: input.language,
      tags: input.tags,
      content: input.content,
      linkUrl: input.linkUrl,
      status: 'draft',
      createdByUserId: input.createdByUserId,
      createdByName: input.createdByName,
      createdAt: now,
      reviewedByUserId: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewNotes: null,
      updatedAt: now,
    };

    const sources = this.getSources();
    sources.unshift(source);
    this.saveSources(sources);

    if (logAudit) {
      aiAuditRepo.append({
        actorUserId: input.createdByUserId,
        actorName: input.createdByName,
        action: 'ai.source.created',
        entityType: 'source',
        entityId: source.id,
        meta: {
          sourceId: source.id,
          sourceType: source.type,
          newStatus: 'draft',
          title: source.title,
        },
      });
      aiMetricsRepo.recomputeFromAudit();
    }

    return source;
  }

  get(id: string): TrainingSource | null {
    const sources = this.getSources();
    return sources.find(s => s.id === id) || null;
  }

  update(id: string, input: UpdateTrainingSourceInput, userId: string, userName: string | null): TrainingSource | null {
    const sources = this.getSources();
    const index = sources.findIndex(s => s.id === id);
    if (index === -1) return null;

    const source = sources[index];
    const updated: TrainingSource = {
      ...source,
      ...input,
      updatedAt: Date.now(),
    };
    sources[index] = updated;
    this.saveSources(sources);

    aiAuditRepo.append({
      actorUserId: userId,
      actorName: userName,
      action: 'ai.source.updated',
      entityType: 'source',
      entityId: id,
      meta: {
        sourceId: id,
        sourceType: updated.type,
        newStatus: updated.status,
        title: updated.title,
      },
    });
    aiMetricsRepo.recomputeFromAudit();

    return updated;
  }

  list(filters?: {
    status?: TrainingSourceStatus;
    search?: string;
    type?: TrainingSourceType;
  }): TrainingSource[] {
    let sources = this.getSources();

    if (filters?.status) {
      sources = sources.filter(s => s.status === filters.status);
    }

    if (filters?.type) {
      sources = sources.filter(s => s.type === filters.type);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      sources = sources.filter(s => 
        s.title.toLowerCase().includes(searchLower) ||
        s.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    return sources;
  }

  changeStatus(
    id: string,
    newStatus: TrainingSourceStatus,
    userId: string,
    userName: string | null,
    reviewNotes?: string
  ): TrainingSource | null {
    const sources = this.getSources();
    const index = sources.findIndex(s => s.id === id);
    if (index === -1) return null;

    const source = sources[index];
    const oldStatus = source.status;

    const updated: TrainingSource = {
      ...source,
      status: newStatus,
      updatedAt: Date.now(),
    };

    if (newStatus === 'approved' || newStatus === 'rejected') {
      updated.reviewedByUserId = userId;
      updated.reviewedByName = userName;
      updated.reviewedAt = Date.now();
      if (reviewNotes) {
        updated.reviewNotes = reviewNotes;
      }
    }

    sources[index] = updated;
    this.saveSources(sources);

    let action = 'ai.source.updated';
    if (oldStatus === 'draft' && newStatus === 'pending_review') {
      action = 'ai.source.submitted';
    } else if (newStatus === 'approved') {
      action = 'ai.source.approved';
    } else if (newStatus === 'rejected') {
      action = 'ai.source.rejected';
    } else if (newStatus === 'archived') {
      action = 'ai.source.archived';
    }

    aiAuditRepo.append({
      actorUserId: userId,
      actorName: userName,
      action,
      entityType: 'source',
      entityId: id,
      meta: {
        sourceId: id,
        sourceType: updated.type,
        oldStatus,
        newStatus,
        title: updated.title,
        reviewNotes: reviewNotes || null,
      },
    });
    aiMetricsRepo.recomputeFromAudit();

    return updated;
  }

  delete(id: string, userId: string, userName: string | null): boolean {
    const sources = this.getSources();
    const source = sources.find(s => s.id === id);
    if (!source) return false;

    const filtered = sources.filter(s => s.id !== id);
    this.saveSources(filtered);

    aiAuditRepo.append({
      actorUserId: userId,
      actorName: userName,
      action: 'ai.source.deleted',
      entityType: 'source',
      entityId: id,
      meta: {
        sourceId: id,
        sourceType: source.type,
        title: source.title,
      },
    });
    aiMetricsRepo.recomputeFromAudit();

    return true;
  }

  count(status?: TrainingSourceStatus): number {
    const sources = this.getSources();
    if (status) {
      return sources.filter(s => s.status === status).length;
    }
    return sources.length;
  }
}

// ============================================
// Validation
// ============================================

export interface SourceValidationResult {
  valid: boolean;
  errors: {
    title?: string;
    content?: string;
    linkUrl?: string;
  };
}

export function validateTrainingSource(
  source: Partial<CreateTrainingSourceInput>,
  lang: 'ar' | 'en'
): SourceValidationResult {
  const errors: SourceValidationResult['errors'] = {};

  if (!source.title || source.title.trim() === '') {
    errors.title = lang === 'ar' ? 'العنوان مطلوب' : 'Title is required';
  }

  const textTypes: TrainingSourceType[] = ['note', 'summary', 'article', 'qa'];
  if (source.type && textTypes.includes(source.type)) {
    if (!source.content || source.content.trim() === '') {
      errors.content = lang === 'ar' ? 'المحتوى مطلوب' : 'Content is required';
    }
  }

  if (source.type === 'link') {
    if (!source.linkUrl || source.linkUrl.trim() === '') {
      errors.linkUrl = lang === 'ar' ? 'رابط URL مطلوب' : 'URL link is required';
    } else {
      try {
        new URL(source.linkUrl);
      } catch {
        errors.linkUrl = lang === 'ar' ? 'رابط URL غير صالح' : 'Invalid URL';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// Type Labels
// ============================================

export const SOURCE_TYPE_LABELS: Record<TrainingSourceType, { ar: string; en: string }> = {
  note: { ar: 'ملاحظة', en: 'Note' },
  summary: { ar: 'ملخص', en: 'Summary' },
  article: { ar: 'مقالة', en: 'Article' },
  qa: { ar: 'سؤال وجواب', en: 'Q&A' },
  link: { ar: 'رابط', en: 'Link' },
  file_meta: { ar: 'ملف', en: 'File' },
};

export const SOURCE_STATUS_LABELS: Record<TrainingSourceStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  pending_review: { ar: 'قيد المراجعة', en: 'Pending Review' },
  approved: { ar: 'معتمد', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  archived: { ar: 'مؤرشف', en: 'Archived' },
};

export const SOURCE_LANGUAGE_LABELS: Record<TrainingSourceLanguage, { ar: string; en: string }> = {
  ar: { ar: 'العربية', en: 'Arabic' },
  en: { ar: 'الإنجليزية', en: 'English' },
  mixed: { ar: 'مختلط', en: 'Mixed' },
};

// ============================================
// Singleton Instance (using LocalStorage)
// ============================================

const localStorageInstance = new LocalStorageStorage();
export const trainingSourcesRepo = new TrainingSourcesRepo(localStorageInstance);
