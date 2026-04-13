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
