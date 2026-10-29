import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider><CatalogProvider><ShopProvider>
        <AppNavigator />
      </ShopProvider></CatalogProvider></AuthProvider>
    </SafeAreaProvider>
  );
}
