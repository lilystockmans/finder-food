import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { NumberScrubber } from '../../components/NumberScrubber';
import { useOnboarding } from '../../store/onboarding';
import { ftInToCm, cmToFtIn } from '../../lib/nutrition';
import { Colors, Typography } from '../../constants/tokens';

export default function Step4() {
  const { units, heightCm, set } = useOnboarding();
  const { ft, inches } = cmToFtIn(heightCm);

  if (units === 'imperial') {
    return (
      <OnboardingShell
        step={4}
        title="How tall are you?"
        canContinue={heightCm > 0}
        onContinue={() => router.push('/onboarding/step-5')}
      >
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.unit}>ft</Text>
            <NumberScrubber value={ft} onChange={(v) => set({ heightCm: ftInToCm(v, inches) })} min={3} max={8} />
          </View>
          <View style={styles.col}>
            <Text style={styles.unit}>in</Text>
            <NumberScrubber value={inches} onChange={(v) => set({ heightCm: ftInToCm(ft, v) })} min={0} max={11} />
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
      <NumberScrubber
        value={heightCm}
        onChange={(v) => set({ heightCm: v })}
        min={100}
        max={250}
        suffix="cm"
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 32 },
  col: { alignItems: 'center', gap: 8 },
  unit: {
    fontFamily: Typography.geist,
    fontSize: 14,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
