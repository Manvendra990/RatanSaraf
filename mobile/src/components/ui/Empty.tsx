import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/theme';

export const Empty = ({ label }: { label: string }) => (
  <Text style={styles.text}>{label}</Text>
);

const styles = StyleSheet.create({
  text: { textAlign: 'center', color: colors.muted, padding: 32, fontSize: 14 },
});
