import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { lbsToKg, kgToLbs } from '../../lib/nutrition';
import { Colors, Typography } from '../../constants/tokens';

export default function Step5() {
  const { units, weightKg, set } = useOnboarding();
  const suffix = units === 'imperial' ? 'lbs' : 'kg';
  const displayVal = units === 'imperial' ? kgToLbs(weightKg) : weightKg;
  const [draft, setDraft] = useState(weightKg > 0 ? displayVal.toFixed(1) : '');

  const min = units === 'imperial' ? 66 : 30;
  const max = units === 'imperial' ? 660 : 300;

  const handleChange = (v: string) => {
    setDraft(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n >= min && n <= max) {
      set({ weightKg: units === 'imperial' ? lbsToKg(n) : n });
    }
  };

  return (
    <OnboardingShell
      step={5}
      title="What's your current weight?"
      canContinue={weightKg > 0}
      onContinue={() => router.push('/onboarding/step-6')}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.value}
          value={draft}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
          placeholder={units === 'imperial' ? '150.0' : '70.0'}
          placeholderTextColor={Colors.line}
          maxLength={6}
        />
        <Text style={styles.suffix}>{suffix}</Text>
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
    borderBottomWidth: 2,
    borderColor: Colors.forest,
    minWidth: 160,
    paddingVertical: 4,
  },
  suffix: { fontFamily: Typography.geistMono, fontSize: 22, color: Colors.muted },
});
