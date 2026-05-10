import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { ftInToCm, cmToFtIn } from '../../lib/nutrition';
import { Colors, Typography } from '../../constants/tokens';

export default function Step4() {
  const { units, heightCm, set } = useOnboarding();
  const { ft, inches } = cmToFtIn(heightCm);
  const [editingCm, setEditingCm] = useState(false);
  const [cmDraft, setCmDraft] = useState(String(heightCm));
  const [editingFt, setEditingFt] = useState(false);
  const [ftDraft, setFtDraft] = useState(String(ft));

  const commitCm = (raw: string) => {
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 100 && n <= 250) set({ heightCm: n });
    setEditingCm(false);
  };

  const commitFt = (raw: string) => {
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 3 && n <= 8) set({ heightCm: ftInToCm(n, inches) });
    setEditingFt(false);
  };

  if (units === 'imperial') {
    return (
      <OnboardingShell
        step={4}
        title="How tall are you?"
        canContinue={heightCm > 0}
        onContinue={() => router.push('/onboarding/step-5')}
      >
        <View style={styles.container}>
          <View style={styles.ftRow}>
            <View style={styles.col}>
              <Text style={styles.unitLabel}>ft</Text>
              {editingFt ? (
                <TextInput
                  style={styles.value}
                  value={ftDraft}
                  onChangeText={setFtDraft}
                  onBlur={() => commitFt(ftDraft)}
                  onSubmitEditing={() => commitFt(ftDraft)}
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity onPress={() => { setFtDraft(String(ft)); setEditingFt(true); }}>
                  <Text style={styles.value}>{ft}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.separator}>'</Text>
            <View style={styles.col}>
              <Text style={styles.unitLabel}>in</Text>
              <Text style={styles.value}>{inches}</Text>
            </View>
          </View>

          <Text style={styles.sliderLabel}>Feet</Text>
          <Slider
            style={styles.slider}
            minimumValue={3}
            maximumValue={8}
            step={1}
            value={ft}
            onValueChange={(v) => { const f = Math.round(v); set({ heightCm: ftInToCm(f, inches) }); setFtDraft(String(f)); }}
            minimumTrackTintColor={Colors.forest}
            maximumTrackTintColor={Colors.line}
            thumbTintColor={Colors.forest}
          />
          <View style={styles.labels}>
            <Text style={styles.label}>3 ft</Text>
            <Text style={styles.label}>8 ft</Text>
          </View>

          <Text style={[styles.sliderLabel, { marginTop: 8 }]}>Inches</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={11}
            step={1}
            value={inches}
            onValueChange={(v) => set({ heightCm: ftInToCm(ft, Math.round(v)) })}
            minimumTrackTintColor={Colors.forest}
            maximumTrackTintColor={Colors.line}
            thumbTintColor={Colors.forest}
          />
          <View style={styles.labels}>
            <Text style={styles.label}>0"</Text>
            <Text style={styles.label}>11"</Text>
          </View>
        </View>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={4}
      title="How tall are you?"
      canContinue={heightCm > 0}
      onContinue={() => router.push('/onboarding/step-5')}
    >
      <View style={styles.container}>
        {editingCm ? (
          <TextInput
            style={styles.value}
            value={cmDraft}
            onChangeText={setCmDraft}
            onBlur={() => commitCm(cmDraft)}
            onSubmitEditing={() => commitCm(cmDraft)}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => { setCmDraft(String(heightCm)); setEditingCm(true); }}>
            <Text style={styles.value}>
              {heightCm} <Text style={styles.suffix}>cm</Text>
            </Text>
          </TouchableOpacity>
        )}
        <Slider
          style={styles.slider}
          minimumValue={100}
          maximumValue={250}
          step={1}
          value={heightCm}
          onValueChange={(v) => { const c = Math.round(v); set({ heightCm: c }); setCmDraft(String(c)); }}
          minimumTrackTintColor={Colors.forest}
          maximumTrackTintColor={Colors.line}
          thumbTintColor={Colors.forest}
        />
        <View style={styles.labels}>
          <Text style={styles.label}>100 cm</Text>
          <Text style={styles.label}>250 cm</Text>
        </View>
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
  },
  suffix: { fontFamily: Typography.geistMono, fontSize: 22, color: Colors.muted },
  slider: { width: '100%', height: 40 },
  sliderLabel: { fontFamily: Typography.geist, fontSize: 12, color: Colors.muted, alignSelf: 'flex-start' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4 },
  label: { fontFamily: Typography.geistMono, fontSize: 12, color: Colors.muted },
  ftRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  col: { alignItems: 'center' },
  unitLabel: { fontFamily: Typography.geist, fontSize: 13, color: Colors.muted, letterSpacing: 1 },
  separator: { fontFamily: Typography.geistMono, fontSize: 40, color: Colors.muted, marginTop: 16 },
});
