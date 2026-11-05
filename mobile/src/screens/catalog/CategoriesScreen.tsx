import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {GenderFilter} from '../../components/ui/GenderFilter';
import type {Gender} from '../../types';
import { Caption, Grid, Heading, MetalToggle, Screen } from '../../components/ui';
import { colors, radius, shadow } from '../../constants/theme';
import { useCatalog } from '../../context/CatalogContext';
import { useRootNavigation } from '../../hooks/useRootNavigation';
import type { RootStack } from '../../navigation/types';
import type { Metal } from '../../types';

export function CategoriesScreen() {
  const { categories,products } = useCatalog();
  const navigation = useRootNavigation();
  // Shared by the "Categories" tab (no params) and the stack route (optional metal).
  const route = useRoute<RouteProp<RootStack, 'Categories'>>();
  const [metal, setMetal] = useState<Metal>(route.params?.metal ?? 'Gold');

  const [gender,setGender]=useState<Gender|'All'>('All');
  const shown=categories[metal].filter(cat=>gender==='All'||products.some(p=>p.category===cat&&p.metal===metal&&p.gender===gender));
  return (
    <Screen>
      <Heading>Categories</Heading>
      <MetalToggle value={metal} onChange={setMetal} />
      <GenderFilter value={gender} onChange={setGender}/>
      <Grid>
        {shown.map(cat => (
          <TouchableOpacity
            key={cat}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Listing', { metal, category: cat,...(gender==='All'?{}:{gender}) })}
            style={styles.tile}
          >
            <Text style={styles.icon}>{metal === 'Gold' ? '◆' : '◈'}</Text>
            <Text style={styles.label}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </Grid>
      {!shown.length&&<Caption>No jewellery classified for this selection yet. Choose All to browse the complete collection.</Caption>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    paddingVertical: 26,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    ...shadow,
  },
  icon: { fontSize: 32, color: colors.gold },
  label: { color: colors.maroon, fontWeight: '600', marginTop: 12 },
});
