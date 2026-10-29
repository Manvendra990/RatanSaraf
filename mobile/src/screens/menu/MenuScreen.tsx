import { useCatalog } from '../../context/CatalogContext';
import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Logo } from '../../components/ui';
import { STORE } from '../../constants/store';
import { colors } from '../../constants/theme';
import type { RootStack } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStack, 'Menu'>;

export function MenuScreen({ navigation }: Props) {
  useCatalog();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.86, 360);
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const close = (after?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) { navigation.goBack(); after?.(); }
    });
  };
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: 240, useNativeDriver: true });
    animation.start();
    const back = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => { animation.stop(); back.remove(); };
  }, [navigation, progress]);

  const links: { label: string; go: () => void }[] = [
    { label: 'Home', go: () => navigation.navigate('Main', { screen: 'Home' }) },
    { label: 'All Categories', go: () => navigation.navigate('Categories') },
    { label: 'Gold Jewellery', go: () => navigation.navigate('Listing', { metal: 'Gold' }) },
    { label: 'Silver Jewellery', go: () => navigation.navigate('Listing', { metal: 'Silver' }) },
    { label: 'Gold Coins', go: () => navigation.navigate('Coins', { metal: 'Gold' }) },
    { label: 'Silver Coins', go: () => navigation.navigate('Coins', { metal: 'Silver' }) },
    { label: 'Metal Rates (Demo)', go: () => navigation.navigate('Rates', { metal: 'Gold' }) },
    { label: 'Gold SIP Yojana', go: () => navigation.navigate('Sip') },
    { label: 'My Cart', go: () => navigation.navigate('Cart') },
    { label: 'Wishlist', go: () => navigation.navigate('Wishlist') },
    { label: 'My Profile', go: () => navigation.navigate('Profile') },
    { label: 'Visit Our Store', go: () => navigation.navigate('StoreInfo') },
  ];
  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress, backgroundColor: '#00000080' }]} />
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close sidebar" onPress={() => close()} />
      <Animated.View style={[styles.panel, { width: panelWidth, paddingTop: insets.top, paddingBottom: insets.bottom, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-panelWidth, 0] }) }] }]}>
        <View style={styles.brand}>
          <Logo width={44} />
          <View style={{ flex: 1 }}><Text style={styles.name}>{STORE.name.toUpperCase()}</Text><Text style={styles.tagline}>{STORE.descriptor}</Text></View>
          <Pressable onPress={() => close()} accessibilityRole="button" accessibilityLabel="Close sidebar" style={styles.close}><Text style={{ color: colors.goldLight, fontSize: 28 }}>×</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {links.map(link => <Pressable key={link.label} accessibilityRole="button" onPress={() => close(link.go)} style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.line }]}>
            <View style={{ flex: 1 }}><Text style={styles.label}>{link.label}</Text>{link.label.endsWith('Coins') && <Text style={styles.hint}>0.5g · 1g · 10g · 20g · 50g</Text>}</View>
            <Text style={{ color: colors.gold, fontSize: 24 }}>›</Text>
          </Pressable>)}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1 },
  panel: { flex: 1, backgroundColor: colors.bg, elevation: 12 },
  brand: { backgroundColor: colors.maroon, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.goldLight, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  tagline: { color: colors.goldLight, fontSize: 10, marginTop: 4, letterSpacing: 2 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  link: { paddingVertical: 16, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  label: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6 },
});
