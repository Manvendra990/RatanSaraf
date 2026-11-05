import React, { useCallback } from 'react';
import { setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useCatalog } from '../../context/CatalogContext';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  /** Deep maroon background (splash / auth screens). */
  dark?: boolean;
  /** Add status-bar padding — use on screens that have no navigation header. */
  safeTop?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = true, dark = false, safeTop = false, contentStyle }: Props) {
  const { refresh } = useCatalog();
  useFocusEffect(useCallback(() => { setStatusBarStyle(dark || !safeTop ? 'light' : 'dark'); void refresh(); }, [refresh, dark, safeTop]));
  const insets = useSafeAreaInsets();
  const backgroundColor = dark ? colors.maroon : colors.bg;
  const padding = {
    padding: spacing.lg,
    paddingTop: spacing.lg + (safeTop ? insets.top : 0),
    paddingBottom: spacing.xxl + spacing.md,
  };

  if (!scroll) {
    return <View style={[styles.flex, { backgroundColor }, padding, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor }]}
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
