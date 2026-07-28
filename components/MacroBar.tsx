import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, MIN_FONT_SIZE } from '../constants/tokens';

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
    // Sentence case, not uppercase-tracked: the mockup reads calmer and the
    // grotesque has enough character to carry a plain label.
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: Colors.forest,
  },
  value: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: Colors.forest,
  },
  val: {},
  sep: {
    color: Colors.muted,
  },
  target: {
    fontFamily: Typography.mono,
    fontSize: MIN_FONT_SIZE,
    color: Colors.muted,
  },
  track: {
    // 4px on a visible rail. The previous 6px on Colors.sage worked when sage was
    // a distinct pale green; sage is now the page background, so on a white card
    // it would have been invisible.
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
