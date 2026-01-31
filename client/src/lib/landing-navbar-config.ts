export const LANDING_NAVBAR_CONFIG_KEY = 'daam_landing_navbar_config_v1';

export type LandingNavAction = 
  | 'scroll:top'
  | 'scroll:#why'
  | 'scroll:#features'
  | 'scroll:#activity'
  | 'route:/login'
  | 'route:/register'
  | 'toggle:lang'
  | 'toggle:theme';

export interface LandingNavbarItem {
  key: string;
  enabled: boolean;
  order: number;
  label: {
    ar: string;
    en: string;
  };
  action: LandingNavAction;
  isButton?: boolean;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  isIcon?: boolean;
}

export interface LandingNavbarConfig {
  items: LandingNavbarItem[];
}

const DEFAULT_LANDING_NAVBAR_CONFIG: LandingNavbarConfig = {
  items: [
    { key: 'home', enabled: true, order: 1, label: { ar: 'الرئيسية', en: 'Home' }, action: 'scroll:top' },
    { key: 'why', enabled: true, order: 2, label: { ar: 'لماذا دام؟', en: 'Why DAAM' }, action: 'scroll:#why' },
    { key: 'features', enabled: true, order: 3, label: { ar: 'المميزات', en: 'Features' }, action: 'scroll:#features' },
    { key: 'theme', enabled: true, order: 90, label: { ar: '', en: '' }, action: 'toggle:theme', isIcon: true },
    { key: 'language', enabled: true, order: 91, label: { ar: 'English', en: 'العربية' }, action: 'toggle:lang' },
    { key: 'login', enabled: true, order: 92, label: { ar: 'تسجيل الدخول', en: 'Login' }, action: 'route:/login', isButton: true, buttonVariant: 'outline' },
    { key: 'register', enabled: true, order: 93, label: { ar: 'إنشاء حساب', en: 'Sign up' }, action: 'route:/register', isButton: true, buttonVariant: 'default' },
  ]
};

function getDefaultItem(key: string): LandingNavbarItem | undefined {
  return DEFAULT_LANDING_NAVBAR_CONFIG.items.find(i => i.key === key);
}

export function getLandingNavbarConfig(): LandingNavbarConfig {
  try {
    const stored = localStorage.getItem(LANDING_NAVBAR_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LandingNavbarConfig;
      const defaultKeys = DEFAULT_LANDING_NAVBAR_CONFIG.items.map(i => i.key);
      const storedKeys = parsed.items.map(i => i.key);
      
      const mergedItems = parsed.items.map(item => {
        const defaultItem = getDefaultItem(item.key);
        if (!defaultItem) return item;
        return {
          ...defaultItem,
          ...item,
          label: {
            ar: item.label?.ar ?? defaultItem.label.ar,
            en: item.label?.en ?? defaultItem.label.en,
          }
        };
      });
      
      const missingKeys = defaultKeys.filter(k => !storedKeys.includes(k));
      if (missingKeys.length > 0) {
        const missingItems = DEFAULT_LANDING_NAVBAR_CONFIG.items.filter(i => missingKeys.includes(i.key));
        mergedItems.push(...missingItems);
      }
      
      return { items: mergedItems };
    }
  } catch {}
  return { ...DEFAULT_LANDING_NAVBAR_CONFIG, items: [...DEFAULT_LANDING_NAVBAR_CONFIG.items] };
}

export function saveLandingNavbarConfig(config: LandingNavbarConfig) {
  localStorage.setItem(LANDING_NAVBAR_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('landingNavbarConfigUpdated'));
}

export function resetLandingNavbarConfig(): LandingNavbarConfig {
  const reset = { ...DEFAULT_LANDING_NAVBAR_CONFIG, items: [...DEFAULT_LANDING_NAVBAR_CONFIG.items] };
  localStorage.setItem(LANDING_NAVBAR_CONFIG_KEY, JSON.stringify(reset));
  window.dispatchEvent(new CustomEvent('landingNavbarConfigUpdated'));
  return reset;
}

export function getActionLabel(action: LandingNavAction, lang: 'ar' | 'en'): string {
  const labels: Record<LandingNavAction, { ar: string; en: string }> = {
    'scroll:top': { ar: 'انتقال للأعلى', en: 'Scroll to Top' },
    'scroll:#why': { ar: 'انتقال لقسم لماذا', en: 'Scroll to Why' },
    'scroll:#features': { ar: 'انتقال للمميزات', en: 'Scroll to Features' },
    'scroll:#activity': { ar: 'انتقال للنشاط', en: 'Scroll to Activity' },
    'route:/login': { ar: 'صفحة تسجيل الدخول', en: 'Login Page' },
    'route:/register': { ar: 'صفحة التسجيل', en: 'Register Page' },
    'toggle:lang': { ar: 'تبديل اللغة', en: 'Toggle Language' },
    'toggle:theme': { ar: 'تبديل السمة', en: 'Toggle Theme' },
  };
  return labels[action]?.[lang] || action;
}
