import Constants from 'expo-constants';

const MODEL = 'gemini-2.5-flash';

// gemini-2.5-flash is a thinking model and its thinking tokens are drawn from
// this same budget. Measured worst case: ~3200 thinking + ~600 output. The old
// 4096 ceiling left ~950 headroom, so complex meals truncated the JSON mid-array
// and the parse failed. Do NOT cap thinking to buy headroom instead — capped
// thinking measurably degrades recognition (5 ingredients vs 8 on the same meal).
const MAX_OUTPUT_TOKENS = 8192;

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

export type GeminiErrorKind =
  | 'NO_KEY'
  | 'RATE_LIMIT'
  | 'TRUNCATED'
  | 'BLOCKED'
  | 'EMPTY'
  | 'PARSE'
  | 'NETWORK'
  | 'HTTP';

/** Human-readable message for a failure from any of the analyse* functions. */
export function geminiErrorMessage(err: any): string {
  switch (err?.kind as GeminiErrorKind) {
    case 'NO_KEY':
      return 'Gemini key not set — the app needs rebuilding';
    case 'TRUNCATED':
      return 'That was too much to read at once — try a simpler photo or fewer items';
    case 'BLOCKED':
      return 'Gemini would not analyse that image — try another shot';
    case 'EMPTY':
      return 'No food detected — try a clearer shot';
    case 'NETWORK':
      return 'No connection — check your wifi and try again';
    case 'HTTP':
      return `Gemini error ${err?.status ?? ''} — try again`.replace('  ', ' ');
    default:
      return "Couldn't read that — try again";
  }
}

function fail(kind: GeminiErrorKind, status?: number): never {
  const err = new Error(kind) as any;
  err.kind = kind;
  if (status !== undefined) err.status = status;
  // Existing call sites branch on `code === 429`; keep that contract.
  if (kind === 'RATE_LIMIT') err.code = 429;
  throw err;
}

/**
 * Kinds where retrying could plausibly succeed AND is worth a request.
 *
 * The free tier allows only 20 generateContent requests per day per model, so a
 * retry is expensive. TRUNCATED is deliberately excluded: the extractor already
 * salvages a partial ingredient list, and a retry would very likely truncate
 * again at the same ceiling for double the quota. PARSE is excluded for the same
 * reason — a deterministic prompt that produced unparseable output once tends to
 * do it again.
 */
function isRetryable(err: any): boolean {
  const kind = err?.kind as GeminiErrorKind;
  return kind === 'NETWORK' ||
    (kind === 'HTTP' && typeof err?.status === 'number' && err.status >= 500);
}

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

async function callGemini(
  parts: Part[],
  temperature: number
): Promise<{ text: string; truncated: boolean }> {
  const apiKey = getGeminiKey();
  if (!apiKey) fail('NO_KEY');

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      // Guarantees the model cannot wrap the payload in markdown fences.
      responseMimeType: 'application/json',
    },
  };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    console.log('[gemini] network failure:', netErr?.message);
    fail('NETWORK');
  }

  if (res.status === 429) fail('RATE_LIMIT');
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.log('[gemini] http', res.status, errBody.slice(0, 300));
    fail('HTTP', res.status);
  }

  const data = await res.json();

  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    console.log('[gemini] prompt blocked:', blockReason);
    fail('BLOCKED');
  }

  const candidate = data?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const responseParts: any[] = candidate?.content?.parts ?? [];
  const text: string = responseParts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('');

  console.log(
    '[gemini] finish:', finishReason,
    'thinking:', data?.usageMetadata?.thoughtsTokenCount,
    'output:', data?.usageMetadata?.candidatesTokenCount,
    'textlen:', text.length
  );

  if (finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT') fail('BLOCKED');

  const truncated = finishReason === 'MAX_TOKENS';
  if (!text) fail(truncated ? 'TRUNCATED' : 'EMPTY');
  if (truncated) console.log('[gemini] response truncated — attempting salvage');

  return { text, truncated };
}

/**
 * Extract a JSON array from `text`. If the array is cut off mid-stream, close it
 * after the last complete element so a partial ingredient list is still usable.
 * Returns null when nothing salvageable is present.
 */
function extractArray(text: string): string | null {
  const start = text.indexOf('[');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastCompleteElement = -1;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0 && ch === ']') return text.slice(start, i + 1);
      if (depth === 1 && ch === '}') lastCompleteElement = i;
    }
  }

  if (lastCompleteElement > start) return text.slice(start, lastCompleteElement + 1) + ']';
  return null;
}

/** Extract a complete JSON object. No salvage — a half object is not useful. */
function extractObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function parseIngredients(text: string, truncated: boolean): GeminiIngredient[] {
  const json = extractArray(text);
  if (!json) fail(truncated ? 'TRUNCATED' : 'PARSE');
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) fail('PARSE');
    return parsed as GeminiIngredient[];
  } catch {
    fail(truncated ? 'TRUNCATED' : 'PARSE');
  }
}

const SYSTEM_PROMPT = `You are a food recognition assistant. Analyse the meal in this image and return ONLY a valid JSON array, no other text. Each item: {name: string, grams: number, kcal: number, protein_g: number, carbs_g: number, fat_g: number, fiber_g: number, confidence: number 0–1}`;

const TEXT_PROMPT = `You are a nutrition assistant. The user describes a meal in text. Return ONLY a valid JSON array with each food item — no other text, no markdown, just the array. Each item: {name: string, grams: number, kcal: number, protein_g: number, carbs_g: number, fat_g: number, fiber_g: number, confidence: number 0–1}. Use standard nutrition values per 100g and estimate realistic gram amounts based on typical serving sizes.`;

async function analysePhotoOnce(base64Jpeg: string): Promise<GeminiIngredient[]> {
  const { text, truncated } = await callGemini(
    [
      { text: SYSTEM_PROMPT },
      { inline_data: { mime_type: 'image/jpeg', data: base64Jpeg } },
    ],
    0.1
  );
  return parseIngredients(text, truncated);
}

export async function analysePhoto(
  base64Jpeg: string,
  _apiKey?: string
): Promise<GeminiIngredient[]> {
  try {
    return await analysePhotoOnce(base64Jpeg);
  } catch (err: any) {
    if (!isRetryable(err)) throw err;
    console.log('[gemini] first attempt failed, retrying once:', err?.kind);
    return await analysePhotoOnce(base64Jpeg);
  }
}

export async function analyseMealText(
  description: string,
  _apiKey?: string
): Promise<GeminiIngredient[]> {
  const { text, truncated } = await callGemini(
    [{ text: TEXT_PROMPT }, { text: `Meal: ${description}` }],
    0.2
  );
  return parseIngredients(text, truncated);
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
  _apiKey?: string
): Promise<WeekAnalysis> {
  const { text, truncated } = await callGemini([{ text: WEEK_PROMPT + weekSummary }], 0.2);

  const json = extractObject(text);
  if (!json) fail(truncated ? 'TRUNCATED' : 'PARSE');

  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    fail(truncated ? 'TRUNCATED' : 'PARSE');
  }

  return {
    doingWell: Array.isArray(parsed.doingWell) ? parsed.doingWell : [],
    improve: Array.isArray(parsed.improve) ? parsed.improve : [],
  };
}
