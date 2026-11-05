import React, { useState,useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {GenderFilter} from '../../components/ui/GenderFilter';
import type {Gender} from '../../types';
import { Empty, Field, Grid, Heading, ProductCard, Screen } from '../../components/ui';
import { useCatalog } from '../../context/CatalogContext';
import { useRootNavigation } from '../../hooks/useRootNavigation';
import type { RootStack } from '../../navigation/types';

export function ListingScreen() {
  const { products } = useCatalog();
  const findProduct = (id: string) => products.find(p => p.id === id);
  const navigation = useRootNavigation();
  const route = useRoute<RouteProp<RootStack, 'Listing'>>();
  const [search, setSearch] = useState('');
  const [gender,setGender]=useState<Gender|'All'>(route.params?.gender||'All');
  useEffect(()=>setGender(route.params?.gender||'All'),[route.params?.gender]);

  const metal = route.params?.metal;
  const category = route.params?.category;

  const result = products.filter(
    p =>
      p.category !== 'Coins' &&
      (!metal || p.metal === metal) &&
      (gender==='All'||p.gender===gender) &&
      (!category || p.category === category) &&
      `${p.name} ${p.productCode || ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  const title = category ? `${metal ?? ''} ${category}`.trim() : metal ? `${metal} Jewellery` : 'All Jewellery';

  return (
    <Screen>
      <Heading>{title}</Heading>
      <Field placeholder="Search jewellery..." value={search} onChangeText={setSearch} />
      <GenderFilter value={gender} onChange={setGender}/>
      <Grid>
        {result.map(p => (
          <ProductCard key={p.id} product={p} onPress={() => navigation.navigate('Product', { id: p.id })} />
        ))}
      </Grid>
      {!result.length && <Empty label="No matching jewellery in the collection." />}
    </Screen>
  );
}
