const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'rls_web_token_v1';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (value) => { if (value)
    sessionStorage.setItem(TOKEN_KEY, value);
else
    sessionStorage.removeItem(TOKEN_KEY); };
export async function api(path, method = 'GET', body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
        const isForm = body instanceof FormData;
        const res = await fetch(BASE + path, { method, signal: controller.signal, headers: { Accept: 'application/json', ...(!isForm && body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) }, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
            throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || `Request failed (${res.status})`);
        return data;
    }
    catch (err) {
        if (err instanceof Error && err.name === 'AbortError')
            throw new Error('Request timed out. Check your network and try again.');
        throw err;
    }
    finally {
        clearTimeout(timeout);
    }
}
export async function loadLiveRates() {
    const res = await fetch('https://api.oropocket.com/public/prices');
    if (!res.ok)
        throw new Error('Live rates provider is temporarily unavailable.');
    const raw = await res.json();
    const d = raw?.data;
    if (raw?.statusCode !== 200 || !d || !d.timestamp)
        throw new Error('Invalid provider response.');
    function quote(m) {
        if (m?.currency !== 'INR' || m.unit !== 'gram' || ![m.buy, m.sell, m.gst].every((n) => typeof n === 'number' && Number.isFinite(n)) || m.buy <= 0 || m.sell <= 0 || m.gst < 0)
            throw new Error('Unexpected provider rate format.');
        return { buy: m.buy, sell: m.sell, gst: m.gst, buyWithGst: m.buy + m.gst, change24h: typeof m.change24h?.buy === 'number' ? m.change24h.buy : null };
    }
    return { Gold: quote(d.gold), Silver: quote(d.silver), timestamp: d.timestamp };
}
export async function loadHistory(metal, days) {
    const symbol = metal === 'Gold' ? 'XAU-USD-SPOT' : 'XAG-USD-SPOT';
    const end = new Date(), start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const base = `https://api.goldprice.dev/v1/bars?symbol=${symbol}&interval=1d&from=${start.toISOString().slice(0, 10)}&to=${end.toISOString().slice(0, 10)}&limit=10000`;
    const map = new Map();
    let cursor = null;
    const seen = new Set();
    do {
        const res = await fetch(base + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''));
        if (!res.ok)
            throw new Error(res.status === 403 ? 'Historical data requires provider access.' : res.status === 429 ? 'Historical chart rate limited.' : 'Historical chart unavailable.');
        const raw = await res.json();
        if (raw.symbol !== symbol || !Array.isArray(raw.bars))
            throw new Error('Invalid chart data.');
        for (const bar of raw.bars) {
            const close = Number(bar.close) / 31.1034768;
            if (Number.isFinite(close) && close > 0 && bar.bar_start) {
                map.set(bar.bar_start, { date: bar.bar_start, close, high: bar.high == null ? null : Number(bar.high) / 31.1034768, low: bar.low == null ? null : Number(bar.low) / 31.1034768, provisional: bar.is_closed !== true });
            }
        }
        cursor = typeof raw.next_cursor === 'string' && raw.next_cursor ? raw.next_cursor : null;
        if (cursor && seen.has(cursor))
            throw new Error('Invalid chart pagination.');
        if (cursor)
            seen.add(cursor);
    } while (cursor);
    return [...map.values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
