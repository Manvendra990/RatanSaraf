import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../../constants/theme';

type Props = { label: string; hint?: string; onPress?: () => void };

export function ListRow({ label, hint, onPress }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress} style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  flex: { flex: 1 },
  label: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  chevron: { color: colors.gold, fontSize: 24, marginLeft: 8 },
});
