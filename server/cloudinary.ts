import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function uploadImageBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'daam/images',
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto', width: 2000, crop: 'limit' },
        ],
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

export function uploadVideoBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'daam/campaign-videos', resource_type: 'video' },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

export function uploadPdfBuffer(buffer: Buffer, originalName: string): Promise<string> {
  const publicId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'daam/materials',
        resource_type: 'raw',
        public_id: publicId,
        context: { original_name: originalName },
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

/** Extracts the Cloudinary public_id from a secure_url for deletion. */
function extractPublicId(url: string, resourceType: 'image' | 'raw'): string | null {
  try {
    const marker = '/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    // strip version prefix (v1234/)
    let id = url.slice(idx + marker.length).replace(/^v\d+\//, '');
    // images: strip file extension (public_id has no extension)
    if (resourceType === 'image') id = id.replace(/\.[^/.]+$/, '');
    return id;
  } catch { return null; }
}

/** Generates a signed Cloudinary URL valid for 1 hour for inline PDF viewing. */
export function generateSignedUrl(url: string): string | null {
  const publicId = extractPublicId(url, 'raw');
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    type: 'upload',
    resource_type: 'raw',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    secure: true,
  });
}

export async function deleteCloudinaryFile(url: string, resourceType: 'image' | 'raw'): Promise<void> {
  const publicId = extractPublicId(url, resourceType);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
