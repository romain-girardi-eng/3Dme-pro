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
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    throw new Error(`Request failed ${res.status}: ${JSON.stringify(detail)}`);
  }
  return (await res.json()) as T;
};

const ssePost = async function* <TEvent>(
  url: string,
  body: unknown,
  map: (evt: ParsedSSEEvent) => TEvent,
): AsyncGenerator<TEvent, void, unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    throw new Error(`Stream failed ${res.status}: ${JSON.stringify(detail)}`);
  }
  for await (const evt of parseSSE(res.body)) {
    yield map(evt);
  }
};

export const enhancePrompt = (args: EnhancePromptArgs): Promise<EnhancePromptResult> =>
  jsonPost<EnhancePromptResult>('/api/enhance-prompt', args);

export const generateImage = (
  args: GenerateImageArgs,
): AsyncGenerator<GenerateImageEvent, void, unknown> =>
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

export const generate3D = (
  args: Generate3DArgs,
): AsyncGenerator<Generate3DEvent, void, unknown> =>
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
