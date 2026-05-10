import { create } from 'zustand';
import type { Sex, GoalType, ActivityLevel } from '../lib/nutrition';

export interface OnboardingState {
  units: 'metric' | 'imperial';
  sex: Sex | null;
  age: number;
  heightCm: number;
  weightKg: number;
  goalType: GoalType;
  goalWeightKg: number;
  ratePerWeek: number;
  activityFactor: ActivityLevel;
  macroP: number;
  macroC: number;
  macroF: number;
  fiberTargetG: number;
  firstName: string;

  set: (partial: Partial<Omit<OnboardingState, 'set'>>) => void;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  units: 'metric',
  sex: null,
  age: 25,
  heightCm: 170,
  weightKg: 70,
  goalType: 'lose',
  goalWeightKg: 65,
  ratePerWeek: 0.5,
  activityFactor: 1.375,
  macroP: 30,
  macroC: 40,
  macroF: 30,
  fiberTargetG: 30,
  firstName: '',
  set: (partial) => set((s) => ({ ...s, ...partial })),
}));
