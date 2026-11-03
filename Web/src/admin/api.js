// Shares the customer website's exact /backend proxy and NestJS backend.
// Admin authentication uses the existing HttpOnly cookie endpoints.
import { api } from '../api/client';
export const adminApi = (path, options = {}) => api(path, options);

export async function adminUploadImage(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Select a JPEG, PNG or WebP image.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('The image must be smaller than 5 MB.');
  const fd = new FormData();
  fd.append('file', file);
  const result = await adminApi('/admin/images', { method: 'POST', body: fd });
  if (!result?.url) throw new Error('Image upload did not return an image URL.');
  return result.url;
}

// KYC evidence is PRIVATE. Fetch with the backend's existing admin session;
// do not construct public URLs or persist the document in browser storage.
export async function adminDocumentBlob(id) {
  const base = (import.meta.env.VITE_API_BASE_URL || '/backend').replace(/\/$/, '');
  const response = await fetch(`${base}/manual-kyc/${encodeURIComponent(id)}/document`, {
    credentials: 'include', cache: 'no-store', headers: { Accept: 'application/pdf,image/*' },
  });
  if (!response.ok) throw new Error(`Unable to open the private document (${response.status}).`);
  const blob = await response.blob();
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) {
    throw new Error('Document has an unsupported format.');
  }
  return blob;
}
