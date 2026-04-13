import { EnhancePromptSchema } from './_lib/zod-schemas';
import { getEnv } from './_lib/env';
import { rateLimit, getClientIp } from './_lib/rate-limit';

export const config = { runtime: 'edge' };

const ENHANCER_SYSTEM = `You rewrite short user prompts into vivid, detailed image-generation prompts.
Keep under 80 words. Add lighting, composition, camera, mood, and style. Never add signatures or watermarks.
Return ONLY the rewritten prompt — no preamble, no quotes.`;

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: { totalTokenCount?: number };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const ip = getClientIp(req);
  const rl = rateLimit(`enhance:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return Response.json({ error: 'rate_limited', resetMs: rl.resetMs }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 });
  }
  const parsed = EnhancePromptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });
  }

  let env;
  try {
    env = getEnv();
  } catch (err) {
    return Response.json({ error: 'missing_env', message: (err as Error).message }, { status: 500 });
  }
  if (!env.GOOGLE_API_KEY) {
    return Response.json({ error: 'missing_google_key' }, { status: 500 });
  }

  const styleNudge = parsed.data.style ? `Style anchor: ${parsed.data.style}. ` : '';
  const userPrompt = `${styleNudge}User prompt: ${parsed.data.prompt}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GOOGLE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ENHANCER_SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 256 },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return Response.json(
        { error: 'gemini_error', status: res.status, message: errText.slice(0, 400) },
        { status: 502 },
      );
    }
    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    return Response.json({ enhanced: text, tokens: data.usageMetadata?.totalTokenCount ?? 0 });
  } catch (err) {
    return Response.json({ error: 'provider_error', message: (err as Error).message }, { status: 502 });
  }
}
