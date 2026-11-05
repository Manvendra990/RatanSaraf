export type MetalName = 'Gold' | 'Silver';
export type MetalQuote = { buy: number; sell: number; gst: number; buyWithGst: number; change24h: number | null };
export type MetalPrices = { Gold: MetalQuote; Silver: MetalQuote; timestamp: string };

export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); this.name = 'ApiError'; }
}
export async function fetchJson(url: string, signal?: AbortSignal): Promise<any> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, 15000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const message = res.status === 403 ? 'This history requires a Goldprice Pro+ plan.'
        : res.status === 429 ? 'Provider request limit reached. Please try again later.'
        : `Rate provider returned HTTP ${res.status}.`;
      throw new ApiError(message, res.status);
    }
    return await res.json();
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
const positive = (v: unknown, field: string, zero = false) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || (zero ? v < 0 : v <= 0)) {
    throw new ApiError(`Invalid ${field} in provider response.`);
  }
  return v;
};
export function parseMetalPrices(raw: any): MetalPrices {
  const d = raw?.data;
  if (raw?.statusCode !== 200 || !d || typeof d.timestamp !== 'string' || !Number.isFinite(Date.parse(d.timestamp))) {
    throw new ApiError('Invalid OroPocket price response.');
  }
  const quote = (m: any): MetalQuote => {
    if (m?.currency !== 'INR' || m?.unit !== 'gram') throw new ApiError('Unsupported price currency or unit.');
    const buy = positive(m.buy, 'buy'), sell = positive(m.sell, 'sell'), gst = positive(m.gst, 'GST', true);
    const change = m.change24h?.buy;
    return { buy, sell, gst, buyWithGst: buy + gst, change24h: typeof change === 'number' && Number.isFinite(change) ? change : null };
  };
  return { Gold: quote(d.gold), Silver: quote(d.silver), timestamp: d.timestamp };
}
let cached: MetalPrices | null = null;
let fetchedAt = 0;
let pending: Promise<MetalPrices> | null = null;
export function peekMetalPrices() { return cached; }
export function getMetalPrices(): Promise<MetalPrices> {
  if (cached && Date.now() - fetchedAt < 60000) return Promise.resolve(cached);
  if (pending) return pending;
  pending = fetchJson('https://api.oropocket.com/public/prices').then(parseMetalPrices).then(value => {
    cached = value; fetchedAt = Date.now(); return value;
  }).finally(() => { pending = null; });
  return pending;
}
export function messageOf(e: unknown): string {
  if (e instanceof Error && e.name === 'AbortError') return 'Request timed out. Please retry.';
  return e instanceof Error ? e.message : 'Unable to load prices. Please retry.';
}
export function quoteTime(timestamp: string) {
  return new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST';
}
