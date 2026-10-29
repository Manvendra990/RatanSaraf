import { api, hasSession } from './api';
import { Alert, Linking } from 'react-native';
import { STORE } from '../constants/store';
import type { Product } from '../types';
import { inr } from '../utils/format';

async function openWhatsApp(body: string) {
  if (!STORE.whatsapp) {
    Alert.alert(
      'WhatsApp not configured',
      'Ask the store to configure its WhatsApp number in admin Settings.',
    );
    return;
  }
  const url = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open WhatsApp', 'Please install WhatsApp or try again.');
  }
}

/** Enquiry about one or more products. */
export async function enquire(items: Product[], quantities: Record<string, number> = {}) {
  const body = [
    `Hello ${STORE.name}, I am interested in the following products:`,
    ...items.map(
      p =>
        `• ${p.name} (${p.id}) | ${p.purity} | ${p.weight} | Qty ${quantities[p.id] ?? 1} | Indicative price ${inr(p.price)}`,
    ),
    'Please confirm availability and final price.',
  ].join('\n');
  if (STORE.whatsapp && hasSession()) {
    try { await Promise.all(items.map(p => api('/enquiries','POST',{productId:p.id,message:body.slice(0,1000)}))); }
    catch { Alert.alert('Enquiry record not saved','WhatsApp will still open. Check your connection to save future enquiry records.'); }
  }
  return openWhatsApp(body);
}

/** General greeting, no product attached. */
export const contactStore = () =>
  openWhatsApp(`Hello ${STORE.name}, I would like to know more about your jewellery collection.`);
