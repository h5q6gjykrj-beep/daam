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
      { folder: 'daam/images', resource_type: 'image' },
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
        // preserve original filename as display name
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

export async function deleteCloudinaryFile(url: string, resourceType: 'image' | 'raw'): Promise<void> {
  const publicId = extractPublicId(url, resourceType);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
