import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography, MIN_FONT_SIZE } from '../constants/tokens';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  stroke?: number;
}

export function CalorieRing({ consumed, target, size = 196, stroke = 6 }: CalorieRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const offset = circumference * (1 - pct);
  const over = consumed > target;
  const remaining = target - consumed;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={Colors.track} strokeWidth={stroke} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={over ? Colors.warn : Colors.ember}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Absolute child with auto offsets is centred by the parent's align/justify.
          The paddingBottom shifts the content up ~3px: a stack dominated by a 66px
          numeral reads low when its box is centred geometrically. */}
      <View style={styles.center}>
        <Text style={styles.label}>{over ? 'OVER TARGET' : 'REMAINING'}</Text>
        <Text style={styles.number}>
          {Math.abs(remaining).toLocaleString()}
        </Text>
        <Text style={styles.sub}>
          {consumed.toLocaleString()} of {target.toLocaleString()} kcal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    paddingBottom: 6,
  },
  label: {
    fontFamily: Typography.mono,
    fontSize: MIN_FONT_SIZE,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  number: {
    // Display face: tabular figures, so the value does not shift as it changes.
    fontFamily: Typography.display,
    fontSize: 66,
    lineHeight: 70,
    letterSpacing: -2,
    color: Colors.forest,
    marginVertical: 2,
  },
  sub: {
    fontFamily: Typography.mono,
    fontSize: MIN_FONT_SIZE,
    color: Colors.muted,
  },
});
