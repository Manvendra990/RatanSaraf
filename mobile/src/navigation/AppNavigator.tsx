import React,{useState} from 'react';
import {HeaderActions} from '../components/ui/HeaderActions';
import {FloatingContact} from '../components/ui/FloatingContact';
import {NotificationsScreen} from '../screens/notifications/NotificationsScreen';
import { ManualKycScreen } from '../screens/sip/ManualKycScreen';
import { SipScreen } from '../screens/sip/SipScreen';
import { Pressable, Text, View } from 'react-native';
import { CoinsScreen } from '../screens/catalog/CoinsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/theme';
import {
  CartScreen,
  CategoriesScreen,
  EnquiryScreen,
  ListingScreen,
  LoginScreen,
  MenuScreen,
  ProductDetailsScreen,
  ProfileScreen,
  RatesScreen,
  RegisterScreen,
  SplashScreen,
  StoreInfoScreen,
  WishlistScreen,
} from '../screens';
import { MainTabs } from './MainTabs';
import type { RootStack } from './types';

const Stack = createNativeStackNavigator<RootStack>();

export default function AppNavigator() {
  const [routeName,setRouteName]=useState('Splash');
  return (
    <NavigationContainer onStateChange={state=>{let r:any=state;while(r?.routes){r=r.routes[r.index||0];if(r.state)r=r.state;else break;}setRouteName(r?.name||'Splash');}}>
     <View style={{flex:1}}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={({ navigation }) => ({
          headerRight: () => <HeaderActions/>,
          headerStyle: { backgroundColor: colors.maroon },
          headerTintColor: colors.goldLight,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        })}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />

        <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
        <Stack.Screen name="Listing" component={ListingScreen} options={{ title: 'Collection' }} />
        <Stack.Screen name="Product" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
        <Stack.Screen name="Enquiry" component={EnquiryScreen} options={{ title: 'WhatsApp Enquiry' }} />
        <Stack.Screen name="Rates" component={RatesScreen} options={{ title: 'Metal Rates' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{title:'Notifications'}}/>
        <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
        <Stack.Screen name="ManualKyc" component={ManualKycScreen} options={{ title: 'Personal Details' }} />
        <Stack.Screen name="Sip" component={SipScreen} options={{ title: 'Gold & Silver' }} />
        <Stack.Screen name="Coins" component={CoinsScreen} options={{ title: 'Coins' }} />
        <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false, presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
        <Stack.Screen name="StoreInfo" component={StoreInfoScreen} options={{ title: 'Visit Our Store' }} />
      </Stack.Navigator>
      {!['Splash','Login','Register','Menu','ManualKyc'].includes(routeName)&&<FloatingContact key={routeName}/>}
     </View>
    </NavigationContainer>
  );
}
