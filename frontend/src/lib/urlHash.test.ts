import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from './urlHash';

describe('urlHash', () => {
  it('round-trips simple objects', () => {
    const state = { prompt: 'a cat', tier: 'fast', seed: 42 };
    const hash = encodeState(state);
    expect(decodeState(hash)).toEqual(state);
  });
  it('round-trips nested objects with arrays', () => {
    const state = {
      scene: { particles: { count: 500000, size: 2.5 } },
      variants: ['a', 'b', 'c'],
    };
    expect(decodeState(encodeState(state))).toEqual(state);
  });
  it('returns null for invalid hash', () => {
    expect(decodeState('not-a-valid-hash')).toBeNull();
  });
  it('returns null for empty string', () => {
    expect(decodeState('')).toBeNull();
  });
  it('produces URL-hash-safe output (lz-string 64-char alphabet)', () => {
    // lz-string's compressToEncodedURIComponent uses a 64-char alphabet of
    // A-Z a-z 0-9 + - $. These characters are all valid inside a URL fragment
    // (location.hash) even though + is not safe inside encodeURIComponent.
    const hash = encodeState({ a: 1 });
    expect(hash).toMatch(/^[A-Za-z0-9+\-$]+$/);
  });
});
