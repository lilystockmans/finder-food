import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Typography } from '../constants/tokens';

interface NumberScrubberProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  decimals?: number;
}

export function NumberScrubber({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  suffix = '',
  decimals = 0,
}: NumberScrubberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const display = decimals > 0 ? value.toFixed(decimals) : String(value);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) onChange(clamp(parsed));
    setEditing(false);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(clamp(value - step))}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>

      {editing ? (
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          onBlur={() => commit(draft)}
          onSubmitEditing={() => commit(draft)}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
        />
      ) : (
        <TouchableOpacity onPress={() => { setDraft(display); setEditing(true); }}>
          <Text style={styles.value}>
            {display}
            {suffix ? <Text style={styles.suffix}> {suffix}</Text> : null}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(clamp(value + step))}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  btnText: {
    fontFamily: Typography.geist,
    fontSize: 20,
    color: Colors.forest,
    lineHeight: 24,
  },
  value: {
    fontFamily: Typography.geistMono,
    fontSize: 44,
    fontWeight: '500',
    color: Colors.forest,
    minWidth: 100,
    textAlign: 'center',
  },
  suffix: {
    fontFamily: Typography.geistMono,
    fontSize: 18,
    color: Colors.muted,
  },
  input: {
    fontFamily: Typography.geistMono,
    fontSize: 44,
    fontWeight: '500',
    color: Colors.forest,
    minWidth: 100,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderColor: Colors.ember,
    padding: 0,
  },
});
