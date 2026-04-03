import { loadSetting, saveSetting } from './settings-api';

const NAVBAR_CONFIG_KEY = 'daam_navbar_config_v1';

export interface NavbarItem {
  routeKey: string;
  enabled: boolean;
  order: number;
  label: {
    ar: string;
    en: string;
  };
  icon: string;
  adminOnly?: boolean;
}

export interface NavbarConfig {
  items: NavbarItem[];
}

const DEFAULT_NAVBAR_CONFIG: NavbarConfig = {
  items: [
    { routeKey: 'home', enabled: true, order: 1, label: { ar: 'الرئيسية', en: 'Home' }, icon: 'Home' },
    { routeKey: 'feed', enabled: true, order: 2, label: { ar: 'ساحة النقاش', en: 'Discussion Arena' }, icon: 'MessageSquare' },
    { routeKey: 'messages', enabled: true, order: 3, label: { ar: 'الرسائل', en: 'Messages' }, icon: 'Mail' },
    { routeKey: 'ai', enabled: false, order: 4, label: { ar: 'المساعد الذكي', en: 'AI Tutor' }, icon: 'Bot' },
    { routeKey: 'profile', enabled: true, order: 5, label: { ar: 'الملف الشخصي', en: 'Profile' }, icon: 'User' },
    { routeKey: 'admin', enabled: true, order: 6, label: { ar: 'الإدارة', en: 'Admin' }, icon: 'Settings', adminOnly: true },
  ]
};

function getDefaultItem(routeKey: string): NavbarItem | undefined {
  return DEFAULT_NAVBAR_CONFIG.items.find(i => i.routeKey === routeKey);
}

function mergeWithDefaults(parsed: NavbarConfig): NavbarConfig {
  const defaultKeys = DEFAULT_NAVBAR_CONFIG.items.map(i => i.routeKey);
  const storedKeys = parsed.items.map(i => i.routeKey);

  const mergedItems = parsed.items.map(item => {
    const defaultItem = getDefaultItem(item.routeKey);
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
    const missingItems = DEFAULT_NAVBAR_CONFIG.items.filter(i => missingKeys.includes(i.routeKey));
    mergedItems.push(...missingItems);
  }

  return { items: mergedItems };
}

export function getNavbarConfig(): NavbarConfig {
  return { ...DEFAULT_NAVBAR_CONFIG, items: [...DEFAULT_NAVBAR_CONFIG.items] };
}

export async function loadNavbarConfig(): Promise<NavbarConfig> {
  const stored = await loadSetting<NavbarConfig>(NAVBAR_CONFIG_KEY, DEFAULT_NAVBAR_CONFIG);
  return mergeWithDefaults(stored);
}

export async function saveNavbarConfig(config: NavbarConfig) {
  await saveSetting(NAVBAR_CONFIG_KEY, config);
  window.dispatchEvent(new CustomEvent('navbarConfigUpdated'));
}

export async function resetNavbarConfig(): Promise<NavbarConfig> {
  const reset = { ...DEFAULT_NAVBAR_CONFIG, items: [...DEFAULT_NAVBAR_CONFIG.items] };
  await saveSetting(NAVBAR_CONFIG_KEY, reset);
  window.dispatchEvent(new CustomEvent('navbarConfigUpdated'));
  return reset;
}

export const NAVBAR_CONFIG_STORAGE_KEY = NAVBAR_CONFIG_KEY;
