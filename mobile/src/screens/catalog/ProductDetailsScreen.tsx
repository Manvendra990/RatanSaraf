import React from 'react';
import { ProductImage } from '../../components/ui/ProductImage';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Body, Button, Caption, Empty, Heading, Screen, Subheading } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import { useShop } from '../../context/ShopContext';
import { useCatalog } from '../../context/CatalogContext';
import type { RootStack } from '../../navigation/types';
import { contactStore } from '../../services/whatsapp';
import { inr } from '../../utils/format';

type Props = NativeStackScreenProps<RootStack, 'Product'>;

export function ProductDetailsScreen({ navigation, route }: Props) {
  const { products } = useCatalog();
  const findProduct = (id: string) => products.find(p => p.id === id);
  const product = findProduct(route.params.id);
  const { add, favorites, toggle } = useShop();

  if (!product) return <Empty label="Product not found" />;
  const saved = favorites.includes(product.id);

  return (
    <Screen>
      <ProductImage product={product} style={styles.image} />
      <Heading>{product.name}</Heading>
      <Caption>
        {product.purity} · {product.weight}
      </Caption>
      {product.coinWeight ? <Text style={styles.price}>{inr(product.price || 0)}</Text> : <Caption>{product.availability || 'Contact us to check availability'}</Caption>}
      <Button title="Contact us" variant="secondary" onPress={() => void contactStore()} />
      <Subheading>Specifications</Subheading>
      {[
        ['Product Name', product.name], ['Brand Name', product.brand], ['Product Code', product.productCode],
        ['Availability', product.availability], ['Product Metal', product.metal], ['Product Purity', product.purity],
        ['Product Colour', product.colour], ['Net Weight', product.weight], ['Certified by', product.certifiedBy],
      ].filter(([,v]) => !!v).map(([k,v]) => <View key={k} style={{ flexDirection:'row',justifyContent:'space-between',gap:14,paddingVertical:9 }}><Text style={{color:colors.muted,flex:1}}>{k}</Text><Text style={{color:colors.ink,flex:1,textAlign:'right'}}>{v}</Text></View>)}

      <Subheading>Product Description</Subheading>
      <Body>{product.description}</Body>

      <Button
        title="Add to Cart"
        onPress={() => {
          if (product.stock === 0) { Alert.alert('Out of stock','Contact the store for availability'); return; }
          add(product.id);
          Alert.alert('Added', 'Product added to your cart');
        }}
      />
      <Button
        title={saved ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
        variant="secondary"
        onPress={() => toggle(product.id)}
      />
      <Button
        title="Enquire on WhatsApp"
        variant="whatsapp"
        onPress={() => navigation.navigate('Enquiry', { id: product.id })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { height: 310, borderRadius: radius.lg, backgroundColor: colors.line },
  price: { fontSize: 26, color: colors.maroon, fontWeight: '700', marginVertical: 10 },
});
