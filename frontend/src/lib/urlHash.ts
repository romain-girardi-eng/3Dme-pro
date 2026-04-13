import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export const encodeState = <T>(state: T): string =>
  compressToEncodedURIComponent(JSON.stringify(state));

export const decodeState = <T>(hash: string): T | null => {
  if (!hash) return null;
  try {
    const json = decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};
