import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Add Cloudinary transformations to avatar URLs for sharp display */
export function avatarUrl(url: string | undefined | null, size = 200): string | undefined {
  if (!url) return undefined;
  if (!url.includes('res.cloudinary.com')) return url;
  // If transformation already present, replace it; otherwise inject after /upload/
  const uploadMarker = '/upload/';
  const idx = url.indexOf(uploadMarker);
  if (idx === -1) return url;
  const transform = `w_${size},h_${size},c_fill,q_auto,f_auto`;
  const afterUpload = url.slice(idx + uploadMarker.length);
  // Remove any existing transformations (starts with letters like w_, h_, c_, q_, f_, e_)
  const cleaned = afterUpload.replace(/^[^/]+\//, (match) =>
    /^[whcqfe]_/.test(match) ? '' : match
  );
  return url.slice(0, idx + uploadMarker.length) + transform + '/' + cleaned;
}
