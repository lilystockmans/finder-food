export type Sex = 'male' | 'female';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725;

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

// Hacker's Diet EWMA: trend = 0.9 * prev + 0.1 * today (~20-day smoothing, same as TrendWeight/MacroFactor)
export function calcTrendWeight(
  weightLog: { date: string; kg: number }[]
): { date: string; trend: number }[] {
  if (weightLog.length === 0) return [];
  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  let ema = sorted[0].kg;
  return sorted.map(entry => {
    ema = 0.9 * ema + 0.1 * entry.kg;
    return { date: entry.date, trend: parseFloat(ema.toFixed(2)) };
  });
}

export type AdaptationProfile = {
  goalType: GoalType;
  ratePerWeek: number;
  kcalTarget: number;
};

export type AdaptationResult = {
  suggestion: 'increase' | 'decrease' | 'maintain' | null;
  delta: number;
  message: string;
  weeklyActualChange: number;
  weeklyExpectedChange: number;
};

export function calcWeeklyAdaptation(
  profile: AdaptationProfile,
  weightLog: { date: string; kg: number }[]
): AdaptationResult {
  const none: AdaptationResult = { suggestion: null, delta: 0, message: '', weeklyActualChange: 0, weeklyExpectedChange: 0 };
  if (weightLog.length < 14) return none;

  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const last14 = sorted.slice(-14);
  const weeklyActualChange = (last14[13].kg - last14[0].kg) / 2;

  const weeklyExpectedChange =
    profile.goalType === 'lose' ? -profile.ratePerWeek :
    profile.goalType === 'gain' ? profile.ratePerWeek : 0;

  if (profile.goalType === 'lose') {
    if (weeklyActualChange < weeklyExpectedChange * 1.25) {
      return { suggestion: 'increase', delta: 100, message: "You're losing a bit faster than planned — consider eating 100 kcal more to preserve muscle.", weeklyActualChange, weeklyExpectedChange };
    } else if (weeklyActualChange > weeklyExpectedChange * 0.5) {
      return { suggestion: 'decrease', delta: -100, message: "Progress is a little slower than expected. Try reducing by 100 kcal to stay on track.", weeklyActualChange, weeklyExpectedChange };
    }
    return { suggestion: 'maintain', delta: 0, message: "You're right on pace — keep it up.", weeklyActualChange, weeklyExpectedChange };
  } else if (profile.goalType === 'gain') {
    if (weeklyActualChange > weeklyExpectedChange * 1.25) {
      return { suggestion: 'decrease', delta: -100, message: "Gaining a little faster than planned — reducing by 100 kcal can keep gains lean.", weeklyActualChange, weeklyExpectedChange };
    } else if (weeklyActualChange < weeklyExpectedChange * 0.5) {
      return { suggestion: 'increase', delta: 100, message: "Gains are slower than expected. Try adding 100 kcal to fuel more growth.", weeklyActualChange, weeklyExpectedChange };
    }
    return { suggestion: 'maintain', delta: 0, message: "Gaining right on schedule — great work.", weeklyActualChange, weeklyExpectedChange };
  } else {
    if (Math.abs(weeklyActualChange) > 0.15) {
      const up = weeklyActualChange > 0;
      return { suggestion: up ? 'decrease' : 'increase', delta: up ? -100 : 100, message: up ? "Weight is trending up slightly — reducing by 100 kcal should bring you back to maintenance." : "Weight is trending down slightly — adding 100 kcal should stabilize things.", weeklyActualChange, weeklyExpectedChange };
    }
    return { suggestion: 'maintain', delta: 0, message: "Weight is stable — you're nailing maintenance.", weeklyActualChange, weeklyExpectedChange };
  }
}
