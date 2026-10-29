import React from 'react';
import { ProductImage } from '../../components/ui/ProductImage';
import { Image, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Body, Button, Empty, Heading, Screen, Subheading } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import { useCatalog } from '../../context/CatalogContext';
import type { RootStack } from '../../navigation/types';
import { enquire } from '../../services/whatsapp';
import { inr } from '../../utils/format';

type Props = NativeStackScreenProps<RootStack, 'Enquiry'>;

export function EnquiryScreen({ route }: Props) {
  const { products } = useCatalog();
  const findProduct = (id: string) => products.find(p => p.id === id);
  const p = findProduct(route.params.id);
  if (!p) return <Empty label="Product not found" />;

  return (
    <Screen>
      <Heading>Enquire on WhatsApp</Heading>
      <ProductImage product={p} style={styles.image} />
      <Subheading>{p.name}</Subheading>
      <Body>
        {`Product ID: ${p.id}\nMetal: ${p.metal}\nPurity: ${p.purity}\nWeight: ${p.weight}\nIndicative Price: ${inr(p.price)}\n\nPlease confirm availability and final price.`}
      </Body>
      <Button title="Send on WhatsApp" variant="whatsapp" onPress={() => enquire([p])} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { height: 240, borderRadius: radius.md, backgroundColor: colors.line },
});
