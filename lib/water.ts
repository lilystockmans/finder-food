import { getDb } from './db';

export function getTodayWater(date: string): number {
  const db = getDb();
  const row = db.getFirstSync<{ cups: number }>('SELECT cups FROM water WHERE date = ?', [date]);
  return row ? row.cups : 0;
}

export function setTodayWater(date: string, cups: number) {
  const clamped = Math.max(0, Math.min(8, cups));
  const db = getDb();
  db.runSync('INSERT OR REPLACE INTO water (date, cups) VALUES (?, ?)', [date, clamped]);
}

export function getWaterForDates(dates: string[]): Record<string, number> {
  if (dates.length === 0) return {};
  const db = getDb();
  const placeholders = dates.map(() => '?').join(', ');
  const rows = db.getAllSync<{ date: string; cups: number }>(
    `SELECT date, cups FROM water WHERE date IN (${placeholders})`,
    dates
  );
  const result: Record<string, number> = {};
  for (const row of rows) result[row.date] = row.cups;
  return result;
}
