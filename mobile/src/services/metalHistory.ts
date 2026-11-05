

import { ApiError, fetchJson, type MetalName } from './metalPrices';
export type HistoryPoint = { date: string; close: number; high: number | null; low: number | null; provisional: boolean };
const OZ_GRAMS = 31.1034768;
const number = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n / OZ_GRAMS : null;
};
export function parseBars(raw: any, expectedSymbol: string): HistoryPoint[] {
  if (raw?.symbol !== expectedSymbol || !Array.isArray(raw.bars)) throw new ApiError('Invalid historical response.');
  const points = new Map<string, HistoryPoint>();
  for (const b of raw.bars) {
    const close = number(b.close);
    if (close === null || typeof b.bar_start !== 'string' || !Number.isFinite(Date.parse(b.bar_start))) continue;
    points.set(b.bar_start, { date: b.bar_start, close, high: number(b.high), low: number(b.low), provisional: b.is_closed !== true });
  }
  return [...points.values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
export async function getMetalHistory(metal: MetalName, days: 7 | 14 | 30, signal?: AbortSignal): Promise<HistoryPoint[]> {
  const symbol = metal === 'Gold' ? 'XAU-USD-SPOT' : 'XAG-USD-SPOT';
  const end = new Date();
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - (days - 1));
  const base = `https://api.goldprice.dev/v1/bars?symbol=${symbol}&interval=1d&from=${start.toISOString().slice(0, 10)}&to=${end.toISOString().slice(0, 10)}&limit=10000`;
  const points = new Map<string, HistoryPoint>();
  let cursor: string | null = null;
  const seen = new Set<string>();
  do {
    const raw = await fetchJson(base + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''), signal);
    parseBars(raw, symbol).forEach(p => points.set(p.date, p));
    cursor = typeof raw.next_cursor === 'string' && raw.next_cursor ? raw.next_cursor : null;
    if (cursor && seen.has(cursor)) throw new ApiError('Invalid repeated history cursor.');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return [...points.values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
