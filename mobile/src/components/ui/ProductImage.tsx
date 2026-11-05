import React from 'react';
import { Image, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import type { Product } from '../../types';

/** Coin illustration is a placeholder until actual store photographs are supplied. */
export function ProductImage({ product, style }: { product: Product; style: StyleProp<ViewStyle> }) {
  if (product.image || product.category !== 'Coins') return <View style={[style, { overflow: 'hidden' }]}><Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /></View>;
  const gold = product.metal === 'Gold';
  return <View style={[style, { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
    <Svg width="90%" height="90%" viewBox="0 0 180 180">
      <Circle cx="90" cy="90" r="76" fill={gold ? '#E9C15B' : '#DCE0E4'} stroke={gold ? '#B78217' : '#8C959E'} strokeWidth="5" />
      <Circle cx="90" cy="90" r="65" fill="none" stroke={gold ? '#B78217' : '#8C959E'} strokeWidth="2" />
      <SvgText x="90" y="67" textAnchor="middle" fontSize="16" fill="#4A0B12">{product.metal.toUpperCase()}</SvgText>
      <SvgText x="90" y="104" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#4A0B12">{product.coinWeight}g</SvgText>
      <SvgText x="90" y="128" textAnchor="middle" fontSize="12" fill="#4A0B12">999 • DEMO</SvgText>
    </Svg>
  </View>;
}
