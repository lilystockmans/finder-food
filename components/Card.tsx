import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../constants/tokens';

interface CardProps {
  children: React.ReactNode;
  pad?: number;
  bg?: string;
  style?: ViewStyle;
}

export function Card({ children, pad = 18, bg = Colors.white, style }: CardProps) {
  return (
    <View style={[styles.card, { padding: pad, backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
});
