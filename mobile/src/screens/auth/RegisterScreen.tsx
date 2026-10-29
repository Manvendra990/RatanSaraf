import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthBanner, Button, Field, Screen } from '../../components/ui';
import type { RootStack } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStack, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const auth = useAuth();
  const [busy,setBusy] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onRegister = async () => {
    if(busy) return;
    setBusy(true);
    try {await auth.register({name,phone,email,password});navigation.replace('Main');}
    catch(e:any){Alert.alert('Registration failed',e.message);}
    finally{setBusy(false);}
  };

  return (
    <Screen>
      <AuthBanner title="Create Account" />
      <Field placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field placeholder="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title={busy ? "Creating account…" : "Register"} onPress={onRegister} />
      <Button
        title="Already have an account? Login"
        variant="secondary"
        onPress={() => navigation.navigate('Login')}
      />
    </Screen>
  );
}
