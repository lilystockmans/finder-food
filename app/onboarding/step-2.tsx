import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography, Radius, Spacing } from '../../constants/tokens';

const OPTIONS = [
  { value: 'female' as const, label: 'Female', emoji: '♀' },
  { value: 'male' as const, label: 'Male', emoji: '♂' },
];

export default function Step2() {
  const { sex, set } = useOnboarding();

  return (
    <OnboardingShell
      step={2}
      title="What's your biological sex?"
      subtitle="Used to calculate your metabolic rate."
      canContinue={sex !== null}
      onContinue={() => router.push('/onboarding/step-3')}
    >
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = sex === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => set({ sex: opt.value })}
              activeOpacity={0.8}
              style={[styles.card, active && styles.active]}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[styles.label, active && styles.activeLabel]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 24,
    borderRadius: Radius.card,
    backgroundColor: Colors.paper,
    borderWidth: 2,
    borderColor: Colors.line,
    alignItems: 'center',
    gap: 8,
  },
  active: {
    borderColor: Colors.forest,
    backgroundColor: Colors.sage,
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    fontFamily: Typography.geist,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.muted,
  },
  activeLabel: {
    color: Colors.forest,
  },
});
