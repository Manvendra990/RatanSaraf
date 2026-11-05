import React from 'react';
import { RateCalculatorScreen } from '../screens/calculator/RateCalculatorScreen';
import Svg, { Path } from 'react-native-svg';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {HeaderActions} from '../components/ui/HeaderActions';
import {AppIcon} from '../components/ui/AppIcon';
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
        headerRight: () => <HeaderActions/>,
        headerTitleAlign:'left',
        headerTitleContainerStyle:{left:8,right:122},
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
        options={{ title: 'Gold Rate', tabBarLabel: 'Gold Rate', tabBarLabelStyle:{fontWeight:'800',color:colors.maroon}, tabBarIcon: () => <View style={{backgroundColor:colors.goldLight,borderRadius:28,padding:8,marginTop:-12,borderWidth:2,borderColor:colors.maroon}}><Svg width={28} height={25} viewBox="0 0 32 28"><Path d="M8 5h16l6 18H2L8 5Z M8 5l4 18 M24 5l-4 18 M2 23h28" fill="#D4AF37" stroke={colors.maroon} strokeWidth={2}/></Svg></View> }}
      />
      <Tabs.Screen
        name="CalculatorTab"
        component={RateCalculatorScreen}
        options={{ title: 'Rate Calculator', tabBarLabel: 'Calculator', tabBarIcon: icon('▤') }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({color}) => <AppIcon name="user" size={22} color={color}/> }}
      />
    </Tabs.Navigator>
  );
}
