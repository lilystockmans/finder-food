import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BottomSheet } from '../../components/BottomSheet';
import { NumberScrubber } from '../../components/NumberScrubber';
import { Pills } from '../../components/Pills';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { loadProfile, saveProfile, clearProfile, type Profile } from '../../lib/profile';
import { calcMacroGrams, kgToLbs, lbsToKg } from '../../lib/nutrition';

export default function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sheet, setSheet] = useState<'target' | 'macros' | 'goal' | 'settings' | null>(null);

  useFocusEffect(useCallback(() => {
    setProfile(loadProfile());
  }, []));

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No profile found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const macros = calcMacroGrams(profile.kcalTarget, profile.macroP, profile.macroC, profile.macroF);
  const displayWeight = profile.units === 'imperial' ? kgToLbs(profile.weightKg) : profile.weightKg;
  const displayGoal = profile.units === 'imperial' ? kgToLbs(profile.goalWeightKg) : profile.goalWeightKg;
  const weightUnit = profile.units === 'imperial' ? 'lbs' : 'kg';

  const save = (updates: Partial<Profile>) => {
    const updated = { ...profile, ...updates };
    saveProfile(updated);
    setProfile(updated);
    setSheet(null);
  };

  const rebalanceMacros = (changed: 'P' | 'C' | 'F', val: number, current: Profile) => {
    const clamped = Math.max(5, Math.min(85, val));
    const remaining = 100 - clamped;
    if (changed === 'P') {
      const ratio = current.macroC / (current.macroC + current.macroF) || 0.5;
      return { macroP: clamped, macroC: Math.round(remaining * ratio), macroF: Math.round(remaining * (1 - ratio)) };
    } else if (changed === 'C') {
      const ratio = current.macroP / (current.macroP + current.macroF) || 0.5;
      return { macroC: clamped, macroP: Math.round(remaining * ratio), macroF: Math.round(remaining * (1 - ratio)) };
    } else {
      const ratio = current.macroP / (current.macroP + current.macroC) || 0.5;
      return { macroF: clamped, macroP: Math.round(remaining * ratio), macroC: Math.round(remaining * (1 - ratio)) };
    }
  };

  const handleRerunOnboarding = () => {
    Alert.alert(
      'Reset everything?',
      'This will clear all your profile data and return to setup. Your meal log will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearProfile();
            router.replace('/onboarding/step-1');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.firstName[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.name}>{profile.firstName}</Text>
            <Text style={styles.meta}>
              {profile.age} · {profile.heightCm}cm · {displayWeight.toFixed(1)}{weightUnit}
            </Text>
          </View>
        </View>

        {/* Settings rows */}
        <View style={styles.section}>
          <SettingsRow
            label="Daily target"
            value={`${profile.kcalTarget.toLocaleString()} kcal`}
            onPress={() => setSheet('target')}
          />
          <SettingsRow
            label="Macros"
            value={`P ${profile.macroP}% · C ${profile.macroC}% · F ${profile.macroF}%`}
            onPress={() => setSheet('macros')}
          />
          <SettingsRow
            label="Goal weight"
            value={`${displayGoal.toFixed(1)} ${weightUnit}`}
            onPress={() => setSheet('goal')}
          />
          <SettingsRow
            label="Settings"
            value={profile.units === 'metric' ? 'Metric' : 'Imperial'}
            onPress={() => setSheet('settings')}
          />
        </View>

        <TouchableOpacity onPress={handleRerunOnboarding} style={styles.resetBtn}>
          <Text style={styles.resetText}>Re-run onboarding</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Daily target sheet */}
      <BottomSheet visible={sheet === 'target'} onClose={() => setSheet(null)}>
        <Text style={sheetStyles.title}>Daily target</Text>
        <NumberScrubber
          value={profile.kcalTarget}
          onChange={(v) => save({ kcalTarget: v })}
          min={800}
          max={5000}
          step={50}
          suffix="kcal"
        />
        <Btn label="Save" kind="primary" full onPress={() => setSheet(null)} style={{ marginTop: 24 }} />
      </BottomSheet>

      {/* Macros sheet */}
      <BottomSheet visible={sheet === 'macros'} onClose={() => setSheet(null)}>
        <Text style={sheetStyles.title}>Macro split</Text>
        <MacroSliderRow
          label="Protein"
          value={profile.macroP}
          color={Colors.macroProtein}
          grams={macros.proteinG}
          onChange={(v) => {
            const updates = rebalanceMacros('P', v, profile);
            setProfile({ ...profile, ...updates });
          }}
        />
        <MacroSliderRow
          label="Carbs"
          value={profile.macroC}
          color={Colors.macroCarbs}
          grams={macros.carbsG}
          onChange={(v) => {
            const updates = rebalanceMacros('C', v, profile);
            setProfile({ ...profile, ...updates });
          }}
        />
        <MacroSliderRow
          label="Fat"
          value={profile.macroF}
          color={Colors.macroFat}
          grams={macros.fatG}
          onChange={(v) => {
            const updates = rebalanceMacros('F', v, profile);
            setProfile({ ...profile, ...updates });
          }}
        />
        <Btn label="Save" kind="primary" full onPress={() => save({ macroP: profile.macroP, macroC: profile.macroC, macroF: profile.macroF })} style={{ marginTop: 24 }} />
      </BottomSheet>

      {/* Goal weight sheet */}
      <BottomSheet visible={sheet === 'goal'} onClose={() => setSheet(null)}>
        <Text style={sheetStyles.title}>Goal weight</Text>
        <NumberScrubber
          value={displayGoal}
          onChange={(v) => {
            const kg = profile.units === 'imperial' ? lbsToKg(v) : v;
            setProfile({ ...profile, goalWeightKg: kg });
          }}
          min={30}
          max={300}
          step={0.1}
          decimals={1}
          suffix={weightUnit}
        />
        <Btn label="Save" kind="primary" full onPress={() => save({ goalWeightKg: profile.goalWeightKg })} style={{ marginTop: 24 }} />
      </BottomSheet>

      {/* Settings sheet */}
      <BottomSheet visible={sheet === 'settings'} onClose={() => setSheet(null)}>
        <Text style={sheetStyles.title}>Settings</Text>
        <View style={sheetStyles.row}>
          <Text style={sheetStyles.label}>Units</Text>
          <Pills
            items={['metric', 'imperial']}
            value={profile.units}
            onChange={(v) => save({ units: v as 'metric' | 'imperial' })}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function SettingsRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={settingsRow.row} activeOpacity={0.8}>
      <View style={settingsRow.left}>
        <Text style={settingsRow.label}>{label}</Text>
        <Text style={settingsRow.value}>{value}</Text>
      </View>
      <Icon name="chev-r" size={18} color={Colors.muted} />
    </TouchableOpacity>
  );
}

function MacroSliderRow({ label, value, color, grams, onChange }: {
  label: string; value: number; color: string; grams: number; onChange: (v: number) => void;
}) {
  return (
    <View style={macroRow.container}>
      <View style={macroRow.header}>
        <View style={[macroRow.dot, { backgroundColor: color }]} />
        <Text style={macroRow.label}>{label}</Text>
        <Text style={macroRow.grams}>{grams}g</Text>
        <Text style={macroRow.pct}>{value}%</Text>
      </View>
      <View style={macroRow.track}>
        <View style={[macroRow.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <View style={macroRow.btns}>
        <TouchableOpacity onPress={() => onChange(value - 5)} style={macroRow.btn}>
          <Text style={macroRow.btnText}>−5%</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange(value + 5)} style={macroRow.btn}>
          <Text style={macroRow.btnText}>+5%</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.sage },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: Typography.geist, fontSize: 15, color: Colors.muted },
  content: { padding: Spacing.xl, gap: 24, paddingBottom: 80 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.geist,
    fontSize: 22,
    fontWeight: '600',
    color: Colors.white,
  },
  name: {
    fontFamily: Typography.geist,
    fontSize: 20,
    fontWeight: '500',
    color: Colors.forest,
  },
  meta: {
    fontFamily: Typography.geist,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  resetBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetText: {
    fontFamily: Typography.geist,
    fontSize: 14,
    color: Colors.ember,
  },
});

const settingsRow = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Colors.line,
  },
  left: { flex: 1 },
  label: {
    fontFamily: Typography.geist,
    fontSize: 15,
    color: Colors.forest,
  },
  value: {
    fontFamily: Typography.geist,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
});

const sheetStyles = StyleSheet.create({
  title: {
    fontFamily: Typography.geist,
    fontSize: 20,
    fontWeight: '500',
    color: Colors.forest,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontFamily: Typography.geist,
    fontSize: 15,
    color: Colors.forest,
  },
});

const macroRow = StyleSheet.create({
  container: { gap: 8, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: Typography.geist, fontSize: 14, color: Colors.forest, flex: 1 },
  grams: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted },
  pct: { fontFamily: Typography.geistMono, fontSize: 14, fontWeight: '600', color: Colors.forest, width: 40, textAlign: 'right' },
  track: { height: 8, borderRadius: 4, backgroundColor: Colors.sage, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  btns: { flexDirection: 'row', gap: 12 },
  btn: { paddingVertical: 4 },
  btnText: { fontFamily: Typography.geist, fontSize: 13, color: Colors.muted },
});
