import React from 'react';
import { RateCalculatorScreen } from '../screens/calculator/RateCalculatorScreen';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HeaderBrand } from '../components/ui';
import { colors } from '../constants/theme';
import {
  CategoriesScreen,
  HomeScreen,
  ProfileScreen,
  RatesScreen,
} from '../screens';
import { useRootNavigation } from '../hooks/useRootNavigation';
import type { TabParams } from './types';

const Tabs = createBottomTabNavigator<TabParams>();

const icon =
  (glyph: string) =>
  ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;

export function MainTabs() {
  const navigation = useRootNavigation();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerTitle: () => <HeaderBrand onMenuPress={() => navigation.navigate('Menu')} />,
        headerStyle: { backgroundColor: colors.maroon },
        headerTintColor: colors.goldLight,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.maroon,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: icon('⌂') }}
      />
      <Tabs.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{ title: 'Categories', tabBarIcon: icon('▦') }}
      />
      <Tabs.Screen
        name="RatesTab"
        component={RatesScreen}
        options={{ title: 'Metal Rates', tabBarLabel: 'Rates', tabBarIcon: icon('₹') }}
      />
      <Tabs.Screen
        name="CalculatorTab"
        component={RateCalculatorScreen}
        options={{ title: 'Rate Calculator', tabBarLabel: 'Calculator', tabBarIcon: icon('▤') }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: icon('☺') }}
      />
    </Tabs.Navigator>
  );
}
