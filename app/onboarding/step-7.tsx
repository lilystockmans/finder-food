import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography, Radius } from '../../constants/tokens';
import type { ActivityLevel } from '../../lib/nutrition';

const LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 1.2, label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 1.375, label: 'Lightly active', desc: 'About 3×/week' },
  { value: 1.55, label: 'Active', desc: 'About 5×/week' },
  { value: 1.725, label: 'Extremely active', desc: '6–7 days/week' },
];

export default function Step7() {
  const { activityFactor, set } = useOnboarding();

  return (
    <OnboardingShell
      step={7}
      title="How active are you?"
      subtitle="Used to calculate your daily energy expenditure."
      canContinue={activityFactor !== null}
      onContinue={() => router.push('/onboarding/step-8')}
    >
      <View style={styles.list}>
        {LEVELS.map((level) => {
          const active = activityFactor === level.value;
          return (
            <TouchableOpacity
              key={level.value}
              onPress={() => set({ activityFactor: level.value })}
              activeOpacity={0.8}
              style={[styles.card, active && styles.active]}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.title, active && styles.activeTitle]}>{level.label}</Text>
                <Text style={styles.desc}>{level.desc}</Text>
              </View>
              <Text style={[styles.multiplier, active && styles.activeMultiplier]}>
                ×{level.value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.card,
    backgroundColor: Colors.paper,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  active: { borderColor: Colors.forest, backgroundColor: Colors.sage },
  cardContent: { flex: 1 },
  title: {
    fontFamily: Typography.geist,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.forest,
  },
  activeTitle: { color: Colors.forest },
  desc: {
    fontFamily: Typography.geist,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  multiplier: {
    fontFamily: Typography.geistMono,
    fontSize: 14,
    color: Colors.muted,
  },
  activeMultiplier: { color: Colors.forest },
});
