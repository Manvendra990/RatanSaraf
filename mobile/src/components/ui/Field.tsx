import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { colors, radius } from '../../constants/theme';

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (s: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'phone-pad' | 'default' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

export function Field({ autoCapitalize = 'none', ...props }: Props) {
  return (
    <TextInput
      {...props}
      autoCapitalize={autoCapitalize}
      placeholderTextColor={colors.muted}
      selectionColor={colors.gold}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginVertical: 6,
    color: colors.ink,
    fontSize: 15,
  },
});
