import { useCatalog } from '../../context/CatalogContext';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Logo, Screen } from '../../components/ui';
import { STORE } from '../../constants/store';
import { colors } from '../../constants/theme';
import type { RootStack } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStack, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useCatalog();
  const auth = useAuth();
  return (
    <Screen dark safeTop scroll={false}>
      <View style={styles.center}>
        <Logo width={260} />
        <Text style={styles.name}>{STORE.name.toUpperCase()}</Text>
        <Text style={styles.descriptor}>{STORE.descriptor}</Text>
        <Text style={styles.tagline}>{STORE.tagline}</Text>
      </View>
      <Button title="Get Started" variant="gold" disabled={!auth.ready} onPress={() => navigation.replace(auth.user ? 'Main' : 'Login')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { marginTop: 28, fontSize: 28, letterSpacing: 4, color: colors.goldLight, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  descriptor: { marginTop: 6, letterSpacing: 8, color: colors.gold, fontWeight: '600' },
  tagline: { marginTop: 26, color: colors.onDark, opacity: 0.8, textAlign: 'center' },
});
