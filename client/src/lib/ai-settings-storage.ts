// AI Settings Storage Layer - Replaceable Architecture
// Key: daam_ai_settings_v1

// ============================================
// Types & Interfaces
// ============================================

export interface AISettings {
  enabled: boolean;
  defaultLanguage: 'ar' | 'en';
  systemPrompt_ar: string;
  systemPrompt_en: string;
  maxResponseTokens: number;
  temperature: number;
  activeSnapshotId: string | null;
  updatedAt: number;
  updatedBy: string | null;
}

// Default values for AI Settings
export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  defaultLanguage: 'ar',
  systemPrompt_ar: 'أنت مساعد ذكي لطلاب الجامعة. ساعدهم في الإجابة على أسئلتهم الأكاديمية بوضوح ودقة.',
  systemPrompt_en: 'You are an intelligent assistant for university students. Help them answer their academic questions clearly and accurately.',
  maxResponseTokens: 1024,
  temperature: 0.7,
  activeSnapshotId: null,
  updatedAt: Date.now(),
  updatedBy: null,
};

// ============================================
// Storage Interface (Replaceable)
// ============================================

export interface IKeyValueStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

// ============================================
// LocalStorage Implementation
// ============================================

export class LocalStorageStorage implements IKeyValueStorage {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorageStorage.set error:', error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorageStorage.remove error:', error);
    }
  }
}

// ============================================
// AI Settings Repository
// ============================================

const AI_SETTINGS_KEY = 'daam_ai_settings_v1';

export class AISettingsRepo {
  private storage: IKeyValueStorage;

  constructor(storage: IKeyValueStorage) {
    this.storage = storage;
  }

  getSettings(): AISettings {
    const stored = this.storage.get<AISettings>(AI_SETTINGS_KEY);
    if (stored === null) {
      // Initialize with defaults
      const defaults = { ...DEFAULT_AI_SETTINGS, updatedAt: Date.now() };
      this.storage.set(AI_SETTINGS_KEY, defaults);
      return defaults;
    }
    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_AI_SETTINGS, ...stored };
  }

  saveSettings(settings: AISettings): void {
    this.storage.set(AI_SETTINGS_KEY, settings);
    // Dispatch event for reactivity
    window.dispatchEvent(new CustomEvent('aiSettingsUpdated'));
  }

  resetToDefaults(updatedBy: string | null): AISettings {
    const defaults: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      updatedAt: Date.now(),
      updatedBy,
    };
    this.storage.set(AI_SETTINGS_KEY, defaults);
    window.dispatchEvent(new CustomEvent('aiSettingsUpdated'));
    return defaults;
  }
}

// ============================================
// Validation
// ============================================

export interface AISettingsValidationResult {
  valid: boolean;
  errors: {
    temperature?: string;
    maxResponseTokens?: string;
    systemPrompt_ar?: string;
    systemPrompt_en?: string;
  };
}

export function validateAISettings(
  settings: Partial<AISettings>,
  lang: 'ar' | 'en'
): AISettingsValidationResult {
  const errors: AISettingsValidationResult['errors'] = {};

  // Temperature validation (0.0 - 1.0)
  if (
    settings.temperature === undefined ||
    settings.temperature < 0 ||
    settings.temperature > 1
  ) {
    errors.temperature =
      lang === 'ar'
        ? 'يجب أن تكون درجة الحرارة بين 0 و 1'
        : 'Temperature must be between 0 and 1';
  }

  // Max tokens validation (> 0)
  if (
    settings.maxResponseTokens === undefined ||
    settings.maxResponseTokens <= 0
  ) {
    errors.maxResponseTokens =
      lang === 'ar'
        ? 'يجب أن يكون عدد الرموز أكبر من 0'
        : 'Max tokens must be greater than 0';
  }

  // System prompt validation (not empty)
  if (!settings.systemPrompt_ar || settings.systemPrompt_ar.trim() === '') {
    errors.systemPrompt_ar =
      lang === 'ar'
        ? 'يرجى إدخال النص التوجيهي بالعربية'
        : 'Please enter Arabic system prompt';
  }

  if (!settings.systemPrompt_en || settings.systemPrompt_en.trim() === '') {
    errors.systemPrompt_en =
      lang === 'ar'
        ? 'يرجى إدخال النص التوجيهي بالإنجليزية'
        : 'Please enter English system prompt';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// Singleton Instance (using LocalStorage)
// ============================================

const localStorageInstance = new LocalStorageStorage();
export const aiSettingsRepo = new AISettingsRepo(localStorageInstance);
