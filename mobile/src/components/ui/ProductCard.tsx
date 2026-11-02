import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadow } from '../../constants/theme';
import { useShop } from '../../context/ShopContext';
import type { Product } from '../../types';
import { inr } from '../../utils/format';

import { ProductImage } from './ProductImage';
import { enquire } from '../../services/whatsapp';

type Props = { product: Product; onPress: () => void };

export function ProductCard({ product, onPress }: Props) {
  const { favorites, toggle, add } = useShop();
  const saved = favorites.includes(product.id);

  return (
    <View style={styles.card}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${product.name}`} activeOpacity={0.9} onPress={onPress}>
      <ProductImage product={product} style={styles.image} />
      <Text numberOfLines={2} style={styles.name}>
        {product.productCode || product.name}
      </Text>
      <Text style={styles.meta}>
        {product.purity} · {product.weight}
      </Text>
      <Text style={styles.price}>{product.coinWeight ? inr(product.price || 0) : (product.availability || 'Contact for availability')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => toggle(product.id)} style={styles.save} hitSlop={8}>
        <Text style={styles.saveText}>{saved ? '♥ Saved' : '♡ Save'}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => { if (product.stock !== undefined && product.stock < 1) { Alert.alert('Out of stock', 'Contact the store for availability'); return; } add(product.id); Alert.alert('Added to cart', product.name); }} style={styles.action}>
        <Text style={styles.actionText}>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => enquire([product])} style={[styles.action, { backgroundColor: colors.whatsapp }]}>
        <Text style={styles.actionText}>WhatsApp Enquiry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 9,
    width: '48%',
    marginBottom: 12,
    ...shadow,
  },
  image: { height: 145, width: '100%', backgroundColor: colors.line, borderRadius: radius.sm },
  name: { fontWeight: '700', color: colors.ink, marginTop: 8 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  price: { fontWeight: '700', color: colors.maroon, marginTop: 4 },
  action: { backgroundColor: colors.maroon, borderRadius: radius.sm, paddingVertical: 10, marginTop: 6, alignItems: 'center' },
  actionText: { color: colors.paper, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  save: { paddingVertical: 6, alignSelf: 'flex-end' },
  saveText: { color: colors.maroonLight, fontSize: 12, fontWeight: '600' },
});
