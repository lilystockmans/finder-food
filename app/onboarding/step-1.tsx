import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { Pills } from '../../components/Pills';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography, Spacing } from '../../constants/tokens';

export default function Step1() {
  const { units, set } = useOnboarding();

  return (
    <OnboardingShell
      step={1}
      title="What units do you prefer?"
      subtitle="We'll use these throughout the app."
      canContinue
      onContinue={() => router.push('/onboarding/step-2')}
    >
      <Pills
        items={['metric (kg / cm)', 'imperial (lb / ft)']}
        value={units === 'metric' ? 'metric (kg / cm)' : 'imperial (lb / ft)'}
        onChange={(v) => set({ units: v.startsWith('metric') ? 'metric' : 'imperial' })}
        full
      />
    </OnboardingShell>
  );
}
