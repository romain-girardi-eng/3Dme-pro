export interface ParsedSSEEvent {
  event: string;
  data: unknown;
  id?: string;
}

export async function* parseSSE(
  stream: ReadableStream<Uint8Array>,
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
  try {
    data = JSON.parse(dataRaw);
  } catch {
    data = dataRaw;
  }
  return { event, data, id };
};
