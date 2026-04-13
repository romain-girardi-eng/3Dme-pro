import { Generate3DSchema } from './_lib/zod-schemas';
import { getEnv } from './_lib/env';
import { rateLimit, getClientIp } from './_lib/rate-limit';
import { createSSEStream, sseHeaders } from './_lib/sse';
import { generate3D } from './_lib/fal';
import { threeDTierCost } from './_lib/pricing';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const ip = getClientIp(req);
  const rl = rateLimit(`three:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return Response.json({ error: 'rate_limited', resetMs: rl.resetMs }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 });
  }
  const parsed = Generate3DSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });
  }

  const env = getEnv();
  const started = Date.now();
  const stream = createSSEStream(async (emit) => {
    emit({ event: 'status', data: { status: 'generating-3d', tier: parsed.data.tier } });
    const { glbUrl, splatUrl } = await generate3D(env.FAL_API_KEY, parsed.data);
    emit({
      event: 'done',
      data: {
        glbUrl,
        splatUrl,
        elapsedMs: Date.now() - started,
        costUsd: threeDTierCost(parsed.data.tier),
      },
    });
  });

  return new Response(stream, { headers: sseHeaders() });
}
