import Constants from 'expo-constants';
import type { GeminiIngredient } from './gemini';

const MODEL = 'gemma4:26b';
const TIMEOUT_MS = 30000;

export function getLocalAiUrl(): string {
  return (Constants.expoConfig?.extra?.localAiUrl as string) ?? '';
}

function unreachableError(detail: string): Error {
  const err = new Error(detail) as any;
  err.code = 'LOCAL_AI_UNREACHABLE';
  return err;
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function chatCompletion(baseUrl: string, prompt: string, maxTokens: number): Promise<string> {
  if (!baseUrl) throw unreachableError('No local AI URL configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    console.log('[localAi] request failed:', err?.message);
    throw unreachableError(err?.message ?? 'Network request failed');
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    console.log('[localAi] non-ok status:', res.status);
    throw unreachableError(`Local AI error ${res.status}`);
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '';
  return stripThinking(raw);
}

const TEXT_PROMPT = `You are a nutrition assistant. The user describes a meal in text. Return ONLY a valid JSON array with each food item — no other text, no markdown, just the array. Each item: {name: string, grams: number, kcal: number, protein_g: number, carbs_g: number, fat_g: number, fiber_g: number, confidence: number 0–1}. Use standard nutrition values per 100g and estimate realistic gram amounts based on typical serving sizes.

Meal: `;

export async function analyseMealTextLocal(description: string): Promise<GeminiIngredient[]> {
  const baseUrl = getLocalAiUrl();
  const text = await chatCompletion(baseUrl, TEXT_PROMPT + description, 800);

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw unreachableError('Invalid local AI response');

  return JSON.parse(match[0]) as GeminiIngredient[];
}

export type WeekAnalysis = {
  doingWell: string[];
  improve: string[];
};

const WEEK_PROMPT = `You are a supportive nutrition coach reviewing one week of a user's logged meals against their targets. Return ONLY a valid JSON object, no other text, no markdown. Shape: {"doingWell": string[], "improve": string[]}. "doingWell" should be 1-3 short specific things they're doing well (reference actual foods/macros from the data if possible). "improve" should be 1-3 short, kind, specific, actionable suggestions. Keep each item under 20 words.

Week data:
`;

export async function analyseWeekLocal(weekSummary: string): Promise<WeekAnalysis> {
  const baseUrl = getLocalAiUrl();
  const text = await chatCompletion(baseUrl, WEEK_PROMPT + weekSummary, 600);

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw unreachableError('Invalid local AI response');

  const parsed = JSON.parse(match[0]);
  return {
    doingWell: Array.isArray(parsed.doingWell) ? parsed.doingWell : [],
    improve: Array.isArray(parsed.improve) ? parsed.improve : [],
  };
}
