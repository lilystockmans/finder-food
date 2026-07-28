import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Colors, Radius } from '../constants/tokens';

interface CardProps {
  children: React.ReactNode;
  pad?: number;
  bg?: string;
  style?: ViewStyle;
}

/** One inner padding for every surface, so text edges align down the page. */
export const CARD_PAD = 20;

export function Card({ children, pad = CARD_PAD, bg = Colors.white, style }: CardProps) {
  return (
    <View style={[styles.card, { padding: pad, backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    // Soft elevation instead of a border. Android renders shadow only via
    // `elevation`, and elevation does not draw on a transparent background — so a
    // card must always have a real backgroundColor, which it does above.
    ...Platform.select({
      ios: {
        shadowColor: Colors.forest,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
});
