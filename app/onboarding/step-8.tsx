import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { Colors, Typography, Spacing } from '../../constants/tokens';
import {
  calcBMR,
  calcTDEE,
  calcKcalTarget,
  calcMacroGrams,
} from '../../lib/nutrition';
import { saveProfile } from '../../lib/profile';

export default function Step8() {
  const ob = useOnboarding();

  const kcalTarget = useMemo(() => {
    if (!ob.sex) return 2000;
    const bmr = calcBMR(ob.weightKg, ob.heightCm, ob.age, ob.sex);
    const tdee = calcTDEE(bmr, ob.activityFactor);
    return calcKcalTarget(tdee, ob.goalType, ob.ratePerWeek);
  }, [ob.sex, ob.weightKg, ob.heightCm, ob.age, ob.activityFactor, ob.goalType, ob.ratePerWeek]);

  const { proteinG, carbsG, fatG } = calcMacroGrams(kcalTarget, ob.macroP, ob.macroC, ob.macroF);

  const rebalance = (changed: 'P' | 'C' | 'F', val: number) => {
    const clamped = Math.max(5, Math.min(85, val));
    const remaining = 100 - clamped;
    if (changed === 'P') {
      const ratio = ob.macroC / (ob.macroC + ob.macroF) || 0.5;
      ob.set({ macroP: clamped, macroC: Math.round(remaining * ratio), macroF: Math.round(remaining * (1 - ratio)) });
    } else if (changed === 'C') {
      const ratio = ob.macroP / (ob.macroP + ob.macroF) || 0.5;
      ob.set({ macroC: clamped, macroP: Math.round(remaining * ratio), macroF: Math.round(remaining * (1 - ratio)) });
    } else {
      const ratio = ob.macroP / (ob.macroP + ob.macroC) || 0.5;
      ob.set({ macroF: clamped, macroP: Math.round(remaining * ratio), macroC: Math.round(remaining * (1 - ratio)) });
    }
  };

  const confirm = () => {
    if (!ob.sex) return;
    saveProfile({
      units: ob.units,
      sex: ob.sex,
      age: ob.age,
      heightCm: ob.heightCm,
      weightKg: ob.weightKg,
      goalType: ob.goalType,
      goalWeightKg: ob.goalWeightKg,
      ratePerWeek: ob.ratePerWeek,
      activityFactor: ob.activityFactor,
      kcalTarget,
      macroP: ob.macroP,
      macroC: ob.macroC,
      macroF: ob.macroF,
      fiberTargetG: ob.fiberTargetG,
      firstName: ob.firstName || 'You',
      weightLog: [{ date: new Date().toISOString().split('T')[0], kg: ob.weightKg }],
      periodLog: [],
    });
    router.replace('/(tabs)/');
  };

  return (
    <OnboardingShell
      step={8}
      title="Your daily target"
      subtitle="Adjust your macro split below."
      canContinue
      onContinue={confirm}
    >
      <View style={styles.kcalBlock}>
        <Text style={styles.kcalLabel}>DAILY GOAL</Text>
        <Text style={styles.kcalValue}>{kcalTarget.toLocaleString()}</Text>
        <Text style={styles.kcalUnit}>kcal / day</Text>
      </View>

      <Text style={styles.nameLabel}>Your first name</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="e.g. Lily"
        placeholderTextColor={Colors.muted}
        value={ob.firstName}
        onChangeText={(v) => ob.set({ firstName: v })}
        autoCapitalize="words"
      />

      <View style={styles.macros}>
        <MacroSlider label="Protein" value={ob.macroP} onChange={(v) => rebalance('P', v)} color={Colors.macroProtein} grams={proteinG} />
        <MacroSlider label="Carbs" value={ob.macroC} onChange={(v) => rebalance('C', v)} color={Colors.macroCarbs} grams={carbsG} />
        <MacroSlider label="Fat" value={ob.macroF} onChange={(v) => rebalance('F', v)} color={Colors.macroFat} grams={fatG} />
        <FiberRow value={ob.fiberTargetG} onChange={(v) => ob.set({ fiberTargetG: Math.min(60, Math.max(10, v)) })} />
      </View>
    </OnboardingShell>
  );
}

function FiberRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={macro.row}>
      <View style={macro.header}>
        <View style={[macro.dot, { backgroundColor: TokenColors.macroFiber }]} />
        <Text style={macro.label}>Fiber</Text>
        <Text style={macro.grams}>{value}g</Text>
      </View>
      <View style={macro.track}>
        <View style={[macro.fill, { width: `${Math.round((value / 60) * 100)}%`, backgroundColor: TokenColors.macroFiber }]} />
      </View>
      <View style={macro.btns}>
        <Text style={macro.adj} onPress={() => onChange(value - 5)}>−5g</Text>
        <Text style={macro.adj} onPress={() => onChange(value + 5)}>+5g</Text>
      </View>
    </View>
  );
}

function MacroSlider({ label, value, onChange, color, grams }: {
  label: string; value: number; onChange: (v: number) => void; color: string; grams: number;
}) {
  return (
    <View style={macro.row}>
      <View style={macro.header}>
        <View style={[macro.dot, { backgroundColor: color }]} />
        <Text style={macro.label}>{label}</Text>
        <Text style={macro.grams}>{grams}g</Text>
        <Text style={macro.pct}>{value}%</Text>
      </View>
      <View style={macro.track}>
        <View style={[macro.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <View style={macro.btns}>
        <Text style={macro.adj} onPress={() => onChange(value - 5)}>−5%</Text>
        <Text style={macro.adj} onPress={() => onChange(value + 5)}>+5%</Text>
      </View>
    </View>
  );
}

const Colors2 = {
  macroProtein: '#464e47',
  macroCarbs: '#f6ae2d',
  macroFat: '#ff4a1c',
};

import { Colors as TokenColors } from '../../constants/tokens';

const styles = StyleSheet.create({
  kcalBlock: { alignItems: 'center', paddingVertical: 16 },
  kcalLabel: {
    fontFamily: Typography.geist,
    fontSize: 11,
    fontWeight: '600',
    color: TokenColors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  kcalValue: {
    fontFamily: Typography.geistMono,
    fontSize: 56,
    fontWeight: '500',
    color: TokenColors.forest,
    lineHeight: 64,
  },
  kcalUnit: {
    fontFamily: Typography.geistMono,
    fontSize: 14,
    color: TokenColors.muted,
  },
  nameLabel: {
    fontFamily: Typography.geist,
    fontSize: 11,
    fontWeight: '600',
    color: TokenColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
    marginTop: 8,
  },
  nameInput: {
    fontFamily: Typography.geist,
    fontSize: 16,
    color: TokenColors.forest,
    borderWidth: 1,
    borderColor: TokenColors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: TokenColors.paper,
  },
  macros: { gap: 16, marginTop: 8 },
});

const macro = StyleSheet.create({
  row: { gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: {
    fontFamily: Typography.geist,
    fontSize: 13,
    fontWeight: '500',
    color: TokenColors.forest,
    flex: 1,
  },
  grams: {
    fontFamily: Typography.geistMono,
    fontSize: 12,
    color: TokenColors.muted,
  },
  pct: {
    fontFamily: Typography.geistMono,
    fontSize: 13,
    fontWeight: '600',
    color: TokenColors.forest,
    width: 40,
    textAlign: 'right',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: TokenColors.sage,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
  btns: { flexDirection: 'row', gap: 12 },
  adj: {
    fontFamily: Typography.geist,
    fontSize: 13,
    color: TokenColors.muted,
    paddingVertical: 4,
  },
});
