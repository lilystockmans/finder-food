import Constants from 'expo-constants';

export function getGeminiKey(): string {
  return (Constants.expoConfig?.extra?.geminiKey as string) ?? '';
}

export type GeminiIngredient = {
  name: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: number;
};

const SYSTEM_PROMPT = `You are a food recognition assistant. Analyse the meal in this image and return ONLY a valid JSON array, no other text. Each item: {name: string, grams: number, kcal: number, protein_g: number, carbs_g: number, fat_g: number, fiber_g: number, confidence: number 0–1}`;

export async function analysePhoto(
  base64Jpeg: string,
  apiKey: string
): Promise<GeminiIngredient[]> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: base64Jpeg } },
        ],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    const err = new Error('RATE_LIMIT') as any;
    err.code = 429;
    throw err;
  }

  if (!res.ok) throw new Error(`Gemini error ${res.status}`);

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Invalid Gemini response');

  return JSON.parse(match[0]) as GeminiIngredient[];
}

