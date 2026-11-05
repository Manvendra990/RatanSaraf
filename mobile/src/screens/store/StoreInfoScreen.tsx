import { useCatalog } from '../../context/CatalogContext';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Caption, InfoRow, Logo, Screen, Subheading } from '../../components/ui';
import { STORE, fullAddress } from '../../constants/store';
import { colors, radius } from '../../constants/theme';
import { callStore, openDirections } from '../../services/maps';
import { contactStore } from '../../services/whatsapp';

export function StoreInfoScreen() {
  useCatalog();
  return (
    <Screen>
      <View style={styles.hero}>
        <Logo width={180} />
        <Text style={styles.name}>{STORE.name.toUpperCase()}</Text>
        <Text style={styles.descriptor}>{STORE.descriptor}</Text>
      </View>

      <Subheading>About the Store</Subheading>
      <Body>{STORE.tagline}. Visit us in Gwalior for gold and silver jewellery, or enquire right from the app.</Body>

      <Subheading>Store Details</Subheading>
      <InfoRow label="Owner" value={STORE.ownerName} />
      <InfoRow label="Address" value={fullAddress()} />
      <InfoRow label="City" value={`${STORE.city}, ${STORE.state}`} />
      <InfoRow label="PIN code" value={STORE.pincode} />
      {STORE.phone ? <InfoRow label="Phone" value={STORE.phone} /> : null}

      <Button title="Get Directions" variant="gold" onPress={openDirections} />
      <Button title="Call Store" variant="secondary" onPress={callStore} />
      <Button title="Message on WhatsApp" variant="whatsapp" onPress={contactStore} />
      <Caption style={{ textAlign: 'center', marginTop: 8 }}>
        Opens Google Maps with directions to {STORE.name}, {STORE.addressLine1}.
      </Caption>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.maroon,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: 28,
  },
  name: { color: colors.goldLight, fontSize: 22, letterSpacing: 3, marginTop: 16, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  descriptor: { color: colors.gold, letterSpacing: 7, marginTop: 4, fontWeight: '600' },
});
