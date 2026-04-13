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
