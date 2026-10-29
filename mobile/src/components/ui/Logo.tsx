import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const source = require('../../assets/images/logo-gold.png');

/** The gold "Rtn" monogram (transparent PNG, aspect 900:576). */
export function Logo({ width = 160, style }: { width?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[{ width, height: (width * 576) / 900 }, style]}
      accessibilityLabel="Ratan Lal Saraf logo"
    />
  );
}
