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
