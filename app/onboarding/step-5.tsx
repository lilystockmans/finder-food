import React from 'react';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { NumberScrubber } from '../../components/NumberScrubber';
import { useOnboarding } from '../../store/onboarding';
import { lbsToKg, kgToLbs } from '../../lib/nutrition';

export default function Step5() {
  const { units, weightKg, set } = useOnboarding();
  const displayVal = units === 'imperial' ? kgToLbs(weightKg) : weightKg;

  return (
    <OnboardingShell
      step={5}
      title="What's your current weight?"
      canContinue={weightKg > 0}
      onContinue={() => router.push('/onboarding/step-6')}
    >
      <NumberScrubber
        value={displayVal}
        onChange={(v) => set({ weightKg: units === 'imperial' ? lbsToKg(v) : v })}
        min={units === 'imperial' ? 66 : 30}
        max={units === 'imperial' ? 660 : 300}
        step={units === 'imperial' ? 0.5 : 0.1}
        decimals={1}
        suffix={units === 'imperial' ? 'lbs' : 'kg'}
      />
    </OnboardingShell>
  );
}
