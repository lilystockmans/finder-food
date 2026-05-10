import { getDb, type Ingredient } from './db';

export type SavedMeal = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  totalKcal: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  createdAt: number;
};

export function getAllSavedMeals(): SavedMeal[] {
  const db = getDb();
  const rows = db.getAllSync<any>('SELECT * FROM saved_meals ORDER BY createdAt DESC');
  return rows.map((r) => ({ ...r, ingredients: JSON.parse(r.ingredientsJson) }));
}

export function insertSavedMeal(meal: Omit<SavedMeal, 'id' | 'createdAt'>) {
  const db = getDb();
  db.runSync(
    `INSERT INTO saved_meals (id, name, ingredientsJson, totalKcal, totalProteinG, totalCarbsG, totalFatG, totalFiberG, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Date.now().toString(),
      meal.name,
      JSON.stringify(meal.ingredients),
      meal.totalKcal,
      meal.totalProteinG,
      meal.totalCarbsG,
      meal.totalFatG,
      meal.totalFiberG,
      Date.now(),
    ]
  );
}

export function renameSavedMeal(id: string, name: string) {
  const db = getDb();
  db.runSync('UPDATE saved_meals SET name = ? WHERE id = ?', [name, id]);
}

export function deleteSavedMeal(id: string) {
  const db = getDb();
  db.runSync('DELETE FROM saved_meals WHERE id = ?', [id]);
}
