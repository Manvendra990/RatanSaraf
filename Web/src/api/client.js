/** All business data is read from the SAME backend as the supplied mobile app.
 *  No sample inventory, fabricated metal rates or replacement backend.
 */
const BASE = (import.meta.env.VITE_API_BASE_URL || '/backend').replace(/\/$/, '');
const LOGIN = import.meta.env.VITE_LOGIN_PATH || '/auth/login';
const REGISTER = import.meta.env.VITE_REGISTER_PATH || '/auth/register';
const SESSION_KEY = 'ratan_web_session';

function safeParse(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function getSession() { return safeParse(sessionStorage.getItem(SESSION_KEY)); }
export function setSession(session) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}
export function hasSession() { return Boolean(getSession()?.token || getSession()?.user); }

export async function api(path, { method = 'GET', body, signal, auth = true } = {}) {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const session = auth ? getSession() : null;
  const headers = { Accept: 'application/json' };
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal,
      cache: method === 'GET' ? 'no-store' : 'default',
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new Error('Cannot reach the store backend. Check API configuration and connection.');
  }
  const raw = await response.text();
  let value = null;
  try { value = raw ? JSON.parse(raw) : null; } catch { value = raw; }
  if (!response.ok) {
    const msg = typeof value?.message === 'string' ? value.message :
      Array.isArray(value?.message) ? value.message.join(', ') :
        typeof value?.error === 'string' ? value.error : `Request failed (${response.status})`;
    throw new Error(msg);
  }
  return value;
}

// Paths verified from supplied React Native code.
export const getCatalog = (signal) => api('/catalog', { signal, auth: false });
export const getStore = (signal) => api('/store', { signal, auth: false });
export const getHome = (signal) => api('/home', { signal, auth: false });
export const getStoreRates = (signal) => api('/gold/rates', { signal, auth: false });
export const submitEnquiry = (productId, message) => api('/enquiries', { method: 'POST', body: { productId, message } });

// Paths below are CONFIGURABLE: their original implementation was not included
// in the uploaded partial mobile sources.
export async function signIn(identifier, password) {
  const response = await api(LOGIN, { method: 'POST', body: { identifier, password }, auth: false });
  const token = response?.accessToken || response?.access_token || response?.token || response?.data?.accessToken || response?.data?.access_token || null;
  const user = response?.user || response?.data?.user || null;
  if (!token && !user) throw new Error('Login response was not recognized. Match the existing backend auth contract in src/api/client.js.');
  const session = { token, user };
  setSession(session);
  return session;
}
export async function registerUser(form) {
  return api(REGISTER, { method: 'POST', body: form, auth: false });
}
