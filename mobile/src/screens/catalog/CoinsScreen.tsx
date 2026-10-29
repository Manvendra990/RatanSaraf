import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Caption, Grid, Heading, ProductCard, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { coinWeights } from '../../data/products';
import { useCatalog } from '../../context/CatalogContext';
import type { RootStack } from '../../navigation/types';

export function CoinsScreen({ navigation, route }: NativeStackScreenProps<RootStack, 'Coins'>) {
  const { products } = useCatalog();
  const findProduct = (id: string) => products.find(p => p.id === id);
  const { metal } = route.params;
  const [weight, setWeight] = useState<number | null>(null);
  useEffect(() => setWeight(null), [metal]);
  const result = products.filter(p => p.category === 'Coins' && p.metal === metal && (weight === null || p.coinWeight === weight));
  return (
    <Screen>
      <Heading>{metal} Coins</Heading>
      <Caption>Choose a weight. Confirm availability and final price with the store.</Caption>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 16 }}>
        {[null, ...coinWeights].map(w => (
          <TouchableOpacity key={w ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: weight === w }} onPress={() => setWeight(w)} style={[styles.chip, weight === w && styles.active]}>
            <Text style={{ color: weight === w ? colors.goldLight : colors.maroon, fontWeight: '600' }}>{w === null ? 'All' : `${w}g`}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Grid>{result.map(p => <ProductCard key={p.id} product={p} onPress={() => navigation.navigate('Product', { id: p.id })} />)}</Grid>
    </Screen>
  );
}
const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 24, borderWidth: 1, borderColor: colors.gold },
  active: { backgroundColor: colors.maroon },
});
