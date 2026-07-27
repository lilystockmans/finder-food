import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { BottomSheet } from '../../components/BottomSheet';
import { Pills } from '../../components/Pills';
import { Btn } from '../../components/Btn';
import { Icon } from '../../components/Icon';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { loadProfile, saveProfile, clearProfile, type Profile } from '../../lib/profile';
import { calcMacroGrams, kgToLbs, lbsToKg } from '../../lib/nutrition';
import { exportDataToShareSheet } from '../../lib/export';

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

  const handleExportData = async () => {
    try {
      await exportDataToShareSheet();
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Something went wrong while exporting your data.');
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
            value={`${Math.round(displayGoal)} ${weightUnit}`}
            onPress={() => setSheet('goal')}
          />
          <SettingsRow
            label="Settings"
            value={profile.units === 'metric' ? 'Metric' : 'Imperial'}
            onPress={() => setSheet('settings')}
          />
        </View>

        <TouchableOpacity onPress={handleExportData} style={styles.exportBtn}>
          <Text style={styles.exportText}>Export My Data</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRerunOnboarding} style={styles.resetBtn}>
          <Text style={styles.resetText}>Re-run onboarding</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Daily target sheet */}
      <TargetSheet
        visible={sheet === 'target'}
        initial={profile.kcalTarget}
        onClose={() => setSheet(null)}
        onSave={(v) => save({ kcalTarget: v })}
      />

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
        <FiberRow
          value={profile.fiberTargetG}
          onChange={(v) => setProfile({ ...profile, fiberTargetG: Math.min(60, Math.max(10, v)) })}
        />
        <Btn label="Save" kind="primary" full onPress={() => save({ macroP: profile.macroP, macroC: profile.macroC, macroF: profile.macroF, fiberTargetG: profile.fiberTargetG })} style={{ marginTop: 24 }} />
      </BottomSheet>

      {/* Goal weight sheet */}
      <GoalSheet
        visible={sheet === 'goal'}
        initial={Math.round(displayGoal)}
        unit={weightUnit}
        onClose={() => setSheet(null)}
        onSave={(v) => save({ goalWeightKg: profile.units === 'imperial' ? lbsToKg(v) : v })}
      />

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

function TargetSheet({ visible, initial, onClose, onSave }: {
  visible: boolean; initial: number; onClose: () => void; onSave: (v: number) => void;
}) {
  const [input, setInput] = React.useState(String(initial));
  React.useEffect(() => { if (visible) setInput(String(initial)); }, [visible, initial]);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={sheetStyles.title}>Daily target</Text>
      <View style={sheetStyles.inputRow}>
        <TextInput
          style={sheetStyles.bigInput}
          value={input}
          onChangeText={setInput}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          placeholder={String(initial)}
          placeholderTextColor={Colors.muted}
        />
        <Text style={sheetStyles.inputUnit}>kcal</Text>
      </View>
      <Btn label="Save" kind="primary" full onPress={() => { const n = parseInt(input); if (!isNaN(n) && n >= 800 && n <= 5000) onSave(n); }} style={{ marginTop: 24 }} />
    </BottomSheet>
  );
}

function GoalSheet({ visible, initial, unit, onClose, onSave }: {
  visible: boolean; initial: number; unit: string; onClose: () => void; onSave: (v: number) => void;
}) {
  const [input, setInput] = React.useState(String(initial));
  React.useEffect(() => { if (visible) setInput(String(initial)); }, [visible, initial]);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={sheetStyles.title}>Goal weight</Text>
      <View style={sheetStyles.inputRow}>
        <TextInput
          style={sheetStyles.bigInput}
          value={input}
          onChangeText={setInput}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          placeholder={String(initial)}
          placeholderTextColor={Colors.muted}
        />
        <Text style={sheetStyles.inputUnit}>{unit}</Text>
      </View>
      <Btn label="Save" kind="primary" full onPress={() => { const n = Math.round(parseInt(input)); if (!isNaN(n) && n >= 30 && n <= 440) onSave(n); }} style={{ marginTop: 24 }} />
    </BottomSheet>
  );
}

function FiberRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={macroRow.container}>
      <View style={macroRow.header}>
        <View style={[macroRow.dot, { backgroundColor: Colors.macroFiber }]} />
        <Text style={macroRow.label}>Fiber</Text>
        <Text style={macroRow.grams}>{value}g</Text>
      </View>
      <View style={macroRow.track}>
        <View style={[macroRow.fill, { width: `${Math.round((value / 60) * 100)}%`, backgroundColor: Colors.macroFiber }]} />
      </View>
      <View style={macroRow.btns}>
        <TouchableOpacity onPress={() => onChange(value - 5)} style={macroRow.btn}>
          <Text style={macroRow.btnText}>−5g</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange(value + 5)} style={macroRow.btn}>
          <Text style={macroRow.btnText}>+5g</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  exportBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  exportText: {
    fontFamily: Typography.geist,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.forest,
  },
  resetBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetText: {
    fontFamily: Typography.geist,
    fontSize: 14,
    color: Colors.warn,
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
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bigInput: {
    fontFamily: Typography.geistMono,
    fontSize: 48,
    fontWeight: '500',
    color: Colors.forest,
    borderBottomWidth: 2,
    borderColor: Colors.ember,
    textAlign: 'center',
    paddingVertical: 4,
    minWidth: 120,
  },
  inputUnit: { fontFamily: Typography.geistMono, fontSize: 20, color: Colors.muted, alignSelf: 'flex-end', paddingBottom: 8 },
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
