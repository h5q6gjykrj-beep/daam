export async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const res = await fetch(`/api/settings/${encodeURIComponent(key)}`);
    if (res.ok) {
      const data = await res.json();
      if (data !== null && data.value !== null && data.value !== undefined) {
        return data.value as T;
      }
    }
  } catch {}
  return defaultValue;
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  try {
    await fetch(`/api/settings/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
  } catch {}
}
