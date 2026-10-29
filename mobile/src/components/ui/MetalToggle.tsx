import React from 'react';
import { StyleSheet, View } from 'react-native';
import { METALS } from '../../data/categories';
import type { Metal } from '../../types';
import { Button } from './Button';

type Props = { value: Metal; onChange: (m: Metal) => void };

export function MetalToggle({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {METALS.map(m => (
        <View key={m} style={styles.cell}>
          <Button title={m} variant={m === value ? 'primary' : 'secondary'} onPress={() => onChange(m)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 12 }, cell: { flex: 1 } });
