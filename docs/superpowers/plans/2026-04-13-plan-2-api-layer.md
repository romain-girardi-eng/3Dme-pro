# 3Dme API Layer — Plan 2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the server-side AI provider layer. Three Vercel Edge Functions (`/api/enhance-prompt`, `/api/generate-image`, `/api/generate-3d`) proxy requests to fal.ai (FLUX.2 Turbo/Pro + Trellis/Hunyuan3D/Rodin Gen-2) and Google Gemini (prompt enhancement) using the Vercel AI SDK v6. A browser-side `aiService` client consumes them with streaming progress. No provider keys reach the client.

**Architecture:** Edge functions live under `frontend/api/*` (Vercel's app-directory conventions work with Vite via `vercel.json` config). Each function validates with zod, rate-limits via an in-memory + Upstash-ready limiter, calls `@fal-ai/client` or `@ai-sdk/google` server-side, and streams SSE progress events. The client uses `fetch` with `ReadableStream` to parse SSE — no extra dependency. A feature flag (`VITE_USE_FAL_API`) lets the app run with the new backend or fall back to existing Puter.js calls.

**Tech Stack:** Vercel Edge runtime, `@fal-ai/client`, `@ai-sdk/google`, `ai` (Vercel AI SDK v6), `zod`, `@upstash/redis` (optional), Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-04-13-pro-uiux-redesign-design.md`

---

## File Structure

### Create
- `frontend/vercel.json` — edge function routing + env wiring
- `frontend/api/_lib/env.ts` — server env validation
- `frontend/api/_lib/zod-schemas.ts` — request schemas
- `frontend/api/_lib/rate-limit.ts` — IP rate limiter
- `frontend/api/_lib/sse.ts` — SSE helper
- `frontend/api/_lib/fal.ts` — fal.ai client wrapper
- `frontend/api/_lib/pricing.ts` — cost estimator
- `frontend/api/enhance-prompt.ts` — Gemini prompt rewriter edge function
- `frontend/api/generate-image.ts` — FLUX.2 edge function
- `frontend/api/generate-3d.ts` — Trellis/Hunyuan/Rodin edge function
- `frontend/src/services/aiService.ts` — browser client
- `frontend/src/services/aiService.types.ts`
- `frontend/src/services/aiService.test.ts`
- `frontend/src/lib/sse-client.ts` — browser SSE parser
- `frontend/src/lib/sse-client.test.ts`
- `frontend/api/_lib/zod-schemas.test.ts`
- `frontend/api/_lib/pricing.test.ts`
- `frontend/.env.example` — documents required env vars

### Modify
- `frontend/package.json` — add `@fal-ai/client`, `ai`, `@ai-sdk/google`, `zod`
- `frontend/src/stores/sceneStore.ts` — add `useFalApi` flag selector (no behavior change)
- `frontend/.gitignore` — ensure `.vercel/` and `.env.local` ignored

---

## Task 1: Install API deps

**Files:** `frontend/package.json`

- [ ] **Step 1: Install**

```bash
cd frontend && npm install @fal-ai/client ai @ai-sdk/google zod
```

- [ ] **Step 2: Verify**

```bash
cd frontend && npm ls @fal-ai/client ai @ai-sdk/google zod
```
Expected: all listed.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(deps): add fal client, vercel ai sdk, zod"
```

---

## Task 2: `.env.example` and `.gitignore`

**Files:** `frontend/.env.example`, `frontend/.gitignore`

- [ ] **Step 1: Create env example**

Create `frontend/.env.example`:
```
# Server-side (Vercel env). Never prefixed with VITE_ — stays off the client.
FAL_API_KEY=
GOOGLE_API_KEY=
CEREBRAS_API_KEY=

# Optional: Upstash Redis for rate limiting. If unset, falls back to in-memory.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Client feature flag. Set to "true" to use the new fal.ai backend.
VITE_USE_FAL_API=true
```

- [ ] **Step 2: Ensure .gitignore covers local env + vercel**

Append to `frontend/.gitignore` (if not already present):
```
.env.local
.env.*.local
.vercel
```

- [ ] **Step 3: Commit**

```bash
git add frontend/.env.example frontend/.gitignore
git commit -m "chore(env): document API env vars and ignore vercel dir"
```

---

## Task 3: Server env validator

**Files:** `frontend/api/_lib/env.ts`

- [ ] **Step 1: Implement**

Create `frontend/api/_lib/env.ts`:
```ts
export interface ServerEnv {
  FAL_API_KEY: string;
  GOOGLE_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export const getEnv = (): ServerEnv => {
  const FAL_API_KEY = process.env.FAL_API_KEY;
  if (!FAL_API_KEY) {
    throw new Error('FAL_API_KEY missing in environment');
  }
  return {
    FAL_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/api/_lib/env.ts
git commit -m "feat(api): add server env validator"
```

---

## Task 4: Zod schemas with tests

**Files:** `frontend/api/_lib/zod-schemas.ts`, `frontend/api/_lib/zod-schemas.test.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/api/_lib/zod-schemas.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { EnhancePromptSchema, GenerateImageSchema, Generate3DSchema } from './zod-schemas';

describe('zod schemas', () => {
  it('EnhancePromptSchema accepts valid input', () => {
    const r = EnhancePromptSchema.safeParse({ prompt: 'a cat', style: 'photoreal' });
    expect(r.success).toBe(true);
  });
  it('EnhancePromptSchema rejects empty prompt', () => {
    expect(EnhancePromptSchema.safeParse({ prompt: '' }).success).toBe(false);
  });
  it('EnhancePromptSchema rejects prompt > 500 chars', () => {
    expect(EnhancePromptSchema.safeParse({ prompt: 'a'.repeat(501) }).success).toBe(false);
  });
  it('GenerateImageSchema defaults batch to 4', () => {
    const r = GenerateImageSchema.safeParse({ prompt: 'x', model: 'flux-2-turbo' });
    if (!r.success) throw new Error('expected success');
    expect(r.data.batch).toBe(4);
  });
  it('GenerateImageSchema rejects batch > 4', () => {
    const r = GenerateImageSchema.safeParse({ prompt: 'x', model: 'flux-2-turbo', batch: 8 });
    expect(r.success).toBe(false);
  });
  it('Generate3DSchema requires imageUrl OR prompt', () => {
    expect(Generate3DSchema.safeParse({ tier: 'fast' }).success).toBe(false);
    expect(Generate3DSchema.safeParse({ tier: 'fast', imageUrl: 'https://x.com/a.png' }).success).toBe(true);
    expect(Generate3DSchema.safeParse({ tier: 'pro', prompt: 'a cat' }).success).toBe(true);
  });
  it('Generate3DSchema rejects text-to-3D for non-pro tiers', () => {
    const r = Generate3DSchema.safeParse({ tier: 'fast', prompt: 'a cat' });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
cd frontend && npx vitest run api/_lib/zod-schemas.test.ts
```

- [ ] **Step 3: Implement**

Create `frontend/api/_lib/zod-schemas.ts`:
```ts
import { z } from 'zod';

export const EnhancePromptSchema = z.object({
  prompt: z.string().min(1).max(500),
  style: z.enum(['photoreal', 'illustration', 'minimal', 'cinematic']).optional(),
});
export type EnhancePromptRequest = z.infer<typeof EnhancePromptSchema>;

export const GenerateImageSchema = z.object({
  prompt: z.string().min(1).max(500),
  model: z.enum(['flux-2-turbo', 'flux-2-pro', 'flux-2-dev']),
  batch: z.union([z.literal(1), z.literal(4)]).optional().default(4),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional().default('1:1'),
  seed: z.number().int().optional(),
  loraStyle: z
    .enum(['none', 'cyberpunk', 'claymation', 'ink-wash', 'vaporwave', 'studio-photo'])
    .optional()
    .default('none'),
});
export type GenerateImageRequest = z.infer<typeof GenerateImageSchema>;

export const Generate3DSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    prompt: z.string().min(1).max(500).optional(),
    tier: z.enum(['fast', 'balanced', 'pro']),
    outputs: z.array(z.enum(['glb', 'splat'])).optional().default(['glb', 'splat']),
  })
  .refine((v) => Boolean(v.imageUrl || v.prompt), {
    message: 'Either imageUrl or prompt is required',
  })
  .refine((v) => !(v.prompt && !v.imageUrl && v.tier !== 'pro'), {
    message: 'Text-to-3D is only available in the pro tier (Rodin Gen-2)',
  });
export type Generate3DRequest = z.infer<typeof Generate3DSchema>;
```

- [ ] **Step 4: Run, expect pass**

```bash
cd frontend && npx vitest run api/_lib/zod-schemas.test.ts
```
Expected: 7 tests pass.

- [ ] **Step 5: Include api/ in vitest config**

Check `frontend/vitest.config.ts`. If `include` is missing, ensure it matches `['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts']` so api tests run.

- [ ] **Step 6: Commit**

```bash
git add frontend/api/_lib/zod-schemas.ts frontend/api/_lib/zod-schemas.test.ts frontend/vitest.config.ts
git commit -m "feat(api): add zod request schemas with validation"
```

---

## Task 5: Pricing helper with tests

**Files:** `frontend/api/_lib/pricing.ts`, `frontend/api/_lib/pricing.test.ts`

- [ ] **Step 1: Write tests**

Create `frontend/api/_lib/pricing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { imageModelCost, threeDTierCost, totalPipelineCost } from './pricing';

describe('pricing', () => {
  it('flux-2-turbo is $0.008 per image', () => {
    expect(imageModelCost('flux-2-turbo', 1)).toBeCloseTo(0.008);
    expect(imageModelCost('flux-2-turbo', 4)).toBeCloseTo(0.032);
  });
  it('flux-2-pro is $0.03 per image', () => {
    expect(imageModelCost('flux-2-pro', 1)).toBeCloseTo(0.03);
  });
  it('fast 3D tier is Trellis at $0.02', () => {
    expect(threeDTierCost('fast')).toBeCloseTo(0.02);
  });
  it('pro 3D tier is Rodin at $0.40', () => {
    expect(threeDTierCost('pro')).toBeCloseTo(0.4);
  });
  it('totalPipelineCost sums image + 3D', () => {
    expect(totalPipelineCost('flux-2-turbo', 4, 'fast')).toBeCloseTo(0.032 + 0.02);
  });
});
```

- [ ] **Step 2: Implement**

Create `frontend/api/_lib/pricing.ts`:
```ts
import type { GenerateImageRequest, Generate3DRequest } from './zod-schemas';

type ImageModel = GenerateImageRequest['model'];
type Tier = Generate3DRequest['tier'];

const IMAGE_COST_PER_CALL: Record<ImageModel, number> = {
  'flux-2-turbo': 0.008,
  'flux-2-pro': 0.03,
  'flux-2-dev': 0.012,
};

const TIER_COST: Record<Tier, number> = {
  fast: 0.02,
  balanced: 0.16,
  pro: 0.4,
};

export const imageModelCost = (model: ImageModel, batch: number): number =>
  IMAGE_COST_PER_CALL[model] * batch;

export const threeDTierCost = (tier: Tier): number => TIER_COST[tier];

export const totalPipelineCost = (model: ImageModel, batch: number, tier: Tier): number =>
  imageModelCost(model, batch) + threeDTierCost(tier);
```

- [ ] **Step 3: Run tests**

```bash
cd frontend && npx vitest run api/_lib/pricing.test.ts
```
Expected: 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/api/_lib/pricing.ts frontend/api/_lib/pricing.test.ts
git commit -m "feat(api): add pricing helpers for image + 3D models"
```

---

## Task 6: Rate limiter

**Files:** `frontend/api/_lib/rate-limit.ts`

- [ ] **Step 1: Implement**

Create `frontend/api/_lib/rate-limit.ts`:
```ts
// In-memory rate limiter with optional Upstash fallback.
// Per-IP sliding window: max N requests per M milliseconds.

interface Bucket { timestamps: number[]; }
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult => {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, resetMs: oldest + windowMs - now };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length, resetMs: windowMs };
};

export const getClientIp = (req: Request): string => {
  const headers = req.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/api/_lib/rate-limit.ts
git commit -m "feat(api): add per-IP rate limiter"
```

---

## Task 7: SSE helper

**Files:** `frontend/api/_lib/sse.ts`

- [ ] **Step 1: Implement**

Create `frontend/api/_lib/sse.ts`:
```ts
export interface SSEEvent {
  event?: string;
  data: unknown;
  id?: string;
}

export const sseHeaders = (): Record<string, string> => ({
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
});

export const formatSSE = (evt: SSEEvent): string => {
  const lines: string[] = [];
  if (evt.event) lines.push(`event: ${evt.event}`);
  if (evt.id) lines.push(`id: ${evt.id}`);
  lines.push(`data: ${JSON.stringify(evt.data)}`);
  return lines.join('\n') + '\n\n';
};

export const createSSEStream = (
  producer: (emit: (evt: SSEEvent) => void) => Promise<void>
): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (evt: SSEEvent) => controller.enqueue(encoder.encode(formatSSE(evt)));
      try {
        await producer(emit);
      } catch (err) {
        emit({ event: 'error', data: { message: (err as Error).message } });
      } finally {
        controller.close();
      }
    },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/api/_lib/sse.ts
git commit -m "feat(api): add SSE helper for streaming responses"
```

---

## Task 8: fal.ai client wrapper

**Files:** `frontend/api/_lib/fal.ts`

- [ ] **Step 1: Implement**

Create `frontend/api/_lib/fal.ts`:
```ts
import { fal } from '@fal-ai/client';
import type { GenerateImageRequest, Generate3DRequest } from './zod-schemas';

let configured = false;
export const configureFal = (apiKey: string) => {
  if (configured) return;
  fal.config({ credentials: apiKey });
  configured = true;
};

const FLUX_MODEL_MAP: Record<GenerateImageRequest['model'], string> = {
  'flux-2-turbo': 'fal-ai/flux-2/turbo',
  'flux-2-pro': 'fal-ai/flux-2-pro',
  'flux-2-dev': 'fal-ai/flux-2',
};

const TIER_MODEL_MAP: Record<Generate3DRequest['tier'], string> = {
  fast: 'fal-ai/trellis',
  balanced: 'fal-ai/hunyuan3d/v2',
  pro: 'fal-ai/hyper3d/rodin/v2',
};

export interface GeneratedImage { url: string; seed: number; }

export const generateImages = async (
  apiKey: string,
  req: GenerateImageRequest
): Promise<GeneratedImage[]> => {
  configureFal(apiKey);
  const model = FLUX_MODEL_MAP[req.model];
  const aspectMap = { '1:1': '1024x1024', '16:9': '1280x720', '9:16': '720x1280' } as const;
  const imageSize = aspectMap[req.aspectRatio];

  const result = await fal.subscribe(model, {
    input: {
      prompt: req.prompt,
      image_size: imageSize,
      num_images: req.batch,
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
    },
    logs: false,
  });
  const data = (result as { data?: { images?: Array<{ url: string }>; seed?: number } }).data ?? {};
  const images = data.images ?? [];
  const seed = data.seed ?? 0;
  return images.map((img, idx) => ({ url: img.url, seed: seed + idx }));
};

export interface Generated3D { glbUrl?: string; splatUrl?: string; }

export const generate3D = async (
  apiKey: string,
  req: Generate3DRequest
): Promise<Generated3D> => {
  configureFal(apiKey);
  const model = TIER_MODEL_MAP[req.tier];
  const input: Record<string, unknown> = {};
  if (req.imageUrl) input.image_url = req.imageUrl;
  if (req.prompt) input.prompt = req.prompt;
  const result = await fal.subscribe(model, { input, logs: false });
  const data = (result as {
    data?: {
      model_mesh?: { url: string };
      mesh?: { url: string };
      model_file?: { url: string };
      splat?: { url: string };
    };
  }).data ?? {};
  return {
    glbUrl: data.model_mesh?.url ?? data.mesh?.url ?? data.model_file?.url,
    splatUrl: data.splat?.url,
  };
};
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add frontend/api/_lib/fal.ts
git commit -m "feat(api): add fal.ai client wrapper for image + 3D generation"
```

---

## Task 9: `vercel.json` config

**Files:** `frontend/vercel.json`

- [ ] **Step 1: Create config**

Create `frontend/vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "api/**/*.ts": {
      "runtime": "edge"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/vercel.json
git commit -m "chore(vercel): add edge runtime config for api functions"
```

---

## Task 10: `/api/enhance-prompt` edge function

**Files:** `frontend/api/enhance-prompt.ts`

- [ ] **Step 1: Implement**

Create `frontend/api/enhance-prompt.ts`:
```ts
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { EnhancePromptSchema } from './_lib/zod-schemas';
import { getEnv } from './_lib/env';
import { rateLimit, getClientIp } from './_lib/rate-limit';

export const config = { runtime: 'edge' };

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
  try { body = await req.json(); } catch { return Response.json({ error: 'bad_json' }, { status: 400 }); }
  const parsed = EnhancePromptSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });

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
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add frontend/api/enhance-prompt.ts
git commit -m "feat(api): add /api/enhance-prompt edge function using Gemini"
```

---

## Task 11: `/api/generate-image` edge function

**Files:** `frontend/api/generate-image.ts`

- [ ] **Step 1: Implement**

Create `frontend/api/generate-image.ts`:
```ts
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
  try { body = await req.json(); } catch { return Response.json({ error: 'bad_json' }, { status: 400 }); }
  const parsed = GenerateImageSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });

  const env = getEnv();
  const started = Date.now();
  const stream = createSSEStream(async (emit) => {
    emit({ event: 'status', data: { status: 'generating-image' } });
    const images = await generateImages(env.FAL_API_KEY, parsed.data);
    emit({ event: 'images', data: { images } });
    const costUsd = imageModelCost(parsed.data.model, parsed.data.batch);
    emit({
      event: 'done',
      data: { images, elapsedMs: Date.now() - started, costUsd },
    });
  });

  return new Response(stream, { headers: sseHeaders() });
}
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add frontend/api/generate-image.ts
git commit -m "feat(api): add /api/generate-image edge function with SSE streaming"
```

---

## Task 12: `/api/generate-3d` edge function

**Files:** `frontend/api/generate-3d.ts`

- [ ] **Step 1: Implement**

Create `frontend/api/generate-3d.ts`:
```ts
import { Generate3DSchema } from './_lib/zod-schemas';
import { getEnv } from './_lib/env';
import { rateLimit, getClientIp } from './_lib/rate-limit';
import { createSSEStream, sseHeaders } from './_lib/sse';
import { generate3D } from './_lib/fal';
import { threeDTierCost } from './_lib/pricing';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const ip = getClientIp(req);
  const rl = rateLimit(`three:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return Response.json({ error: 'rate_limited', resetMs: rl.resetMs }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: 'bad_json' }, { status: 400 }); }
  const parsed = Generate3DSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });

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
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add frontend/api/generate-3d.ts
git commit -m "feat(api): add /api/generate-3d edge function with SSE streaming"
```

---

## Task 13: Browser SSE client

**Files:** `frontend/src/lib/sse-client.ts`, `frontend/src/lib/sse-client.test.ts`

- [ ] **Step 1: Write failing test**

Create `frontend/src/lib/sse-client.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseSSE } from './sse-client';

const enc = (s: string) => new TextEncoder().encode(s);

const mockStream = (chunks: string[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(enc(c)));
      controller.close();
    },
  });

describe('parseSSE', () => {
  it('yields single event', async () => {
    const stream = mockStream(['event: status\ndata: {"phase":"start"}\n\n']);
    const events: unknown[] = [];
    for await (const evt of parseSSE(stream)) events.push(evt);
    expect(events).toEqual([{ event: 'status', data: { phase: 'start' } }]);
  });
  it('yields multiple events across chunks', async () => {
    const stream = mockStream([
      'event: a\ndata: 1\n',
      '\nevent: b\ndata: 2\n\n',
    ]);
    const events: unknown[] = [];
    for await (const evt of parseSSE(stream)) events.push(evt);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: 'a', data: 1 });
    expect(events[1]).toEqual({ event: 'b', data: 2 });
  });
  it('defaults event to "message"', async () => {
    const stream = mockStream(['data: "hello"\n\n']);
    const events: Array<{ event?: string }> = [];
    for await (const evt of parseSSE(stream)) events.push(evt);
    expect(events[0].event).toBe('message');
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
cd frontend && npx vitest run src/lib/sse-client.test.ts
```

- [ ] **Step 3: Implement**

Create `frontend/src/lib/sse-client.ts`:
```ts
export interface ParsedSSEEvent {
  event: string;
  data: unknown;
  id?: string;
}

export async function* parseSSE(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<ParsedSSEEvent, void, unknown> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const evt = parseEvent(rawEvent);
        if (evt) yield evt;
      }
    }
    if (buffer.trim()) {
      const evt = parseEvent(buffer);
      if (evt) yield evt;
    }
  } finally {
    reader.releaseLock();
  }
}

const parseEvent = (block: string): ParsedSSEEvent | null => {
  const lines = block.split('\n');
  let event = 'message';
  let dataRaw = '';
  let id: string | undefined;
  for (const line of lines) {
    if (line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trimStart();
    if (field === 'event') event = value;
    else if (field === 'data') dataRaw += (dataRaw ? '\n' : '') + value;
    else if (field === 'id') id = value;
  }
  if (!dataRaw) return null;
  let data: unknown;
  try { data = JSON.parse(dataRaw); } catch { data = dataRaw; }
  return { event, data, id };
};
```

- [ ] **Step 4: Run, expect pass**

```bash
cd frontend && npx vitest run src/lib/sse-client.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/sse-client.ts frontend/src/lib/sse-client.test.ts
git commit -m "feat(lib): add browser SSE parser as async generator"
```

---

## Task 14: `aiService` client

**Files:** `frontend/src/services/aiService.ts`, `frontend/src/services/aiService.types.ts`, `frontend/src/services/aiService.test.ts`

- [ ] **Step 1: Types**

Create `frontend/src/services/aiService.types.ts`:
```ts
export interface EnhancePromptArgs {
  prompt: string;
  style?: 'photoreal' | 'illustration' | 'minimal' | 'cinematic';
}
export interface EnhancePromptResult {
  enhanced: string;
  tokens: number;
}

export type ImageModel = 'flux-2-turbo' | 'flux-2-pro' | 'flux-2-dev';
export type LoraStyle = 'none' | 'cyberpunk' | 'claymation' | 'ink-wash' | 'vaporwave' | 'studio-photo';

export interface GenerateImageArgs {
  prompt: string;
  model: ImageModel;
  batch?: 1 | 4;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  seed?: number;
  loraStyle?: LoraStyle;
}
export interface GenerateImageEvent {
  type: 'status' | 'images' | 'done' | 'error';
  images?: Array<{ url: string; seed: number }>;
  elapsedMs?: number;
  costUsd?: number;
  error?: string;
}

export type Tier = 'fast' | 'balanced' | 'pro';
export interface Generate3DArgs {
  imageUrl?: string;
  prompt?: string;
  tier: Tier;
  outputs?: Array<'glb' | 'splat'>;
}
export interface Generate3DEvent {
  type: 'status' | 'done' | 'error';
  glbUrl?: string;
  splatUrl?: string;
  elapsedMs?: number;
  costUsd?: number;
  error?: string;
}
```

- [ ] **Step 2: Write failing test**

Create `frontend/src/services/aiService.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enhancePrompt, generateImage, generate3D } from './aiService';

const mockFetch = (response: { ok?: boolean; status?: number; json?: unknown; sse?: string[] }) => {
  const enc = new TextEncoder();
  const stream = response.sse
    ? new ReadableStream<Uint8Array>({
        start(ctrl) {
          response.sse!.forEach((c) => ctrl.enqueue(enc.encode(c)));
          ctrl.close();
        },
      })
    : undefined;
  return vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.json,
    body: stream,
  });
};

describe('aiService', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('enhancePrompt returns enhanced text', async () => {
    globalThis.fetch = mockFetch({ json: { enhanced: 'vivid', tokens: 12 } });
    const r = await enhancePrompt({ prompt: 'cat' });
    expect(r).toEqual({ enhanced: 'vivid', tokens: 12 });
  });

  it('enhancePrompt throws on non-ok', async () => {
    globalThis.fetch = mockFetch({ ok: false, status: 500, json: { error: 'x' } });
    await expect(enhancePrompt({ prompt: 'cat' })).rejects.toThrow();
  });

  it('generateImage yields parsed SSE events', async () => {
    globalThis.fetch = mockFetch({
      sse: [
        'event: status\ndata: {"status":"generating-image"}\n\n',
        'event: done\ndata: {"images":[{"url":"u","seed":1}],"elapsedMs":1000,"costUsd":0.008}\n\n',
      ],
    });
    const events: unknown[] = [];
    for await (const e of generateImage({ prompt: 'x', model: 'flux-2-turbo', batch: 1 })) events.push(e);
    expect(events).toHaveLength(2);
    expect((events[1] as { type: string }).type).toBe('done');
  });

  it('generate3D yields events', async () => {
    globalThis.fetch = mockFetch({
      sse: [
        'event: status\ndata: {"status":"generating-3d"}\n\n',
        'event: done\ndata: {"glbUrl":"g","splatUrl":"s","elapsedMs":5000,"costUsd":0.02}\n\n',
      ],
    });
    const events: unknown[] = [];
    for await (const e of generate3D({ tier: 'fast', imageUrl: 'https://x.com/a.png' })) events.push(e);
    expect(events).toHaveLength(2);
    const done = events[1] as { type: string; glbUrl?: string };
    expect(done.type).toBe('done');
    expect(done.glbUrl).toBe('g');
  });
});
```

- [ ] **Step 3: Run, expect failure**

```bash
cd frontend && npx vitest run src/services/aiService.test.ts
```

- [ ] **Step 4: Implement**

Create `frontend/src/services/aiService.ts`:
```ts
import { parseSSE, type ParsedSSEEvent } from '@/lib/sse-client';
import type {
  EnhancePromptArgs,
  EnhancePromptResult,
  GenerateImageArgs,
  GenerateImageEvent,
  Generate3DArgs,
  Generate3DEvent,
} from './aiService.types';

const jsonPost = async <T>(url: string, body: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail: unknown = null;
    try { detail = await res.json(); } catch { /* ignore */ }
    throw new Error(`Request failed ${res.status}: ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as T;
};

const ssePost = async function* <TEvent>(
  url: string,
  body: unknown,
  map: (evt: ParsedSSEEvent) => TEvent
): AsyncGenerator<TEvent, void, unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    let detail: unknown = null;
    try { detail = await res.json(); } catch { /* ignore */ }
    throw new Error(`Stream failed ${res.status}: ${JSON.stringify(detail)}`);
  }
  for await (const evt of parseSSE(res.body)) {
    yield map(evt);
  }
};

export const enhancePrompt = (args: EnhancePromptArgs): Promise<EnhancePromptResult> =>
  jsonPost<EnhancePromptResult>('/api/enhance-prompt', args);

export const generateImage = (args: GenerateImageArgs): AsyncGenerator<GenerateImageEvent, void, unknown> =>
  ssePost<GenerateImageEvent>('/api/generate-image', args, (evt) => {
    const data = evt.data as Record<string, unknown>;
    return {
      type: (evt.event as GenerateImageEvent['type']) ?? 'status',
      images: data.images as GenerateImageEvent['images'],
      elapsedMs: data.elapsedMs as number | undefined,
      costUsd: data.costUsd as number | undefined,
      error: data.message as string | undefined,
    };
  });

export const generate3D = (args: Generate3DArgs): AsyncGenerator<Generate3DEvent, void, unknown> =>
  ssePost<Generate3DEvent>('/api/generate-3d', args, (evt) => {
    const data = evt.data as Record<string, unknown>;
    return {
      type: (evt.event as Generate3DEvent['type']) ?? 'status',
      glbUrl: data.glbUrl as string | undefined,
      splatUrl: data.splatUrl as string | undefined,
      elapsedMs: data.elapsedMs as number | undefined,
      costUsd: data.costUsd as number | undefined,
      error: data.message as string | undefined,
    };
  });
```

- [ ] **Step 5: Run tests, expect pass**

```bash
cd frontend && npx vitest run src/services/aiService.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/aiService.ts frontend/src/services/aiService.types.ts frontend/src/services/aiService.test.ts
git commit -m "feat(service): add aiService browser client with SSE streaming"
```

---

## Task 15: Wire to `/dev/ui` for manual smoke

**Files:** `frontend/src/pages/DevUIPage.tsx`

- [ ] **Step 1: Add a "Test API" panel**

In `frontend/src/pages/DevUIPage.tsx`, add:
```tsx
import { enhancePrompt } from '@/services/aiService';
// ...inside component, add state:
const [apiResult, setApiResult] = useState<string>('');
const [apiLoading, setApiLoading] = useState(false);
const testEnhance = async () => {
  setApiLoading(true);
  setApiResult('');
  try {
    const r = await enhancePrompt({ prompt: prompt || 'a cat', style: 'photoreal' });
    setApiResult(r.enhanced);
  } catch (e) {
    setApiResult(`error: ${(e as Error).message}`);
  } finally { setApiLoading(false); }
};
```

Add a new `<Panel title="API test">` block before the closing div:
```tsx
<Panel title="API test (requires vercel dev or deployed)">
  <div className="space-y-3 max-w-md">
    <Button onClick={testEnhance} disabled={apiLoading}>
      {apiLoading ? 'Enhancing…' : 'Enhance prompt'}
    </Button>
    {apiResult && (
      <div className="text-sm text-white/80 p-3 bg-surface-2 rounded-sm">{apiResult}</div>
    )}
  </div>
</Panel>
```

- [ ] **Step 2: Typecheck + build**

```bash
cd frontend && npm run typecheck && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DevUIPage.tsx
git commit -m "feat(dev): add API smoke test panel to /dev/ui"
```

---

## Task 16: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && npx vitest run
```
Expected: all new tests pass plus previous 22.

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Build**

```bash
cd frontend && npm run build
```
Expected: build succeeds. Edge functions are not bundled into client (they live under `api/`).

- [ ] **Step 4: Verify no secrets in bundle**

```bash
cd frontend && grep -R "FAL_API_KEY\|GOOGLE_API_KEY" dist/ 2>/dev/null || echo "clean"
```
Expected: `clean`.

- [ ] **Step 5: No commit — verification only**

---

## Self-Review

- ✅ Spec coverage: fal proxy (§API layer), AI SDK v6 streaming (§API layer), rate limits (§Security & cost), pricing preview (§Data flow), zod validation (§Security).
- ✅ No placeholders.
- ✅ Type consistency — `ImageModel`, `Tier`, `LoraStyle` used consistently across client/server.
- ✅ No client-side secrets.
- ✅ Each commit leaves app in working state.

## Deferred to later plans

- Upstash KV adapter for rate limiting (behind flag, in-memory works for single region)
- Turnstile challenge integration (Plan 4 polish)
- Scene store `useFalApi` flag usage — only wired in Plan 3 when the generation flow lands
