import React from 'react';
import { Platform, StyleSheet, Text, TextStyle } from 'react-native';
import { colors, spacing } from '../../constants/theme';

type Props = { children: React.ReactNode; light?: boolean; style?: TextStyle };

export const Heading = ({ children, light, style }: Props) => (
  <Text style={[styles.heading, { color: light ? colors.goldLight : colors.maroon }, style]}>
    {children}
  </Text>
);

export const Subheading = ({ children, light, style }: Props) => (
  <Text style={[styles.sub, { color: light ? colors.goldLight : colors.maroon }, style]}>
    {children}
  </Text>
);

export const Body = ({ children, light, style }: Props) => (
  <Text style={[styles.body, { color: light ? colors.onDark : colors.ink }, style]}>{children}</Text>
);

export const Caption = ({ children, light, style }: Props) => (
  <Text style={[styles.caption, { color: light ? colors.goldLight : colors.muted }, style]}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '700', marginVertical: spacing.md, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sub: { fontSize: 17, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 18 },
});
