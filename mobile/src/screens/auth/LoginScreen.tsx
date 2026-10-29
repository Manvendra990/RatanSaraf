import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthBanner, Button, Caption, Field, Screen } from '../../components/ui';
import type { RootStack } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStack, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const auth = useAuth();
  const [busy,setBusy] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    if (busy) return;
    setBusy(true);
    try { await auth.login(user,password); navigation.replace('Main'); }
    catch(e:any){ Alert.alert('Login failed',e.message); }
    finally {setBusy(false);}
  };

  return (
    <Screen safeTop>
      <AuthBanner title="Welcome Back" subtitle="Sign in to continue your journey" />
      <Field placeholder="Mobile Number or Email" value={user} onChangeText={setUser} />
      <Field placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title={busy ? "Signing in…" : "Login"} onPress={onLogin} />
      <Button title="Continue as Guest" variant="secondary" onPress={() => navigation.replace('Main')} />
      <Button title="Create Account" variant="secondary" onPress={() => navigation.navigate('Register')} />
      <Caption style={{ textAlign: 'center', marginTop: 20 }}>
        Sign in to save your wishlist, cart and Gold SIP records.
      </Caption>
    </Screen>
  );
}
