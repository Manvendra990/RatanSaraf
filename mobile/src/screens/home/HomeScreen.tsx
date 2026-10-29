import React from 'react';
import { Platform, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Caption,
  Grid,
  ListRow,
  ProductCard,
  Screen,
  Subheading,
} from '../../components/ui';
import { STORE, fullAddress } from '../../constants/store';
import { colors, radius } from '../../constants/theme';
import { METALS } from '../../data/categories';
import { useCatalog } from '../../context/CatalogContext';
import { useRootNavigation } from '../../hooks/useRootNavigation';
import { quoteTime } from '../../services/metalPrices';
import { inr } from '../../utils/format';
import { useMetalPrices } from '../../hooks/useMetalPrices';

export function HomeScreen() {
  const { products, error: catalogError, refresh: refreshCatalog } = useCatalog();
  const findProduct = (id: string) => products.find(p => p.id === id);
  const navigation = useRootNavigation();
  const { data, loading, error, stale, refresh } = useMetalPrices();
  return (
    <Screen>
      <Pressable style={styles.hero} accessibilityRole="button" accessibilityLabel="Open Gold SIP Yojana" onPress={() => navigation.navigate('Sip')}>
        <Text style={styles.heroKicker}>{STORE.name.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>
          Gold SIP Yojana
        </Text>
        <View style={styles.heroCta}><Text style={styles.heroCtaText}>Start / View Gold SIP</Text></View>
      </Pressable>
      <Subheading>Shop by Metal</Subheading>
      <View style={styles.row}>
        {METALS.map(m => (
          <View key={m} style={styles.flex}>
            <Button
              title={`${m} Collection`}
              onPress={() => navigation.navigate('Categories', { metal: m })}
            />
          </View>
        ))}
      </View>
      <Subheading>Current Metal Rates</Subheading>
      <View style={styles.rateCard}>
        {(['Gold', 'Silver'] as const).map(m => (
          <View key={m} style={styles.flex}>
            <Caption>{m} buy / gram</Caption>
            <Text style={styles.rate}>{data ? inr(data[m].buy) : '—'}</Text>
            {data && <Caption>Sell: {inr(data[m].sell)} / gram</Caption>}
          </View>
        ))}
      </View>
      <Caption>OroPocket buy rates · Before GST</Caption>
      {loading && (
        <ActivityIndicator color={colors.gold} style={{ marginVertical: 8 }} />
      )}
      {data && (
        <Caption>
          Updated {quoteTime(data.timestamp)}
          {stale ? ' · Quote older than 5 min' : ''}
        </Caption>
      )}
      {error && (
        <Text style={styles.error}>
          {error}
          {data ? ' Showing last received quote.' : ''}
        </Text>
      )}
      <Button
        title={loading ? 'Refreshing…' : 'Refresh Rates'}
        variant="secondary"
        onPress={() => {
          if (!loading) void refresh();
        }}
      />
      <Button
        title="View Price Charts"
        variant="secondary"
        onPress={() => navigation.navigate('Rates', { metal: 'Gold' })}
      />
      {catalogError ? <><Caption>{catalogError}</Caption><Button title="Retry Catalogue" variant="secondary" onPress={() => void refreshCatalog()} /></> : null}
      <Subheading>Featured Collection</Subheading>
      <Grid>
        {products.slice(0, 4).map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onPress={() => navigation.navigate('Product', { id: p.id })}
          />
        ))}
      </Grid>
      <Subheading>Visit Our Store</Subheading>
      <ListRow
        label={STORE.name}
        hint={fullAddress()}
        onPress={() => navigation.navigate('StoreInfo')}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.maroon,
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  heroCta: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginVertical: 7 },
  heroCtaText: { color: colors.maroonDark, fontWeight: '700', fontSize: 15, letterSpacing: 0.4 },
  heroKicker: {
    color: colors.gold,
    letterSpacing: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: colors.goldLight,
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 10,
    marginBottom: 8,
    lineHeight: 36,
  },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  rateCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 6,
  },
  rate: { color: colors.maroon, fontSize: 22, fontWeight: '700', marginTop: 2 },
  error: { color: colors.red, fontSize: 12, marginVertical: 8 },
});
