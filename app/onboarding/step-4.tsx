import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { useOnboarding } from '../../store/onboarding';
import { ftInToCm, cmToFtIn } from '../../lib/nutrition';
import { Colors, Typography } from '../../constants/tokens';

export default function Step4() {
  const { units, heightCm, set } = useOnboarding();
  const { ft, inches } = cmToFtIn(heightCm);

  const [cmDraft, setCmDraft] = useState(heightCm > 0 ? String(heightCm) : '');
  const [ftDraft, setFtDraft] = useState(ft > 0 ? String(ft) : '');
  const [inDraft, setInDraft] = useState(String(inches));

  const handleCm = (v: string) => {
    setCmDraft(v);
    const n = parseInt(v);
    if (!isNaN(n) && n >= 100 && n <= 250) set({ heightCm: n });
  };

  const handleFt = (v: string) => {
    setFtDraft(v);
    const f = parseInt(v);
    if (!isNaN(f) && f >= 3 && f <= 8) set({ heightCm: ftInToCm(f, parseInt(inDraft) || 0) });
  };

  const handleIn = (v: string) => {
    setInDraft(v);
    const i = parseInt(v);
    const f = parseInt(ftDraft) || 0;
    if (!isNaN(i) && i >= 0 && i <= 11) set({ heightCm: ftInToCm(f, i) });
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
              <TextInput
                style={styles.value}
                value={ftDraft}
                onChangeText={handleFt}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
                placeholder="5"
                placeholderTextColor={Colors.line}
                maxLength={1}
              />
              <Text style={styles.unitLabel}>ft</Text>
            </View>
            <Text style={styles.separator}>'</Text>
            <View style={styles.col}>
              <TextInput
                style={styles.value}
                value={inDraft}
                onChangeText={handleIn}
                keyboardType="number-pad"
                selectTextOnFocus
                placeholder="8"
                placeholderTextColor={Colors.line}
                maxLength={2}
              />
              <Text style={styles.unitLabel}>in</Text>
            </View>
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
        <TextInput
          style={styles.value}
          value={cmDraft}
          onChangeText={handleCm}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          placeholder="170"
          placeholderTextColor={Colors.line}
          maxLength={3}
        />
        <Text style={styles.suffix}>cm</Text>
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
  ftRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  col: { alignItems: 'center', gap: 4 },
  unitLabel: { fontFamily: Typography.geist, fontSize: 14, color: Colors.muted, letterSpacing: 1 },
  separator: { fontFamily: Typography.geistMono, fontSize: 40, color: Colors.muted, marginBottom: 20 },
});
