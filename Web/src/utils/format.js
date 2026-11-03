export const inr = (value) => Number.isFinite(Number(value))
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value))
  : '—';
export const paiseToInr = (value) => (value == null || value === '' || !Number.isFinite(Number(value))) ? null : Number(value) / 100;
export const readableTime = (timestamp) => {
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return '';
  return new Date(timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};
export const isCoin = (p) => p?.category?.toLowerCase() === 'coins' || (p?.coinWeight != null && Number(p.coinWeight) > 0);
export function productImage(product) {
  const raw = product?.image || product?.images?.[0]?.url || product?.images?.[0] || '';
  if (!raw || typeof raw !== 'string') return '';
  if (/^(data:|blob:)/i.test(raw)) return raw;
  // 10.0.2.2 is an Android emulator address, unreachable from a desktop browser.
  if (/^https?:\/\/(10\.0\.2\.2|localhost|127\.0\.0\.1)(:\d+)?\//.test(raw)) {
    const uri = new URL(raw);
    return `${(import.meta.env.VITE_MEDIA_BASE_URL || '/assets-api').replace(/\/$/, '')}${uri.pathname}${uri.search}`;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${(import.meta.env.VITE_MEDIA_BASE_URL || '/assets-api').replace(/\/$/, '')}/${raw.replace(/^\/+/, '')}`;
}
export function normalizeCategories(data) {
  return Array.isArray(data) ? data.filter(c => c && c.name && c.name !== 'Coins') : [];
}
export function resolveWhatsApp(store) {
  const candidate = store?.whatsapp || store?.whatsApp || store?.whatsappNumber || import.meta.env.VITE_STORE_WHATSAPP || '';
  const cleaned = String(candidate).replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15 ? cleaned : '';
}
export function storeAddress(store) {
  const line = store?.addressLine1 || store?.address || store?.street || '';
  const bits = [line, store?.city, store?.state, store?.pincode].filter(Boolean);
  return bits.join(', ');
}
