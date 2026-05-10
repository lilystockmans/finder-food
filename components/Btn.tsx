import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Radius } from '../constants/tokens';
import { Icon } from './Icon';

type BtnKind = 'primary' | 'forest' | 'ghost' | 'ice' | 'text';

interface BtnProps {
  label: string;
  kind?: BtnKind;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  icon?: string;
  style?: ViewStyle;
}

const styles: Record<BtnKind, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.ember },
    text: { color: Colors.white },
  },
  forest: {
    container: { backgroundColor: Colors.forest },
    text: { color: Colors.white },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.line },
    text: { color: Colors.forest },
  },
  ice: {
    container: { backgroundColor: Colors.ice },
    text: { color: Colors.forest2 },
  },
  text: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.forest },
  },
};

export function Btn({ label, kind = 'primary', onPress, disabled, loading, full, style }: BtnProps) {
  const s = styles[kind];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        base.btn,
        s.container,
        full && base.full,
        (disabled || loading) && base.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={s.text.color} size="small" />
      ) : (
        <Text style={[base.label, s.text]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const base = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: Radius.pill,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  full: { width: '100%' },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: Typography.geist,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
