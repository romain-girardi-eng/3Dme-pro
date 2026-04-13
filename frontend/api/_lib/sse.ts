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
  producer: (emit: (evt: SSEEvent) => void) => Promise<void>,
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
