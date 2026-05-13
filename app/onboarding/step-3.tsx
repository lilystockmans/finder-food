import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography } from '../../constants/tokens';

export default function Step3() {
  const { age, set } = useOnboarding();
  const [draft, setDraft] = useState(age > 0 ? String(age) : '');

  const handleChange = (v: string) => {
    setDraft(v);
    const n = parseInt(v);
    if (!isNaN(n) && n >= 13 && n <= 99) set({ age: n });
  };

  return (
    <OnboardingShell
      step={3}
      title="How old are you?"
      canContinue={age >= 13 && age <= 99}
      onContinue={() => router.push('/onboarding/step-4')}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.value}
          value={draft}
          onChangeText={handleChange}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          placeholder="25"
          placeholderTextColor={Colors.line}
          maxLength={2}
        />
        <Text style={styles.suffix}>years</Text>
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
    minWidth: 120,
    paddingVertical: 4,
  },
  suffix: { fontFamily: Typography.geistMono, fontSize: 22, color: Colors.muted },
});
