import { GenerateImageSchema } from './_lib/zod-schemas';
import { getEnv } from './_lib/env';
import { rateLimit, getClientIp } from './_lib/rate-limit';
import { createSSEStream, sseHeaders } from './_lib/sse';
import { generateImages } from './_lib/fal';
import { imageModelCost } from './_lib/pricing';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const ip = getClientIp(req);
  const rl = rateLimit(`image:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return Response.json({ error: 'rate_limited', resetMs: rl.resetMs }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 });
  }
  const parsed = GenerateImageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });
  }

  let env;
  try {
    env = getEnv();
  } catch (err) {
    return Response.json({ error: 'missing_env', message: (err as Error).message }, { status: 500 });
  }

  const started = Date.now();
  const stream = createSSEStream(async (emit) => {
    emit({ event: 'status', data: { status: 'generating-image' } });
    try {
      const images = await generateImages(env.FAL_API_KEY, parsed.data);
      emit({ event: 'images', data: { images } });
      const costUsd = imageModelCost(parsed.data.model, parsed.data.batch);
      emit({
        event: 'done',
        data: { images, elapsedMs: Date.now() - started, costUsd },
      });
    } catch (err) {
      emit({ event: 'error', data: { message: (err as Error).message } });
    }
  });

  return new Response(stream, { headers: sseHeaders() });
}
