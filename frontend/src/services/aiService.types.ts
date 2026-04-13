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
