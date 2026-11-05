import React from 'react';
import { Empty, Grid, Heading, ProductCard, Screen } from '../../components/ui';
import { useShop } from '../../context/ShopContext';
import { useCatalog } from '../../context/CatalogContext';
import { useRootNavigation } from '../../hooks/useRootNavigation';

export function WishlistScreen() {
  const { products } = useCatalog();
  const findProduct = (id: string) => products.find(p => p.id === id);
  const navigation = useRootNavigation();
  const { favorites } = useShop();
  const list = products.filter(p => favorites.includes(p.id));

  return (
    <Screen>
      <Heading>My Wishlist</Heading>
      <Grid>
        {list.map(p => (
          <ProductCard key={p.id} product={p} onPress={() => navigation.navigate('Product', { id: p.id })} />
        ))}
      </Grid>
      {!list.length && <Empty label="Save jewellery you love to see it here." />}
    </Screen>
  );
}
