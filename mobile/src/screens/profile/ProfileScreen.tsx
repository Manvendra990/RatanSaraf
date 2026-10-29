import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Caption, Heading, ListRow, Screen } from '../../components/ui';
import { useRootNavigation } from '../../hooks/useRootNavigation';

const PENDING_BACKEND = 'Requires backend integration';

export function ProfileScreen() {
  const auth = useAuth();
  const navigation = useRootNavigation();

  return (
    <Screen>
      <Heading>My Profile</Heading>
      <Caption style={{ marginBottom: 20 }}>{auth.user ? `${auth.user.name} · ${auth.user.email}` : 'Guest account'}</Caption>

      <ListRow label="Gold SIP Yojana" onPress={() => navigation.navigate('Sip')} />
      <ListRow label="My Enquiries" hint={PENDING_BACKEND} />
      <ListRow label="My Orders" hint={PENDING_BACKEND} />
      <ListRow label="Wishlist" onPress={() => navigation.navigate('Wishlist')} />
      <ListRow label="Saved Addresses" hint={PENDING_BACKEND} />
      <ListRow label="Metal Rate Alerts" hint={PENDING_BACKEND} />
      <ListRow label="Visit Our Store" onPress={() => navigation.navigate('StoreInfo')} />
      <ListRow label="Settings" hint={PENDING_BACKEND} />
      <ListRow label="Help & Support" hint={PENDING_BACKEND} />

      <Button title={auth.user ? "Sign out" : "Login"} variant="secondary" onPress={() => { void auth.logout().finally(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })); }} />
    </Screen>
  );
}
