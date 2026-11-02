
import { useCatalog } from '../../context/CatalogContext';
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STORE } from '../../constants/store';
import { colors } from '../../constants/theme';
import { useRootNavigation } from '../../hooks/useRootNavigation';
import { Logo } from './Logo';

export function HeaderBrand({ onMenuPress }: { onMenuPress: () => void }) {
  useCatalog();
  const navigation = useRootNavigation();

  return (
    <View style={styles.header}>
      {/* Menu */}
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

      {/* Cart - moved before Wishlist */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cart"
        onPress={() => navigation.navigate('Cart')}
        style={styles.menuButton}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24">
          <Path
            d="M2 3h3l3 13h11l3-10H6"
            stroke={colors.goldLight}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="9" cy="21" r="1.5" fill={colors.goldLight} />
          <Circle cx="19" cy="21" r="1.5" fill={colors.goldLight} />
        </Svg>
      </Pressable>

      {/* Wishlist - moved after Cart */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Wishlist"
        onPress={() => navigation.navigate('Wishlist')}
        style={styles.menuButton}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24">
          <Path
            d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
            stroke={colors.goldLight}
            strokeWidth={1.8}
            fill="none"
          />
        </Svg>
      </Pressable>

      {/* Brand */}
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
