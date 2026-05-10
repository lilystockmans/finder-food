import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('finderfood.db');
  }
  return db;
}

export function initDb() {
  const db = getDb();
  db.execSync(`
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
