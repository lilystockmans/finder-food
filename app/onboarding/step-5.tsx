import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { lbsToKg, kgToLbs } from '../../lib/nutrition';
import { Colors, Typography } from '../../constants/tokens';

export default function Step5() {
  const { units, weightKg, set } = useOnboarding();
  const displayVal = units === 'imperial' ? kgToLbs(weightKg) : weightKg;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayVal.toFixed(1));

  const min = units === 'imperial' ? 66 : 30;
  const max = units === 'imperial' ? 660 : 300;
  const suffix = units === 'imperial' ? 'lbs' : 'kg';

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= min && n <= max) {
      set({ weightKg: units === 'imperial' ? lbsToKg(n) : n });
    }
    setEditing(false);
  };

  return (
    <OnboardingShell
      step={5}
      title="What's your current weight?"
      canContinue={weightKg > 0}
      onContinue={() => router.push('/onboarding/step-6')}
    >
      <View style={styles.container}>
        {editing ? (
          <TextInput
            style={styles.value}
            value={draft}
            onChangeText={setDraft}
            onBlur={() => commit(draft)}
            onSubmitEditing={() => commit(draft)}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => { setDraft(displayVal.toFixed(1)); setEditing(true); }}>
            <Text style={styles.value}>
              {displayVal.toFixed(1)} <Text style={styles.suffix}>{suffix}</Text>
            </Text>
          </TouchableOpacity>
        )}
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={units === 'imperial' ? 0.5 : 0.1}
          value={displayVal}
          onValueChange={(v) => {
            const rounded = units === 'imperial' ? Math.round(v * 2) / 2 : Math.round(v * 10) / 10;
            set({ weightKg: units === 'imperial' ? lbsToKg(rounded) : rounded });
            setDraft(rounded.toFixed(1));
          }}
          minimumTrackTintColor={Colors.forest}
          maximumTrackTintColor={Colors.line}
          thumbTintColor={Colors.forest}
        />
        <View style={styles.labels}>
          <Text style={styles.label}>{min} {suffix}</Text>
          <Text style={styles.label}>{max} {suffix}</Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, width: '100%' },
  value: {
    fontFamily: Typography.geistMono,
    fontSize: 56,
    fontWeight: '500',
    color: Colors.forest,
    textAlign: 'center',
  },
  suffix: { fontFamily: Typography.geistMono, fontSize: 22, color: Colors.muted },
  slider: { width: '100%', height: 40 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4 },
  label: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted },
});
