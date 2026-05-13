import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitialized = false;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('finderfood.db');
  }
  if (!dbInitialized) {
    dbInitialized = true;
    runMigrations(db);
  }
  return db;
}

// Called from _layout.tsx on startup — safe to call multiple times (idempotent)
export function initDb() {
  getDb();
}

function runMigrations(database: SQLite.SQLiteDatabase) {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS meal_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      timestampMs INTEGER NOT NULL,
      slot TEXT NOT NULL,
      method TEXT NOT NULL,
      mealName TEXT,
      ingredientsJson TEXT NOT NULL,
      totalKcal REAL NOT NULL,
      totalProteinG REAL NOT NULL,
      totalCarbsG REAL NOT NULL,
      totalFatG REAL NOT NULL,
      totalFiberG REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS barcode_cache (
      barcode TEXT PRIMARY KEY,
      productJson TEXT NOT NULL,
      cachedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saved_meals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ingredientsJson TEXT NOT NULL,
      totalKcal REAL NOT NULL,
      totalProteinG REAL NOT NULL,
      totalCarbsG REAL NOT NULL,
      totalFatG REAL NOT NULL,
      totalFiberG REAL NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS water (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      cups INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export type Ingredient = {
  name: string;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type MealEntry = {
  id: string;
  date: string;
  timestampMs: number;
  slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  method: 'manual' | 'barcode' | 'photo' | 'saved';
  mealName: string;
  ingredients: Ingredient[];
  totalKcal: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
};

export function getMealsForDate(date: string): MealEntry[] {
  const db = getDb();
  const rows = db.getAllSync<any>(
    'SELECT * FROM meal_entries WHERE date = ? ORDER BY timestampMs ASC',
    [date]
  );
  return rows.map(rowToMeal);
}

export function insertMeal(meal: MealEntry) {
  const db = getDb();
  db.runSync(
    `INSERT INTO meal_entries
      (id, date, timestampMs, slot, method, mealName, ingredientsJson,
       totalKcal, totalProteinG, totalCarbsG, totalFatG, totalFiberG)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.id,
      meal.date,
      meal.timestampMs,
      meal.slot,
      meal.method,
      meal.mealName,
      JSON.stringify(meal.ingredients),
      meal.totalKcal,
      meal.totalProteinG,
      meal.totalCarbsG,
      meal.totalFatG,
      meal.totalFiberG,
    ]
  );
}

export function deleteMeal(id: string) {
  const db = getDb();
  db.runSync('DELETE FROM meal_entries WHERE id = ?', [id]);
}

export function updateMealSlot(id: string, slot: MealEntry['slot']) {
  const db = getDb();
  db.runSync('UPDATE meal_entries SET slot = ? WHERE id = ?', [slot, id]);
}

export function updateMealServing(id: string, ingredients: Ingredient[], totals: {
  totalKcal: number; totalProteinG: number; totalCarbsG: number; totalFatG: number; totalFiberG: number;
}) {
  const db = getDb();
  db.runSync(
    `UPDATE meal_entries SET ingredientsJson = ?, totalKcal = ?, totalProteinG = ?,
     totalCarbsG = ?, totalFatG = ?, totalFiberG = ? WHERE id = ?`,
    [
      JSON.stringify(ingredients),
      totals.totalKcal,
      totals.totalProteinG,
      totals.totalCarbsG,
      totals.totalFatG,
      totals.totalFiberG,
      id,
    ]
  );
}

export function getCachedBarcode(barcode: string): any | null {
  const db = getDb();
  const row = db.getFirstSync<any>('SELECT productJson FROM barcode_cache WHERE barcode = ?', [barcode]);
  return row ? JSON.parse(row.productJson) : null;
}

export function cacheBarcode(barcode: string, product: any) {
  const db = getDb();
  db.runSync(
    'INSERT OR REPLACE INTO barcode_cache (barcode, productJson, cachedAt) VALUES (?, ?, ?)',
    [barcode, JSON.stringify(product), Date.now()]
  );
}

function rowToMeal(row: any): MealEntry {
  return {
    ...row,
    ingredients: JSON.parse(row.ingredientsJson),
  };
}

export function getLoggingStreak(): number {
  const db = getDb();
  const rows = db.getAllSync<{ date: string }>(
    'SELECT DISTINCT date FROM meal_entries ORDER BY date DESC'
  );
  if (rows.length === 0) return 0;
  const dateSet = new Set(rows.map(r => r.date));
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let start = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null;
  if (!start) return 0;
  let streak = 0;
  const cur = new Date(start + 'T12:00:00');
  while (true) {
    const d = cur.toISOString().split('T')[0];
    if (!dateSet.has(d)) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export function getConsistencyDays(weeks: number): { date: string; logged: boolean }[] {
  const db = getDb();
  const days = weeks * 7;
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  const startStr = start.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const rows = db.getAllSync<{ date: string }>(
    'SELECT DISTINCT date FROM meal_entries WHERE date >= ? AND date <= ?',
    [startStr, todayStr]
  );
  const loggedSet = new Set(rows.map(r => r.date));
  const result: { date: string; logged: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({ date: dateStr, logged: loggedSet.has(dateStr) });
  }
  return result;
}

export type RecentMeal = {
  mealName: string;
  totalKcal: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  ingredients: Ingredient[];
  slot: string;
};

export function getRecentMeals(days: number, limit: number): RecentMeal[] {
  const db = getDb();
  const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const rows = db.getAllSync<any>(
    `SELECT mealName, totalKcal, totalProteinG, totalCarbsG, totalFatG, totalFiberG,
            ingredientsJson, slot, MAX(timestampMs) as latestMs
     FROM meal_entries
     WHERE date >= ? AND mealName IS NOT NULL AND mealName != ''
     GROUP BY mealName
     ORDER BY latestMs DESC
     LIMIT ?`,
    [start, limit]
  );
  return rows.map(r => ({
    mealName: r.mealName,
    totalKcal: r.totalKcal,
    totalProteinG: r.totalProteinG,
    totalCarbsG: r.totalCarbsG,
    totalFatG: r.totalFatG,
    totalFiberG: r.totalFiberG,
    ingredients: JSON.parse(r.ingredientsJson),
    slot: r.slot,
  }));
}
