import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Metal } from '../types';

export type TabParams = {
  Home: undefined;
  CategoriesTab: undefined;
  RatesTab: undefined;
  CalculatorTab: undefined;
  ProfileTab: undefined;
};

export type RootStack = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<TabParams> | undefined;
  Categories: { metal?: Metal } | undefined;
  Listing: { metal?: Metal; category?: string; gender?: import('../types').Gender } | undefined;
  Coins: { metal: Metal };
  Product: { id: string };
  Enquiry: { id: string };
  Rates: { metal?: Metal } | undefined;
  Cart: undefined;
  Wishlist: undefined;
  Notifications: undefined;
  ManualKyc: undefined;
  Sip: undefined;
  Menu: undefined;
  Profile: undefined;
  StoreInfo: undefined;
};
