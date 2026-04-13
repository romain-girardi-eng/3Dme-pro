/**
 * image3DGenerator.ts
 *
 * Converts images to 3D models using free AI services on Hugging Face.
 * Uses async iterators for proper queue handling on busy spaces.
 *
 * IMPORTANT: Requires a free HuggingFace token for ZeroGPU quota.
 * Get one at: https://huggingface.co/settings/tokens
 *
 * Services (in order of preference):
 * - microsoft/TRELLIS.2 - NEW! 4B params, fastest (3-17s), full PBR materials
 * - tencent/Hunyuan3D-2 (Tencent) - High quality fallback
 * - JeffreyXiang/TRELLIS (Microsoft v1) - Legacy fallback
 */

import { Client, handle_file } from '@gradio/client';

// Timeout for 3D generation (5 minutes max per service - spaces can be slow when busy)
const GENERATION_TIMEOUT_MS = 300000;

// HuggingFace token storage key
const HF_TOKEN_KEY = '3dme_hf_token';

/**
 * Get stored HuggingFace token
 */
export function getHFToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(HF_TOKEN_KEY);
}

/**
 * Store HuggingFace token
 */
export function setHFToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HF_TOKEN_KEY, token);
}

/**
 * Clear HuggingFace token
 */
export function clearHFToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HF_TOKEN_KEY);
}

/**
 * Check if HuggingFace token is set
 */
export function hasHFToken(): boolean {
  return !!getHFToken();
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

export interface Generation3DResult {
  glbUrl: string;
}

/**
 * Convert image to 3D using TripoSR (StabilityAI)
 * This is typically faster and more reliable than other options.
 *
 * Based on: https://huggingface.co/spaces/stabilityai/TripoSR
 */
export async function generateTripoSR(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  return withTimeout(
    generateTripoSRInternal(imageBlob, onProgress),
    GENERATION_TIMEOUT_MS,
    'TripoSR timed out after 5 minutes - space may be overloaded'
  );
}

async function generateTripoSRInternal(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  onProgress?.('Connecting to TripoSR...');
  console.log('TripoSR: Starting connection...');

  const hfToken = getHFToken();
  const client = await Client.connect('stabilityai/TripoSR', {
    events: ['data', 'status'],
    hf_token: hfToken as `hf_${string}` | undefined,
  });
  console.log('TripoSR: Connected successfully');

  onProgress?.('Generating 3D model (~15-30 seconds)...');
  console.log('TripoSR: Calling /run with submit()...');

  // TripoSR has a simpler API - just image input
  const submission = client.submit('/run', {
    image: handle_file(imageBlob),
    foreground_ratio: 0.85,
    mc_resolution: 256,
  });

  let result: any = null;

  for await (const msg of submission) {
    console.log('TripoSR msg:', msg);

    if (msg.type === 'status') {
      const status = msg as any;
      if (status.stage === 'error') {
        throw new Error(status.message || 'TripoSR generation failed');
      }
      if (status.queue_position !== undefined && status.queue_position > 0) {
        onProgress?.(`Queue position ${status.queue_position}...`);
      } else if (status.original_msg === 'process_starts') {
        onProgress?.('Processing (~15-30 seconds)...');
      } else if (status.stage === 'pending') {
        onProgress?.('Waiting...');
      }
    }

    if (msg.type === 'data') {
      result = msg;
      break;
    }
  }

  console.log('TripoSR result:', result);

  const data = result?.data;
  if (!data) {
    throw new Error('TripoSR: No data returned');
  }

  // TripoSR returns: [rendered_images, mesh_file]
  // mesh_file is the GLB/OBJ file
  const meshData = data[1] || data[0];
  let glbUrl: string | undefined;

  if (meshData?.url) {
    glbUrl = meshData.url;
  } else if (meshData?.value?.url) {
    glbUrl = meshData.value.url;
  } else if (typeof meshData === 'string') {
    glbUrl = meshData;
  }

  if (!glbUrl) {
    console.error('TripoSR: Unexpected response format:', data);
    throw new Error('TripoSR: No mesh URL returned');
  }

  console.log('TripoSR: Success! URL:', glbUrl);
  onProgress?.('TripoSR complete!');
  return { glbUrl };
}

/**
 * Convert image to 3D using TRELLIS (Microsoft)
 *
 * Based on: https://huggingface.co/spaces/JeffreyXiang/TRELLIS
 *
 * Two-step process:
 * 1. /image_to_3d - generates 3D state + preview video
 * 2. /extract_glb - extracts GLB mesh from state
 */
export async function generateTRELLIS(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  return withTimeout(
    generateTRELLISInternal(imageBlob, onProgress),
    GENERATION_TIMEOUT_MS,
    'TRELLIS timed out after 5 minutes - space may be overloaded'
  );
}

async function generateTRELLISInternal(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  onProgress?.('Connecting to TRELLIS...');
  console.log('TRELLIS: Starting connection...');

  // Connect with status events enabled and HF token for ZeroGPU quota
  const hfToken = getHFToken();
  const client = await Client.connect('JeffreyXiang/TRELLIS', {
    events: ['data', 'status'],
    hf_token: hfToken as `hf_${string}` | undefined,
  });
  console.log('TRELLIS: Connected successfully');

  onProgress?.('Generating 3D (step 1/2)...');
  console.log('TRELLIS: Calling /image_to_3d...');

  // Convert Blob to File with proper filename for Gradio
  const imageFile = new File([imageBlob], 'input.jpg', { type: imageBlob.type || 'image/jpeg' });

  // Step 1: Generate 3D from image using submit() with async iterator
  const genSubmission = client.submit('/image_to_3d', {
    image: handle_file(imageFile),
    multiimages: [],
    seed: 0,
    ss_guidance_strength: 7.5,
    ss_sampling_steps: 12,
    slat_guidance_strength: 3,
    slat_sampling_steps: 12,
    multiimage_algo: 'stochastic',
  });

  let genResult: any = null;

  for await (const msg of genSubmission) {
    console.log('TRELLIS step 1 msg:', msg);

    if (msg.type === 'status') {
      const status = msg as any;
      if (status.stage === 'error') {
        throw new Error(status.message || 'TRELLIS generation failed');
      }
      // Show progress based on various status indicators
      if (status.queue_position !== undefined && status.queue_position > 0) {
        onProgress?.(`Step 1/2: Queue position ${status.queue_position}...`);
      } else if (status.original_msg === 'process_starts') {
        onProgress?.('Step 1/2: Processing started...');
      } else if (status.stage === 'pending') {
        onProgress?.('Step 1/2: Waiting...');
      } else if (status.stage === 'generating' || status.stage === 'processing') {
        onProgress?.('Step 1/2: Generating...');
      }
    }

    if (msg.type === 'data') {
      genResult = msg;
      break;
    }
  }

  console.log('TRELLIS image_to_3d result:', genResult);

  if (!genResult?.data) {
    throw new Error('TRELLIS: No data returned from image_to_3d');
  }

  console.log('TRELLIS: Got result, extracting GLB...');
  onProgress?.('Extracting mesh (step 2/2)...');

  // Step 2: Extract GLB
  const glbSubmission = client.submit('/extract_glb', {
    mesh_simplify: 0.95,
    texture_size: 1024,
  });

  let glbResult: any = null;

  for await (const msg of glbSubmission) {
    console.log('TRELLIS step 2 msg:', msg);

    if (msg.type === 'status') {
      const status = msg as any;
      if (status.stage === 'error') {
        throw new Error(status.message || 'TRELLIS extraction failed');
      }
      if (status.stage === 'generating') {
        onProgress?.('Step 2/2: Extracting mesh...');
      }
    }

    if (msg.type === 'data') {
      glbResult = msg;
      break;
    }
  }

  console.log('TRELLIS extract_glb result:', glbResult);

  const glbData = glbResult?.data;
  if (!glbData) {
    throw new Error('TRELLIS: No GLB data returned');
  }

  const glbFile = glbData[0];
  const glbUrl = typeof glbFile === 'string' ? glbFile : glbFile?.url;

  if (!glbUrl) {
    throw new Error('TRELLIS: No GLB URL returned');
  }

  console.log('TRELLIS: Success! GLB URL:', glbUrl);
  onProgress?.('TRELLIS complete!');
  return { glbUrl };
}

/**
 * Convert image to 3D using TRELLIS.2 (Microsoft) - NEW!
 * 4B parameter model with full PBR materials support.
 * Much faster than v1: 3s (512³) to 17s (1024³)
 *
 * Based on: https://huggingface.co/spaces/microsoft/TRELLIS.2
 */
export async function generateTRELLIS2(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  return withTimeout(
    generateTRELLIS2Internal(imageBlob, onProgress),
    GENERATION_TIMEOUT_MS,
    'TRELLIS.2 timed out after 5 minutes - space may be overloaded'
  );
}

async function generateTRELLIS2Internal(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  onProgress?.('Connecting to TRELLIS.2...');
  console.log('TRELLIS.2: Starting connection...');

  const hfToken = getHFToken();
  const client = await Client.connect('microsoft/TRELLIS.2', {
    events: ['data', 'status'],
    hf_token: hfToken as `hf_${string}` | undefined,
  });
  console.log('TRELLIS.2: Connected successfully');

  // Convert Blob to File with proper filename for Gradio
  const imageFile = new File([imageBlob], 'input.png', { type: 'image/png' });

  // Step 0: Preprocess image (required for TRELLIS.2)
  onProgress?.('Preprocessing image...');
  console.log('TRELLIS.2: Calling /preprocess_image...');

  const preprocessSubmission = client.submit('/preprocess_image', {
    input: handle_file(imageFile),
  });

  let preprocessedImage: any = null;

  for await (const msg of preprocessSubmission) {
    console.log('TRELLIS.2 preprocess msg:', msg);

    if (msg.type === 'status') {
      const status = msg as any;
      if (status.stage === 'error') {
        throw new Error(status.message || 'TRELLIS.2 preprocessing failed');
      }
    }

    if (msg.type === 'data') {
      preprocessedImage = msg.data?.[0];
      break;
    }
  }

  if (!preprocessedImage) {
    throw new Error('TRELLIS.2: Preprocessing returned no image');
  }
  console.log('TRELLIS.2: Image preprocessed:', preprocessedImage);

  // Step 1: Generate 3D from preprocessed image
  onProgress?.('Generating 3D model...');
  console.log('TRELLIS.2: Calling /image_to_3d...');

  // Using 512 resolution for faster generation (3s vs 17s for 1024)
  const genSubmission = client.submit('/image_to_3d', {
    image: preprocessedImage,
    seed: 0,
    resolution: '512',  // Options: "512", "1024", "1536" - using 512 for speed
    // Stage 1 (Sparse Structure)
    ss_guidance_strength: 7.5,
    ss_guidance_rescale: 0.5,
    ss_sampling_steps: 20,
    ss_rescale_t: 200,
    // Stage 2 (Shape Latent)
    shape_slat_guidance_strength: 3.0,
    shape_slat_guidance_rescale: 0.5,
    shape_slat_sampling_steps: 20,
    shape_slat_rescale_t: 300,
    // Stage 3 (Texture Latent)
    tex_slat_guidance_strength: 3.0,
    tex_slat_guidance_rescale: 0.5,
    tex_slat_sampling_steps: 20,
    tex_slat_rescale_t: 300,
  });

  let genResult: any = null;

  for await (const msg of genSubmission) {
    console.log('TRELLIS.2 step 1 msg:', msg);

    if (msg.type === 'status') {
      const status = msg as any;
      if (status.stage === 'error') {
        throw new Error(status.message || 'TRELLIS.2 generation failed');
      }
      if (status.queue_position !== undefined && status.queue_position > 0) {
        onProgress?.(`Queue position ${status.queue_position}...`);
      } else if (status.original_msg === 'process_starts') {
        onProgress?.('Processing started... (this takes ~15-30 seconds)');
      } else if (status.stage === 'pending') {
        onProgress?.('Waiting in queue...');
      } else if (status.stage === 'generating' || status.stage === 'processing') {
        onProgress?.('Generating 3D...');
      }
    }

    if (msg.type === 'data') {
      genResult = msg;
      break;
    }
  }

  console.log('TRELLIS.2 image_to_3d result:', genResult);

  if (!genResult?.data) {
    throw new Error('TRELLIS.2: No data returned from image_to_3d');
  }

  // image_to_3d returns [state, preview_html]
  const modelState = genResult.data[0];
  console.log('TRELLIS.2: Got model state:', modelState);

  if (!modelState) {
    throw new Error('TRELLIS.2: No model state returned from image_to_3d');
  }

  console.log('TRELLIS.2: Got result, extracting GLB...');
  onProgress?.('Extracting mesh...');

  // Step 2: Extract GLB - pass state from image_to_3d
  const glbSubmission = client.submit('/extract_glb', {
    state: modelState,
    decimation_target: 100000,  // High poly count for detail
    texture_size: 1024,
  });

  let glbResult: any = null;

  for await (const msg of glbSubmission) {
    console.log('TRELLIS.2 step 2 msg:', msg);

    if (msg.type === 'status') {
      const status = msg as any;
      if (status.stage === 'error') {
        throw new Error(status.message || 'TRELLIS.2 extraction failed');
      }
      if (status.stage === 'generating' || status.stage === 'processing') {
        onProgress?.('Extracting mesh...');
      }
    }

    if (msg.type === 'data') {
      glbResult = msg;
      break;
    }
  }

  console.log('TRELLIS.2 extract_glb result:', glbResult);

  const glbData = glbResult?.data;
  if (!glbData) {
    throw new Error('TRELLIS.2: No GLB data returned');
  }

  // GLB URL is typically in the first element
  const glbFile = glbData[0];
  const glbUrl = typeof glbFile === 'string' ? glbFile : glbFile?.url;

  if (!glbUrl) {
    console.error('TRELLIS.2: Unexpected GLB format:', glbData);
    throw new Error('TRELLIS.2: No GLB URL returned');
  }

  console.log('TRELLIS.2: Success! GLB URL:', glbUrl);
  onProgress?.('TRELLIS.2 complete!');
  return { glbUrl };
}

/**
 * Convert image to 3D using Hunyuan3D-2 (Tencent)
 *
 * Based on: https://huggingface.co/spaces/tencent/Hunyuan3D-2
 *
 * Single endpoint: /shape_generation
 * Returns: [{value: {url, path, ...}}, html_viewer, stats_json, seed]
 */
export async function generateHunyuan3D(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  return withTimeout(
    generateHunyuan3DInternal(imageBlob, onProgress),
    GENERATION_TIMEOUT_MS,
    'Hunyuan3D timed out after 5 minutes - space may be overloaded'
  );
}

async function generateHunyuan3DInternal(
  imageBlob: Blob,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  onProgress?.('Connecting to Hunyuan3D-2...');
  console.log('Hunyuan3D: Starting connection...');

  // Connect with status events enabled and HF token for ZeroGPU quota
  const hfToken = getHFToken();
  if (!hfToken) {
    throw new Error('HuggingFace token required. Please add your token in Settings.');
  }

  const client = await Client.connect('tencent/Hunyuan3D-2', {
    events: ['data', 'status'],
    hf_token: hfToken as `hf_${string}`,
  });
  console.log('Hunyuan3D: Connected successfully');

  onProgress?.('Generating 3D model...');
  console.log('Hunyuan3D: Calling /shape_generation with submit()...');

  // Convert Blob to File with proper filename for Gradio
  const imageFile = new File([imageBlob], 'input.jpg', { type: imageBlob.type || 'image/jpeg' });

  // Use submit() with async iterator for queue handling
  const submission = client.submit('/shape_generation', {
    caption: '',
    image: handle_file(imageFile),
    mv_image_front: null,
    mv_image_back: null,
    mv_image_left: null,
    mv_image_right: null,
    steps: 30,
    guidance_scale: 5,
    seed: 1234,
    octree_resolution: 256,
    check_box_rembg: true,
    num_chunks: 8000,
    randomize_seed: true,
  });

  let result: any = null;

  for await (const msg of submission) {
    console.log('Hunyuan3D msg:', msg);

    if (msg.type === 'status') {
      const status = msg as any;

      // Check for errors
      if (status.stage === 'error') {
        throw new Error(status.message || 'Hunyuan3D generation failed');
      }

      // Show progress based on various status indicators
      if (status.queue_position !== undefined && status.queue_position > 0) {
        onProgress?.(`Queue position ${status.queue_position}...`);
      } else if (status.original_msg === 'process_starts') {
        onProgress?.('Processing started... (this takes ~30-60 seconds)');
      } else if (status.stage === 'pending') {
        onProgress?.('Waiting in queue...');
      } else if (status.stage === 'generating' || status.stage === 'processing') {
        onProgress?.('Generating 3D model...');
      } else if (status.progress_data) {
        // Some spaces send progress percentage
        const progress = status.progress_data;
        if (Array.isArray(progress) && progress[0]?.progress !== undefined) {
          const pct = Math.round(progress[0].progress * 100);
          onProgress?.(`Generating: ${pct}%`);
        }
      }
    }

    if (msg.type === 'data') {
      result = msg;
      break;
    }
  }

  console.log('Hunyuan3D result:', result);

  const data = result?.data;
  if (!data) {
    throw new Error('Hunyuan3D: No data returned');
  }

  const meshData = data[0];

  // Extract URL - can be in meshData.value.url or meshData.url depending on response format
  let glbUrl: string | undefined;
  if (meshData?.value?.url) {
    glbUrl = meshData.value.url;
  } else if (meshData?.url) {
    glbUrl = meshData.url;
  } else if (typeof meshData === 'string') {
    glbUrl = meshData;
  }

  if (!glbUrl) {
    console.error('Hunyuan3D: Unexpected response format:', meshData);
    throw new Error('Hunyuan3D: No GLB URL returned');
  }

  console.log('Hunyuan3D: Success! GLB URL:', glbUrl);
  onProgress?.('Hunyuan3D complete!');
  return { glbUrl };
}

/**
 * Main function: Try services with automatic fallback
 * Order: Hunyuan3D (more stable) -> TRELLIS (fast but sometimes unavailable)
 */
export async function imageToModel3D(
  imageSource: File | Blob | string,
  onProgress?: (step: string) => void
): Promise<Generation3DResult> {
  // Convert to Blob if needed
  let imageBlob: Blob;

  if (typeof imageSource === 'string') {
    onProgress?.('Fetching image...');
    console.log('Fetching image from URL:', imageSource);
    const response = await fetch(imageSource);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    imageBlob = await response.blob();
    console.log('Image fetched, size:', imageBlob.size, 'type:', imageBlob.type);
  } else {
    imageBlob = imageSource;
    console.log('Using provided blob, size:', imageBlob.size, 'type:', imageBlob.type);
  }

  // Ensure we have a valid image blob
  if (imageBlob.size === 0) {
    throw new Error('Image blob is empty');
  }

  // Check for HF token first
  const hfToken = getHFToken();
  if (!hfToken) {
    throw new Error(
      'HuggingFace token required for 3D generation.\n\n' +
      '1. Get a free token at: https://huggingface.co/settings/tokens\n' +
      '2. Click the ⚙️ Settings icon and add your token'
    );
  }

  // Service definitions - Try multiple services with fallbacks
  // NOTE: TripoSR (503) and TRELLIS v1 (404) are currently down as of Dec 2024
  // Order: TRELLIS.2 (best quality) -> Hunyuan3D (reliable backup)
  const services = [
    { name: 'TRELLIS.2', fn: generateTRELLIS2 },
    { name: 'Hunyuan3D', fn: generateHunyuan3D },
    // { name: 'TripoSR', fn: generateTripoSR },  // Currently 503
    // { name: 'TRELLIS', fn: generateTRELLIS },  // Currently 404
  ];

  let lastError: Error | null = null;

  for (const service of services) {
    try {
      onProgress?.(`Trying ${service.name}...`);
      console.log(`\n========== Attempting ${service.name} ==========`);

      const result = await service.fn(imageBlob, onProgress);

      console.log(`${service.name} succeeded!`);
      console.log('GLB URL:', result.glbUrl);

      return result;

    } catch (error) {
      console.error(`${service.name} failed:`, error);

      // Better error message extraction
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Gradio status objects
        const statusObj = error as any;
        if (statusObj.type === 'status') {
          errorMessage = statusObj.message || `Space unavailable (status: ${statusObj.stage || 'unknown'})`;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else {
        errorMessage = String(error);
      }

      lastError = new Error(errorMessage);
      onProgress?.(`${service.name} failed: ${errorMessage}`);

      // Small delay before trying next service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw lastError || new Error('All 3D generation services failed');
}
