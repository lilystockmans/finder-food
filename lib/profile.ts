import { getDb } from './db';
import type { Sex, GoalType, ActivityLevel } from './nutrition';

export type WeightEntry = { date: string; kg: number };

export type Profile = {
  units: 'metric' | 'imperial';
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goalType: GoalType;
  goalWeightKg: number;
  ratePerWeek: number;
  activityFactor: ActivityLevel;
  kcalTarget: number;
  macroP: number;
  macroC: number;
  macroF: number;
  fiberTargetG: number;
  firstName: string;
  weightLog: WeightEntry[];
  periodLog: string[];
};

const KEY = 'ff:profile';

function ensureKvTable() {
  const db = getDb();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function loadProfile(): Profile | null {
  try {
    ensureKvTable();
    const db = getDb();
    const row = db.getFirstSync<{ value: string }>('SELECT value FROM kv_store WHERE key = ?', [KEY]);
    if (!row) return null;
    const profile = JSON.parse(row.value);
    return { periodLog: [], ...profile };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  ensureKvTable();
  const db = getDb();
  db.runSync(
    'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
    [KEY, JSON.stringify(profile)]
  );
}

export function clearProfile() {
  ensureKvTable();
  const db = getDb();
  db.runSync('DELETE FROM kv_store WHERE key = ?', [KEY]);
}

export function getKv(key: string): string | null {
  try {
    ensureKvTable();
    const db = getDb();
    const row = db.getFirstSync<{ value: string }>('SELECT value FROM kv_store WHERE key = ?', [key]);
    return row ? row.value : null;
  } catch {
    return null;
  }
}

export function setKv(key: string, value: string) {
  ensureKvTable();
  const db = getDb();
  db.runSync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', [key, value]);
}

export function appendWeightEntry(kg: number) {
  const profile = loadProfile();
  if (!profile) return;
  const date = new Date().toISOString().split('T')[0];
  const existing = profile.weightLog.findIndex(e => e.date === date);
  if (existing >= 0) {
    profile.weightLog[existing].kg = kg;
  } else {
    profile.weightLog.push({ date, kg });
  }
  saveProfile(profile);
}

export function addPeriodEntry(date?: string) {
  const profile = loadProfile();
  if (!profile) return;
  const entryDate = date ?? new Date().toISOString().split('T')[0];
  if (profile.periodLog.includes(entryDate)) return;
  profile.periodLog.push(entryDate);
  profile.periodLog.sort();
  saveProfile(profile);
}
