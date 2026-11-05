import { Alert, Linking } from 'react-native';
import { STORE } from '../constants/store';

export async function openDirections() {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    STORE.mapQuery,
  )}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open Maps', 'Please try again later.');
  }
}

export async function callStore() {
  if (!STORE.phone) {
    Alert.alert('Phone not configured', 'Add the store phone number in src/constants/store.ts.');
    return;
  }
  try {
    await Linking.openURL(`tel:${STORE.phone}`);
  } catch {
    Alert.alert('Unable to place call');
  }
}
