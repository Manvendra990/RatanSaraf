import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../constants/theme';
import { Logo } from './Logo';

/** Maroon brand card used at the top of Login / Register. */
export function AuthBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.card}>
      <Logo width={140} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.maroon,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: { color: colors.goldLight, fontSize: 24, fontWeight: '700', marginTop: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { color: colors.onDark, marginTop: 4, opacity: 0.85 },
});
