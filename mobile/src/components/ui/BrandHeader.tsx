import { useCatalog } from '../../context/CatalogContext';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STORE } from '../../constants/store';
import { colors } from '../../constants/theme';
import { Logo } from './Logo';

export function HeaderBrand({ onMenuPress }: { onMenuPress: () => void }) {
  useCatalog();
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Open sidebar"
        hitSlop={8}
        style={({ pressed }) => [
          styles.menuButton,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </Pressable>

      <View style={styles.brand}>
        <Logo width={40} />
        <Text style={styles.name} numberOfLines={1}>
          {STORE.name.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    width: 22,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.goldLight,
  },
  pressed: {
    opacity: 0.6,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flexShrink: 1,
    color: colors.goldLight,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
});