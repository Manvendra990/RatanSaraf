import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredBase = process.env.EXPO_PUBLIC_API_URL?.trim();
let token: string | null = null;

function getBase() {
  if (configuredBase) return configuredBase.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    throw new Error(
      'API URL is not configured. Set EXPO_PUBLIC_API_URL in mobile/.env to an address reachable from this device, such as http://<computer-LAN-IP>:3004/api.',
    );
  }

  const host = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
  const apiHost =
    Platform.OS === 'android' && /^(localhost|127\.0\.0\.1)$/.test(host)
      ? '10.0.2.2'
      : host;
  return `http://${apiHost}:3004/api`;
}

export const hasSession = () => !!token;
export const restoreToken = async () => {
  token = await SecureStore.getItemAsync('session');
  return token;
};

export async function setToken(value: string | null) {
  token = value;
  if (value) await SecureStore.setItemAsync('session', value);
  else await SecureStore.deleteItemAsync('session');
}

export async function api(path: string, method = 'GET', body?: any): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${getBase()}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Request failed',
      );
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiMultipart(path: string, body: FormData) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(`${getBase()}${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Upload failed',
      );
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
