export type OFFProduct = {
  name: string;
  brand: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingSizeG?: number;
};

export type OFFSearchResult = OFFProduct & { id: string };

export async function lookupBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await res.json();
    if (data.status !== 1 || !data.product?.nutriments) return null;
    return normaliseProduct(data.product);
  } catch {
    return null;
  }
}

export async function searchFood(query: string): Promise<OFFSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size,id,code`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.products) return [];
    return data.products
      .filter((p: any) => p.product_name && p.nutriments?.energy_value)
      .map((p: any) => ({ ...normaliseProduct(p), id: p.code || p.id || p.product_name }));
  } catch {
    return [];
  }
}

function normaliseProduct(p: any): OFFProduct {
  const n = p.nutriments || {};
  return {
    name: p.product_name || 'Unknown product',
    brand: p.brands || '',
    kcalPer100g: parseFloat(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
    proteinPer100g: parseFloat(n.proteins_100g ?? n.proteins ?? 0),
    carbsPer100g: parseFloat(n.carbohydrates_100g ?? n.carbohydrates ?? 0),
    fatPer100g: parseFloat(n.fat_100g ?? n.fat ?? 0),
    fiberPer100g: parseFloat(n.fiber_100g ?? n.fiber ?? 0),
    servingSizeG: p.serving_size ? parseFloat(p.serving_size) : undefined,
  };
}

export function scaleNutrients(product: OFFProduct, grams: number) {
  const factor = grams / 100;
  return {
    kcal: Math.round(product.kcalPer100g * factor),
    proteinG: Math.round(product.proteinPer100g * factor * 10) / 10,
    carbsG: Math.round(product.carbsPer100g * factor * 10) / 10,
    fatG: Math.round(product.fatPer100g * factor * 10) / 10,
    fiberG: Math.round(product.fiberPer100g * factor * 10) / 10,
  };
}
