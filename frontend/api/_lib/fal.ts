import type { GenerateImageRequest, Generate3DRequest } from './zod-schemas';

const FAL_BASE = 'https://fal.run';
const FAL_QUEUE = 'https://queue.fal.run';

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

interface FalImageResult {
  images?: Array<{ url: string }>;
  seed?: number;
}

const callFal = async <T>(modelId: string, input: Record<string, unknown>, apiKey: string): Promise<T> => {
  const res = await fetch(`${FAL_BASE}/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`fal.ai ${modelId} ${res.status}: ${errText.slice(0, 400)}`);
  }
  return (await res.json()) as T;
};

export const generateImages = async (
  apiKey: string,
  req: GenerateImageRequest,
): Promise<GeneratedImage[]> => {
  const model = FLUX_MODEL_MAP[req.model];
  const aspectMap = { '1:1': 'square_hd', '16:9': 'landscape_16_9', '9:16': 'portrait_9_16' } as const;
  const data = await callFal<FalImageResult>(
    model,
    {
      prompt: req.prompt,
      image_size: aspectMap[req.aspectRatio],
      num_images: req.batch,
      enable_safety_checker: false,
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
    },
    apiKey,
  );
  const images = data.images ?? [];
  const seed = data.seed ?? 0;
  return images.map((img, idx) => ({ url: img.url, seed: seed + idx }));
};

export interface Generated3D {
  glbUrl?: string;
  splatUrl?: string;
}

interface Fal3DResult {
  model_mesh?: { url: string };
  mesh?: { url: string };
  model_file?: { url: string };
  splat?: { url: string };
  gaussian_splat?: { url: string };
  output?: { url: string };
}

export const generate3D = async (
  apiKey: string,
  req: Generate3DRequest,
): Promise<Generated3D> => {
  const model = TIER_MODEL_MAP[req.tier];
  const input: Record<string, unknown> = {};
  if (req.imageUrl) input.image_url = req.imageUrl;
  if (req.prompt) input.prompt = req.prompt;
  const data = await callFal<Fal3DResult>(model, input, apiKey);
  return {
    glbUrl: data.model_mesh?.url ?? data.mesh?.url ?? data.model_file?.url ?? data.output?.url,
    splatUrl: data.splat?.url ?? data.gaussian_splat?.url,
  };
};

// kept for backward compat with existing imports
export const configureFal = (_apiKey: string): void => {
  void _apiKey;
};

void FAL_QUEUE;
