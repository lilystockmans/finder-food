import React from 'react';
import { router } from 'expo-router';
import { OnboardingShell } from '../../components/OnboardingShell';
import { NumberScrubber } from '../../components/NumberScrubber';
import { useOnboarding } from '../../store/onboarding';

export default function Step3() {
  const { age, set } = useOnboarding();

  return (
    <OnboardingShell
      step={3}
      title="How old are you?"
      canContinue={age >= 13 && age <= 99}
      onContinue={() => router.push('/onboarding/step-4')}
    >
      <NumberScrubber
        value={age}
        onChange={(v) => set({ age: v })}
        min={13}
        max={99}
        suffix="years"
      />
    </OnboardingShell>
  );
}
