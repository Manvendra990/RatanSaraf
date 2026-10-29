import React from 'react';
import { ProductImage } from '../../components/ui/ProductImage';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Caption, Empty, Heading, Screen, Subheading } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import { useShop } from '../../context/ShopContext';
import { useCatalog } from '../../context/CatalogContext';
import { enquire } from '../../services/whatsapp';
import type { Product } from '../../types';
import { inr } from '../../utils/format';

export function CartScreen() {
  const { products } = useCatalog();
  const findProduct = (id: string) => products.find(p => p.id === id);
  const { cart, change } = useShop();

  const lines = cart
    .map(x => ({ p: findProduct(x.id), qty: x.qty }))
    .filter((x): x is { p: Product; qty: number } => !!x.p);
  const subtotal = lines.reduce((n, x) => n + x.p.price * x.qty, 0);

  return (
    <Screen>
      <Heading>My Cart</Heading>
      {lines.map(({ p, qty }) => (
        <View key={p.id} style={styles.line}>
          <ProductImage product={p} style={styles.thumb} />
          <View style={styles.flex}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.price}>{inr(p.price)}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => change(p.id, -1)} style={styles.qtyBtn}>
                <Text style={styles.qtyIcon}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{qty}</Text>
              <TouchableOpacity onPress={() => change(p.id, 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {lines.length ? (
        <>
          <Subheading>Estimated Subtotal: {inr(subtotal)}</Subheading>
          <Caption>Taxes, making charges and final price must be confirmed with the store.</Caption>
          <Button title="Proceed to WhatsApp Enquiry" variant="whatsapp" onPress={() => enquire(lines.map(x => x.p), Object.fromEntries(lines.map(x => [x.p.id, x.qty])))} />
        </>
      ) : (
        <Empty label="Your cart is empty." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  line: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 12,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  thumb: { width: 90, height: 95, borderRadius: radius.sm, backgroundColor: colors.line },
  name: { color: colors.ink, fontWeight: '700' },
  price: { color: colors.maroon, fontWeight: '600', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyIcon: { fontSize: 18, color: colors.maroon, lineHeight: 22 },
  qty: { color: colors.ink, fontWeight: '600', minWidth: 14, textAlign: 'center' },
});
