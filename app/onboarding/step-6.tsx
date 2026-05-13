import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography, Radius } from '../../constants/tokens';
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
  const displayGoal = Math.round(units === 'imperial' ? kgToLbs(goalWeightKg) : goalWeightKg);
  const showGoalFields = goalType !== 'maintain';
  const suffix = units === 'imperial' ? 'lbs' : 'kg';
  const min = units === 'imperial' ? 66 : 30;
  const max = units === 'imperial' ? 440 : 200;

  const [draft, setDraft] = useState(goalWeightKg > 0 ? String(displayGoal) : '');

  const setGoal = (rounded: number) => {
    set({ goalWeightKg: units === 'imperial' ? lbsToKg(rounded) : rounded });
    setDraft(String(rounded));
  };

  const commit = (raw: string) => {
    const n = Math.round(parseFloat(raw));
    if (!isNaN(n) && n >= min && n <= max) setGoal(n);
    setEditing(false);
  };

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

          <View style={styles.inputBlock}>
            <TextInput
              style={styles.goalValue}
              value={draft}
              onChangeText={setDraft}
              onBlur={() => commit(draft)}
              onSubmitEditing={() => commit(draft)}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              placeholder={String(Math.round((min + max) / 2))}
              placeholderTextColor={Colors.line}
              maxLength={4}
            />
            <Text style={styles.goalSuffix}>{suffix}</Text>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
            Rate: {ratePerWeek} {suffix} / week
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
  inputBlock: { alignItems: 'center', gap: 4 },
  goalValue: {
    fontFamily: Typography.geistMono,
    fontSize: 48,
    fontWeight: '500',
    color: Colors.forest,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderColor: Colors.forest,
    minWidth: 140,
    paddingVertical: 4,
  },
  goalSuffix: { fontFamily: Typography.geistMono, fontSize: 20, color: Colors.muted },
  rateChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  chipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  chipLabel: { fontFamily: Typography.geistMono, fontSize: 14, color: Colors.forest },
  chipActiveLabel: { color: Colors.white },
});
