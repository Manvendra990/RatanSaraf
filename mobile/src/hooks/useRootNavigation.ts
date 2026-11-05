import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStack } from '../navigation/types';

/** Typed navigation to any root-stack screen, usable from tab screens too. */
export const useRootNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStack>>();
