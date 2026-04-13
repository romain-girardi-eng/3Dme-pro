import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { EnhancePromptSchema } from './_lib/zod-schemas';
import { getEnv } from './_lib/env';
import { rateLimit, getClientIp } from './_lib/rate-limit';

const ENHANCER_SYSTEM = `You rewrite short user prompts into vivid, detailed image-generation prompts.
Keep under 80 words. Add lighting, composition, camera, mood, and style. Never add signatures or watermarks.
Return ONLY the rewritten prompt — no preamble, no quotes.`;

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

  const env = getEnv();
  if (!env.GOOGLE_API_KEY) return Response.json({ error: 'missing_google_key' }, { status: 500 });
  const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY });

  const styleNudge = parsed.data.style ? `Style anchor: ${parsed.data.style}. ` : '';
  try {
    const { text, usage } = await generateText({
      model: google('gemini-2.5-flash'),
      system: ENHANCER_SYSTEM,
      prompt: `${styleNudge}User prompt: ${parsed.data.prompt}`,
      temperature: 0.85,
    });
    return Response.json({ enhanced: text.trim(), tokens: usage?.totalTokens ?? 0 });
  } catch (err) {
    return Response.json({ error: 'provider_error', message: (err as Error).message }, { status: 502 });
  }
}
