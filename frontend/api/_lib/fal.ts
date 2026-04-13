import { fal } from '@fal-ai/client';
import type { GenerateImageRequest, Generate3DRequest } from './zod-schemas';

let configured = false;
export const configureFal = (apiKey: string) => {
  if (configured) return;
  fal.config({ credentials: apiKey });
  configured = true;
};

const FLUX_MODEL_MAP: Record<GenerateImageRequest['model'], string> = {
  'flux-2-turbo': 'fal-ai/flux-2/turbo',
  'flux-2-pro': 'fal-ai/flux-2-pro',
  'flux-2-dev': 'fal-ai/flux-2',
};

const TIER_MODEL_MAP: Record<Generate3DRequest['tier'], string> = {
  fast: 'fal-ai/trellis',
  balanced: 'fal-ai/hunyuan3d/v2',
  pro: 'fal-ai/hyper3d/rodin/v2',
};

export interface GeneratedImage {
  url: string;
  seed: number;
}

export const generateImages = async (
  apiKey: string,
  req: GenerateImageRequest,
): Promise<GeneratedImage[]> => {
  configureFal(apiKey);
  const model = FLUX_MODEL_MAP[req.model];
  const aspectMap = { '1:1': '1024x1024', '16:9': '1280x720', '9:16': '720x1280' } as const;
  const imageSize = aspectMap[req.aspectRatio];

  const result = await fal.subscribe(model, {
    input: {
      prompt: req.prompt,
      image_size: imageSize,
      num_images: req.batch,
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
    },
    logs: false,
  });
  const data = (result as { data?: { images?: Array<{ url: string }>; seed?: number } }).data ?? {};
  const images = data.images ?? [];
  const seed = data.seed ?? 0;
  return images.map((img, idx) => ({ url: img.url, seed: seed + idx }));
};

export interface Generated3D {
  glbUrl?: string;
  splatUrl?: string;
}

export const generate3D = async (
  apiKey: string,
  req: Generate3DRequest,
): Promise<Generated3D> => {
  configureFal(apiKey);
  const model = TIER_MODEL_MAP[req.tier];
  const input: Record<string, unknown> = {};
  if (req.imageUrl) input.image_url = req.imageUrl;
  if (req.prompt) input.prompt = req.prompt;
  const result = await fal.subscribe(model, { input, logs: false });
  const data = (result as {
    data?: {
      model_mesh?: { url: string };
      mesh?: { url: string };
      model_file?: { url: string };
      splat?: { url: string };
    };
  }).data ?? {};
  return {
    glbUrl: data.model_mesh?.url ?? data.mesh?.url ?? data.model_file?.url,
    splatUrl: data.splat?.url,
  };
};
