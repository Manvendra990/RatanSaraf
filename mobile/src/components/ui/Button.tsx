import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'gold' | 'whatsapp';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
};

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.maroon, fg: colors.goldLight, border: colors.maroon },
  secondary: { bg: 'transparent', fg: colors.maroon, border: colors.maroon },
  gold: { bg: colors.gold, fg: colors.maroonDark, border: colors.gold },
  whatsapp: { bg: colors.whatsapp, fg: '#FFFFFF', border: colors.whatsapp },
};

export function Button({ title, onPress, variant = 'primary', disabled }: Props) {
  const p = palette[variant];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, { backgroundColor: p.bg, borderColor: p.border }, disabled && styles.disabled]}
    >
      <Text style={[styles.label, { color: p.fg }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginVertical: 7,
  },
  label: { fontWeight: '700', fontSize: 15, letterSpacing: 0.4 },
  disabled: { opacity: 0.5 },
});
