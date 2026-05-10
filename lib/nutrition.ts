export type Sex = 'male' | 'female';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export function calcBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calcTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * activity);
}

export function calcKcalTarget(
  tdee: number,
  goalType: GoalType,
  ratePerWeek: number
): number {
  if (goalType === 'maintain') return tdee;
  const dailyDelta = Math.round((ratePerWeek * 7700) / 7);
  return goalType === 'lose' ? tdee - dailyDelta : tdee + dailyDelta;
}

export function calcMacroGrams(kcal: number, macroP: number, macroC: number, macroF: number) {
  return {
    proteinG: Math.round((kcal * macroP) / 100 / 4),
    carbsG: Math.round((kcal * macroC) / 100 / 4),
    fatG: Math.round((kcal * macroF) / 100 / 9),
  };
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  return { ft: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
}

export function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54);
}
