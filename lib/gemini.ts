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

const TEXT_PROMPT = `You are a nutrition assistant. The user describes a meal in text. Return ONLY a valid JSON array with each food item — no other text, no markdown, just the array. Each item: {name: string, grams: number, kcal: number, protein_g: number, carbs_g: number, fat_g: number, fiber_g: number, confidence: number 0–1}. Use standard nutrition values per 100g and estimate realistic gram amounts based on typical serving sizes.`;

async function analysePhotoOnce(
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
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  console.log('[gemini] response status:', res.status);
  if (res.status === 429) {
    const err = new Error('RATE_LIMIT') as any;
    err.code = 429;
    throw err;
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.log('[gemini] error body:', errBody);
    throw new Error(`Gemini error ${res.status}`);
  }

  const data = await res.json();
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
  console.log('[gemini] parts count:', parts.length, 'part types:', parts.map(p => p.thought ? 'thought' : 'text'));
  const text: string = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  console.log('[gemini] extracted text:', text.slice(0, 200));

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Invalid Gemini response');

  return JSON.parse(match[0]) as GeminiIngredient[];
}

export async function analysePhoto(
  base64Jpeg: string,
  apiKey: string
): Promise<GeminiIngredient[]> {
  try {
    return await analysePhotoOnce(base64Jpeg, apiKey);
  } catch (err: any) {
    if (err?.code === 429) throw err;
    console.log('[gemini] first attempt failed, retrying once:', err?.message);
    return await analysePhotoOnce(base64Jpeg, apiKey);
  }
}

export async function analyseMealText(
  description: string,
  apiKey: string
): Promise<GeminiIngredient[]> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: TEXT_PROMPT },
          { text: `Meal: ${description}` },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
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
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
  const text: string = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Invalid Gemini response');

  return JSON.parse(match[0]) as GeminiIngredient[];
}

export type WeekAnalysis = {
  doingWell: string[];
  improve: string[];
};

const WEEK_PROMPT = `You are a supportive nutrition coach reviewing one week of a user's logged meals against their targets. Return ONLY a valid JSON object, no other text, no markdown. Shape: {"doingWell": string[], "improve": string[]}. "doingWell" should be 1-3 short specific things they're doing well (reference actual foods/macros from the data if possible). "improve" should be 1-3 short, kind, specific, actionable suggestions. Keep each item under 20 words.

Week data:
`;

export async function analyseWeek(
  weekSummary: string,
  apiKey: string
): Promise<WeekAnalysis> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: WEEK_PROMPT + weekSummary },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini error ${res.status}`);

  const data = await res.json();
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
  const text: string = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid Gemini response');

  const parsed = JSON.parse(match[0]);
  return {
    doingWell: Array.isArray(parsed.doingWell) ? parsed.doingWell : [],
    improve: Array.isArray(parsed.improve) ? parsed.improve : [],
  };
}

