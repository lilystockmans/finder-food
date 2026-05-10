import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { NumberScrubber } from '../../components/NumberScrubber';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography, Radius, Spacing } from '../../constants/tokens';
import { lbsToKg, kgToLbs } from '../../lib/nutrition';
import type { GoalType } from '../../lib/nutrition';

const GOALS: { value: GoalType; label: string; desc: string }[] = [
  { value: 'lose', label: 'Lose weight', desc: 'Calorie deficit' },
  { value: 'maintain', label: 'Maintain', desc: 'Stay at current weight' },
  { value: 'gain', label: 'Gain weight', desc: 'Calorie surplus' },
];

const RATES = [0.25, 0.5, 0.75, 1.0];

export default function Step6() {
  const { units, goalType, goalWeightKg, ratePerWeek, set } = useOnboarding();
  const displayGoal = units === 'imperial' ? kgToLbs(goalWeightKg) : goalWeightKg;
  const showGoalFields = goalType !== 'maintain';

  return (
    <OnboardingShell
      step={6}
      title="What's your goal?"
      canContinue={goalType !== null}
      onContinue={() => router.push('/onboarding/step-7')}
    >
      <View style={styles.cards}>
        {GOALS.map((g) => {
          const active = goalType === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              onPress={() => set({ goalType: g.value })}
              activeOpacity={0.8}
              style={[styles.card, active && styles.active]}
            >
              <Text style={[styles.cardTitle, active && styles.activeText]}>{g.label}</Text>
              <Text style={styles.cardDesc}>{g.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showGoalFields && (
        <View style={styles.extras}>
          <Text style={styles.sectionLabel}>Goal weight</Text>
          <NumberScrubber
            value={displayGoal}
            onChange={(v) => set({ goalWeightKg: units === 'imperial' ? lbsToKg(v) : v })}
            min={30}
            max={300}
            step={0.1}
            decimals={1}
            suffix={units === 'imperial' ? 'lbs' : 'kg'}
          />

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
            Rate: {ratePerWeek} {units === 'imperial' ? 'lbs' : 'kg'} / week
          </Text>
          <View style={styles.rateChips}>
            {RATES.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => set({ ratePerWeek: r })}
                activeOpacity={0.8}
                style={[styles.chip, ratePerWeek === r && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, ratePerWeek === r && styles.chipActiveLabel]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 10 },
  card: {
    padding: 18,
    borderRadius: Radius.card,
    backgroundColor: Colors.paper,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  active: { borderColor: Colors.forest, backgroundColor: Colors.sage },
  cardTitle: {
    fontFamily: Typography.geist,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.forest,
  },
  activeText: { color: Colors.forest },
  cardDesc: {
    fontFamily: Typography.geist,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  extras: { marginTop: 24, gap: 8 },
  sectionLabel: {
    fontFamily: Typography.geist,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  rateChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  chipActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  chipLabel: {
    fontFamily: Typography.geistMono,
    fontSize: 14,
    color: Colors.forest,
  },
  chipActiveLabel: { color: Colors.white },
});
