import { z } from 'zod';

// Minimal API definition since we are using localStorage for this specific request
export const api = {
  // We keep this empty as requested logic is client-side only
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
