import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../constants/tokens';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  stroke?: number;
}

export function CalorieRing({ consumed, target, size = 196, stroke = 14 }: CalorieRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const offset = circumference * (1 - pct);
  const over = consumed > target;
  const remaining = target - consumed;
  const ringColor = over ? Colors.ember : Colors.forest;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={Colors.sage}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>REMAINING</Text>
        <Text style={[styles.number, over && { color: Colors.ember }]}>
          {over ? '−' : ''}{Math.abs(remaining).toLocaleString()}
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
  },
  label: {
    fontFamily: Typography.geist,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  number: {
    fontFamily: Typography.geistMono,
    fontSize: 44,
    fontWeight: '500',
    color: Colors.forest,
    lineHeight: 52,
  },
  sub: {
    fontFamily: Typography.geistMono,
    fontSize: 12,
    color: Colors.muted,
  },
});
