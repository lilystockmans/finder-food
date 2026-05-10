import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '../constants/tokens';

interface PillsProps {
  items: string[];
  value: string;
  onChange: (val: string) => void;
  full?: boolean;
}

export function Pills({ items, value, onChange, full }: PillsProps) {
  return (
    <View style={[styles.row, full && styles.full]}>
      {items.map((item) => {
        const active = item === value;
        return (
          <TouchableOpacity
            key={item}
            onPress={() => onChange(item)}
            activeOpacity={0.8}
            style={[styles.pill, active && styles.active, full && styles.flex]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.paper,
    borderRadius: Radius.pill,
    padding: 3,
    gap: 2,
  },
  full: { width: '100%' },
  flex: { flex: 1 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: Colors.forest,
  },
  label: {
    fontFamily: Typography.geist,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.muted,
  },
  activeLabel: {
    color: Colors.white,
  },
});
