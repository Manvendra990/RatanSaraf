import React from 'react';
import { StyleSheet, View } from 'react-native';

export const Grid = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.grid}>{children}</View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
