import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants/tokens';

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, value, target, color, unit = 'g' }: MacroBarProps) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.meta}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          <Text style={[styles.val, { color }]}>{value}</Text>
          <Text style={styles.sep}> / </Text>
          <Text style={styles.target}>{target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: Typography.geist,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontFamily: Typography.geistMono,
    fontSize: 12,
  },
  val: {
    fontWeight: '600',
  },
  sep: {
    color: Colors.muted,
  },
  target: {
    color: Colors.muted,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sage,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
