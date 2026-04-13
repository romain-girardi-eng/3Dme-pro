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
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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
