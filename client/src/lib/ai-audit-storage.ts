// AI Audit Log & Metrics Storage Layer - Replaceable Architecture
// Keys: daam_ai_audit_v1, daam_ai_metrics_v1

import { IKeyValueStorage, LocalStorageStorage } from './ai-settings-storage';

// ============================================
// Types & Interfaces
// ============================================

export type AIAuditEntityType = 'settings' | 'source' | 'job' | 'snapshot' | 'access';

export interface AIAuditEvent {
  id: string;
  ts: number;
  actorUserId: string;
  actorName: string | null;
  action: string;
  entityType: AIAuditEntityType;
  entityId: string | null;
  meta: Record<string, unknown>;
}

export interface AIUserMetrics {
  settingsSaves: number;
  accessDenied: number;
}

export interface AIMetricDaily {
  date: string; // "YYYY-MM-DD"
  byUser: Record<string, AIUserMetrics>;
  totals: AIUserMetrics;
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getDateString(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().split('T')[0];
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

// ============================================
// AI Audit Repository
// ============================================

const AI_AUDIT_KEY = 'daam_ai_audit_v1';
const MAX_EVENTS = 500; // Keep last 500 events

export class AIAuditRepo {
  private storage: IKeyValueStorage;

  constructor(storage: IKeyValueStorage) {
    this.storage = storage;
  }

  private getEvents(): AIAuditEvent[] {
    return this.storage.get<AIAuditEvent[]>(AI_AUDIT_KEY) || [];
  }

  private saveEvents(events: AIAuditEvent[]): void {
    this.storage.set(AI_AUDIT_KEY, events);
    window.dispatchEvent(new CustomEvent('aiAuditUpdated'));
  }

  append(event: Omit<AIAuditEvent, 'id' | 'ts'>): AIAuditEvent {
    const fullEvent: AIAuditEvent = {
      ...event,
      id: generateId(),
      ts: Date.now(),
    };
    const events = this.getEvents();
    events.unshift(fullEvent); // Add to beginning (newest first)
    // Trim to max events
    const trimmed = events.slice(0, MAX_EVENTS);
    this.saveEvents(trimmed);
    return fullEvent;
  }

  list(limit: number = 50, userIdFilter?: string): AIAuditEvent[] {
    let events = this.getEvents();
    if (userIdFilter) {
      events = events.filter(e => e.actorUserId === userIdFilter);
    }
    return events.slice(0, limit);
  }

  clear(): void {
    this.storage.remove(AI_AUDIT_KEY);
    window.dispatchEvent(new CustomEvent('aiAuditUpdated'));
  }

  count(): number {
    return this.getEvents().length;
  }
}

// ============================================
// AI Metrics Repository
// ============================================

const AI_METRICS_KEY = 'daam_ai_metrics_v1';

export class AIMetricsRepo {
  private storage: IKeyValueStorage;
  private auditRepo: AIAuditRepo;

  constructor(storage: IKeyValueStorage, auditRepo: AIAuditRepo) {
    this.storage = storage;
    this.auditRepo = auditRepo;
  }

  private getMetrics(): Record<string, AIMetricDaily> {
    return this.storage.get<Record<string, AIMetricDaily>>(AI_METRICS_KEY) || {};
  }

  private saveMetrics(metrics: Record<string, AIMetricDaily>): void {
    this.storage.set(AI_METRICS_KEY, metrics);
    window.dispatchEvent(new CustomEvent('aiMetricsUpdated'));
  }

  get(date: string): AIMetricDaily | null {
    const metrics = this.getMetrics();
    return metrics[date] || null;
  }

  getRange(startDate: string, endDate: string): AIMetricDaily[] {
    const metrics = this.getMetrics();
    const results: AIMetricDaily[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (metrics[dateStr]) {
        results.push(metrics[dateStr]);
      }
    }
    return results;
  }

  recomputeFromAudit(): void {
    const events = this.auditRepo.list(MAX_EVENTS);
    const metrics: Record<string, AIMetricDaily> = {};

    for (const event of events) {
      const dateStr = getDateString(event.ts);
      
      if (!metrics[dateStr]) {
        metrics[dateStr] = {
          date: dateStr,
          byUser: {},
          totals: { settingsSaves: 0, accessDenied: 0 },
        };
      }

      const userMetrics = metrics[dateStr].byUser[event.actorUserId] || {
        settingsSaves: 0,
        accessDenied: 0,
      };

      if (event.action === 'ai.settings.saved' || event.action === 'ai.settings.reset') {
        userMetrics.settingsSaves++;
        metrics[dateStr].totals.settingsSaves++;
      } else if (event.action === 'ai.access.denied') {
        userMetrics.accessDenied++;
        metrics[dateStr].totals.accessDenied++;
      }

      metrics[dateStr].byUser[event.actorUserId] = userMetrics;
    }

    this.saveMetrics(metrics);
  }

  getTodayMetrics(): AIMetricDaily {
    const today = getDateString(Date.now());
    return this.get(today) || {
      date: today,
      byUser: {},
      totals: { settingsSaves: 0, accessDenied: 0 },
    };
  }

  getWeekMetrics(): { totals: AIUserMetrics; byUser: Record<string, AIUserMetrics> } {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDate = getDateString(weekAgo.getTime());
    const endDate = getDateString(now.getTime());
    
    const dailyMetrics = this.getRange(startDate, endDate);
    
    const combined: { totals: AIUserMetrics; byUser: Record<string, AIUserMetrics> } = {
      totals: { settingsSaves: 0, accessDenied: 0 },
      byUser: {},
    };

    for (const daily of dailyMetrics) {
      combined.totals.settingsSaves += daily.totals.settingsSaves;
      combined.totals.accessDenied += daily.totals.accessDenied;
      
      for (const [userId, userMetrics] of Object.entries(daily.byUser)) {
        if (!combined.byUser[userId]) {
          combined.byUser[userId] = { settingsSaves: 0, accessDenied: 0 };
        }
        combined.byUser[userId].settingsSaves += userMetrics.settingsSaves;
        combined.byUser[userId].accessDenied += userMetrics.accessDenied;
      }
    }

    return combined;
  }

  getTopUsers(limit: number = 3): Array<{ userId: string; activity: number }> {
    const weekMetrics = this.getWeekMetrics();
    const userActivity: Array<{ userId: string; activity: number }> = [];

    for (const [userId, metrics] of Object.entries(weekMetrics.byUser)) {
      userActivity.push({
        userId,
        activity: metrics.settingsSaves + metrics.accessDenied,
      });
    }

    return userActivity
      .sort((a, b) => b.activity - a.activity)
      .slice(0, limit);
  }
}

// ============================================
// Audit Event Helpers
// ============================================

export interface LogSettingsSavedOptions {
  actorUserId: string;
  actorName: string | null;
  enabled: boolean;
  defaultLanguage: string;
  temperature: number;
  maxTokens: number;
  systemPromptArLength: number;
  systemPromptEnLength: number;
}

export function createSettingsSavedMeta(opts: Omit<LogSettingsSavedOptions, 'actorUserId' | 'actorName'>): Record<string, unknown> {
  return {
    enabled: opts.enabled,
    defaultLanguage: opts.defaultLanguage,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    systemPromptArLength: opts.systemPromptArLength,
    systemPromptEnLength: opts.systemPromptEnLength,
  };
}

export function createSettingsResetMeta(): Record<string, unknown> {
  return {
    resetToDefaults: true,
  };
}

export function createAccessDeniedMeta(section: string, requiredPermission: string): Record<string, unknown> {
  return {
    section,
    requiredPermission,
  };
}

// ============================================
// Singleton Instances (using LocalStorage)
// ============================================

const localStorageInstance = new LocalStorageStorage();
export const aiAuditRepo = new AIAuditRepo(localStorageInstance);
export const aiMetricsRepo = new AIMetricsRepo(localStorageInstance, aiAuditRepo);
