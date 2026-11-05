import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

export const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.line },
  label: { width: 110, color: colors.muted, fontSize: 13 },
  value: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '500' },
});
