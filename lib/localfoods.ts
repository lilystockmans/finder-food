import { type OFFSearchResult } from './openfoodfacts';

const LOCAL_FOODS: OFFSearchResult[] = [
  // eggs & dairy
  { id: 'local-egg', name: 'Egg (whole, raw)', brand: '', kcalPer100g: 143, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 9.5, fiberPer100g: 0 },
  { id: 'local-egg-white', name: 'Egg white (raw)', brand: '', kcalPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, fiberPer100g: 0 },
  { id: 'local-egg-yolk', name: 'Egg yolk (raw)', brand: '', kcalPer100g: 322, proteinPer100g: 16, carbsPer100g: 3.6, fatPer100g: 27, fiberPer100g: 0 },
  { id: 'local-milk-whole', name: 'Milk (whole)', brand: '', kcalPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, fiberPer100g: 0 },
  { id: 'local-greek-yogurt', name: 'Greek yogurt (plain)', brand: '', kcalPer100g: 97, proteinPer100g: 9, carbsPer100g: 3.6, fatPer100g: 5, fiberPer100g: 0 },
  { id: 'local-cheese-cheddar', name: 'Cheddar cheese', brand: '', kcalPer100g: 402, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33, fiberPer100g: 0 },
  { id: 'local-butter', name: 'Butter', brand: '', kcalPer100g: 717, proteinPer100g: 0.9, carbsPer100g: 0.1, fatPer100g: 81, fiberPer100g: 0 },
  // meat & fish
  { id: 'local-chicken-breast', name: 'Chicken breast (raw)', brand: '', kcalPer100g: 120, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 3, fiberPer100g: 0 },
  { id: 'local-chicken-thigh', name: 'Chicken thigh (raw)', brand: '', kcalPer100g: 177, proteinPer100g: 18, carbsPer100g: 0, fatPer100g: 11, fiberPer100g: 0 },
  { id: 'local-beef-mince', name: 'Beef mince (raw, 20% fat)', brand: '', kcalPer100g: 254, proteinPer100g: 17, carbsPer100g: 0, fatPer100g: 20, fiberPer100g: 0 },
  { id: 'local-beef-steak', name: 'Beef steak (raw)', brand: '', kcalPer100g: 177, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 8, fiberPer100g: 0 },
  { id: 'local-pork-belly', name: 'Pork belly (raw)', brand: '', kcalPer100g: 395, proteinPer100g: 10, carbsPer100g: 0, fatPer100g: 40, fiberPer100g: 0 },
  { id: 'local-salmon', name: 'Salmon fillet (raw)', brand: '', kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, fiberPer100g: 0 },
  { id: 'local-tuna', name: 'Tuna (raw)', brand: '', kcalPer100g: 144, proteinPer100g: 23, carbsPer100g: 0, fatPer100g: 5, fiberPer100g: 0 },
  { id: 'local-shrimp', name: 'Shrimp (raw)', brand: '', kcalPer100g: 85, proteinPer100g: 18, carbsPer100g: 0.9, fatPer100g: 0.5, fiberPer100g: 0 },
  // grains & bread
  { id: 'local-rice-white', name: 'Rice (white, cooked)', brand: '', kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4 },
  { id: 'local-rice-brown', name: 'Rice (brown, cooked)', brand: '', kcalPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9, fiberPer100g: 1.8 },
  { id: 'local-pasta', name: 'Pasta (cooked)', brand: '', kcalPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1, fiberPer100g: 1.8 },
  { id: 'local-oats', name: 'Oats (dry)', brand: '', kcalPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, fiberPer100g: 10 },
  { id: 'local-bread-white', name: 'Bread (white)', brand: '', kcalPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, fiberPer100g: 2.7 },
  { id: 'local-bread-whole', name: 'Bread (wholegrain)', brand: '', kcalPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.5, fiberPer100g: 7 },
  // vegetables
  { id: 'local-potato', name: 'Potato (raw)', brand: '', kcalPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, fiberPer100g: 2.2 },
  { id: 'local-sweet-potato', name: 'Sweet potato (raw)', brand: '', kcalPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, fiberPer100g: 3 },
  { id: 'local-broccoli', name: 'Broccoli (raw)', brand: '', kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, fiberPer100g: 2.6 },
  { id: 'local-spinach', name: 'Spinach (raw)', brand: '', kcalPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 2.2 },
  { id: 'local-tomato', name: 'Tomato (raw)', brand: '', kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, fiberPer100g: 1.2 },
  { id: 'local-carrot', name: 'Carrot (raw)', brand: '', kcalPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, fiberPer100g: 2.8 },
  { id: 'local-onion', name: 'Onion (raw)', brand: '', kcalPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1, fiberPer100g: 1.7 },
  { id: 'local-avocado', name: 'Avocado', brand: '', kcalPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, fiberPer100g: 7 },
  // fruit
  { id: 'local-banana', name: 'Banana', brand: '', kcalPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6 },
  { id: 'local-apple', name: 'Apple', brand: '', kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4 },
  { id: 'local-orange', name: 'Orange', brand: '', kcalPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, fiberPer100g: 2.4 },
  { id: 'local-strawberry', name: 'Strawberry', brand: '', kcalPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3, fiberPer100g: 2 },
  // legumes & nuts
  { id: 'local-lentils', name: 'Lentils (cooked)', brand: '', kcalPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, fiberPer100g: 8 },
  { id: 'local-chickpeas', name: 'Chickpeas (cooked)', brand: '', kcalPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6, fiberPer100g: 7.6 },
  { id: 'local-almonds', name: 'Almonds', brand: '', kcalPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, fiberPer100g: 12.5 },
  { id: 'local-peanut-butter', name: 'Peanut butter', brand: '', kcalPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, fiberPer100g: 6 },
  // oils & fats
  { id: 'local-olive-oil', name: 'Olive oil', brand: '', kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, fiberPer100g: 0 },
];

export function searchLocalFoods(query: string): OFFSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return LOCAL_FOODS.filter((f) => f.name.toLowerCase().includes(q));
}
