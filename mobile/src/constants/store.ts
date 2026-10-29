/**
 * Single source of truth for store / owner details.
 * Edit this file to update the app everywhere.
 */
export const STORE = {
  name: 'Ratan Lal Saraf',
  ownerName: 'Ratan Lal Saraf',
  tagline: 'Timeless Beauty For Your Special Moments',
  descriptor: 'JEWELLERS',

  addressLine1: 'Daulat Ganj',
  city: 'Gwalior',
  state: 'Madhya Pradesh',
  pincode: '474001',

  // Used for Google Maps directions (taken from the shared Maps link).
  mapQuery:
    'RATAN LAL SARAF GWALIOR, Daulat Ganj, Gwalior, Madhya Pradesh 474001',
  latitude: 26.2014464,
  longitude: 78.1506222,

  // TODO: add the real numbers (country code, digits only, e.g. '919876543210').
  // While empty, the related buttons show a friendly notice.
  whatsapp: '',
  phone: '',
};

export const fullAddress = () =>
  `${STORE.addressLine1}, ${STORE.city}, ${STORE.state} ${STORE.pincode}`;
