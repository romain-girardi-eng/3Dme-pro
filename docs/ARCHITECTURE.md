# 3Dme Architecture

This document describes the technical architecture of 3Dme, a free AI-powered 3D particle visualization application.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              3Dme APPLICATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         FRONTEND (React + Three.js)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │ │
│  │  │   Studio     │  │   Particle   │  │   Controls   │  │   Export   │  │ │
│  │  │   Page       │  │   Canvas     │  │   Panel      │  │   Module   │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         SERVICES LAYER                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │ │
│  │  │ NanoBanana   │  │  ImageTo3D   │  │  Particle    │  │   Export   │  │ │
│  │  │ Service      │  │  Service     │  │  Engine      │  │   Service  │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      EXTERNAL AI SERVICES (FREE)                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │ │
│  │  │  Puter.js    │  │   SPAR3D     │  │  TRELLIS.2   │  │ Hunyuan3D  │  │ │
│  │  │  (Images)    │  │   (HF)       │  │   (HF)       │  │   (HF)     │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Application

The frontend is a React 19 + TypeScript application built with Vite.

#### Component Hierarchy

```
App
├── StudioPage
│   ├── ImageGeneratorPanel
│   │   ├── PromptInput
│   │   ├── ImagePreview
│   │   └── GenerateButton
│   ├── Model3DPanel
│   │   ├── BackendSelector
│   │   ├── ConversionProgress
│   │   └── ModelPreview
│   ├── ParticleCanvas (THREE.js)
│   │   ├── WebGPURenderer
│   │   ├── ParticleSystem
│   │   │   ├── PositionBuffer (GPU)
│   │   │   ├── VelocityBuffer (GPU)
│   │   │   ├── ColorBuffer (GPU)
│   │   │   └── ComputeShader
│   │   └── PostProcessing
│   │       ├── BloomPass
│   │       └── MotionBlurPass
│   └── ControlsPanel
│       ├── ParticleControls
│       ├── PhysicsControls
│       ├── ColorControls
│       └── EffectsControls
├── HomePage
│   ├── HeroSection
│   ├── FeaturesSection
│   └── DemoSection
└── GalleryPage
    ├── GalleryGrid
    └── CreationCard
```

### 2. Services Layer

#### NanoBanana Service
Handles AI image generation using Puter.js (Nano Banana Pro / Gemini 3 Pro Image).

```typescript
interface NanoBananaService {
  generate(prompt: string): Promise<ImageBlob>;
  transform(image: Blob, prompt: string): Promise<ImageBlob>;
  getModels(): Model[];
}
```

**Features:**
- Text-to-image generation
- Image-to-image transformation
- No API key required
- Unlimited free usage

#### ImageTo3D Service
Manages 3D model generation via Hugging Face Spaces.

```typescript
interface ImageTo3DService {
  convert(image: Blob, backend: Backend): Promise<GLBBlob>;
  getBackends(): Backend[];
  getProgress(taskId: string): Progress;
  cancel(taskId: string): void;
}

type Backend = 'spar3d' | 'trellis' | 'hunyuan3d' | 'instantmesh';
```

**Backends:**
- **SPAR3D:** 0.7s, Stability AI, best for speed
- **TRELLIS.2:** 5-10s, Microsoft, best for quality
- **Hunyuan3D-2.1:** 10-30s, Tencent, best for PBR
- **InstantMesh:** 10s, TencentARC, balanced

#### Particle Engine
Core WebGPU/TSL particle system.

```typescript
interface ParticleEngine {
  loadMesh(glb: Blob): Promise<void>;
  sampleSurface(count: number): void;
  setPhysics(config: PhysicsConfig): void;
  setColors(config: ColorConfig): void;
  setEffects(config: EffectsConfig): void;
  render(): void;
  dispose(): void;
}
```

### 3. Particle System Architecture

#### Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GLB File  │ →  │  Parse Mesh │ →  │  Surface    │ →  │   GPU       │
│   (Input)   │    │  Geometry   │    │  Sampling   │    │  Buffers    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Screen    │ ←  │   Render    │ ←  │   Compute   │ ←  │   Physics   │
│   Output    │    │   Pass      │    │   Dispatch  │    │   Update    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

#### GPU Buffer Structure

```typescript
// Storage buffers for 500k particles
const positionBuffer = instancedArray(500000, 'vec3');   // Current position
const targetBuffer = instancedArray(500000, 'vec3');    // Target position
const velocityBuffer = instancedArray(500000, 'vec3');  // Velocity
const colorBuffer = instancedArray(500000, 'vec3');     // RGB color
const sizeBuffer = instancedArray(500000, 'float');     // Particle size
const ageBuffer = instancedArray(500000, 'float');      // Particle age
```

#### Compute Shader (TSL)

```typescript
const computeUpdate = Fn(() => {
  const idx = instanceIndex;
  const pos = positionBuffer.element(idx);
  const target = targetBuffer.element(idx);
  const vel = velocityBuffer.element(idx);

  // Attraction to target
  const toTarget = target.sub(pos);
  const attraction = toTarget.mul(0.02);

  // Mouse repulsion
  const toMouse = pos.sub(mousePos);
  const dist = toMouse.length();
  const repulsion = toMouse.normalize().mul(50.0).div(dist.mul(dist).add(1));

  // Update velocity
  vel.addAssign(attraction);
  vel.addAssign(repulsion);
  vel.mulAssign(0.98); // Damping

  // Update position
  pos.addAssign(vel);
})().compute(500000);
```

#### Render Pipeline

```typescript
// Sprite-based rendering (optimal for particles)
<sprite count={500000}>
  <spriteNodeMaterial
    transparent
    depthWrite={false}
    blending={THREE.AdditiveBlending}
    positionNode={positionBuffer.element(instanceIndex)}
    colorNode={colorBuffer.element(instanceIndex)}
    sizeNode={sizeBuffer.element(instanceIndex)}
  />
</sprite>
```

### 4. WebGPU Fallback Strategy

```typescript
// WebGPU availability check
const isWebGPUSupported = 'gpu' in navigator;

// Renderer selection
const createRenderer = async (canvas: HTMLCanvasElement) => {
  if (isWebGPUSupported) {
    const renderer = new THREE.WebGPURenderer({ canvas });
    await renderer.init();
    return { renderer, type: 'webgpu' };
  }

  // Fallback to WebGL
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  return { renderer, type: 'webgl' };
};
```

**Capability Matrix:**

| Feature | WebGPU | WebGL |
|---------|--------|-------|
| Max Particles | 1M+ | 100k |
| Compute Shaders | ✅ | ❌ (sim on CPU) |
| Storage Buffers | ✅ | ❌ (textures) |
| Frame Rate | 60fps @ 1M | 60fps @ 100k |

### 5. State Management

#### React Context Structure

```typescript
// ParticleContext - Global particle state
interface ParticleState {
  mesh: THREE.Mesh | null;
  particleCount: number;
  isLoading: boolean;
  error: string | null;

  // Physics
  physics: PhysicsConfig;

  // Visuals
  colors: ColorConfig;
  effects: EffectsConfig;
}

// GenerationContext - AI generation state
interface GenerationState {
  image: Blob | null;
  model: Blob | null;
  backend: Backend;
  progress: number;
  status: 'idle' | 'generating' | 'converting' | 'ready' | 'error';
}
```

### 6. External API Integration

#### Puter.js Integration

```typescript
// Load Puter.js SDK
const loadPuter = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

// Generate image
const generateImage = async (prompt: string) => {
  await loadPuter();
  const image = await puter.ai.txt2img(prompt, {
    model: 'gemini-3-pro-image-preview'
  });
  return image;
};
```

#### Hugging Face Gradio Client

```typescript
import { Client } from '@gradio/client';

// Connect to Space
const connectBackend = async (backend: Backend) => {
  const spaces = {
    spar3d: 'stabilityai/stable-point-aware-3d',
    trellis: 'trellis-community/TRELLIS',
    hunyuan3d: 'tencent/Hunyuan3D-2',
    instantmesh: 'TencentARC/InstantMesh'
  };

  return await Client.connect(spaces[backend]);
};

// Convert image to 3D
const convertTo3D = async (client: Client, image: Blob) => {
  const result = await client.predict('/process', { image });
  return result.data[0]; // GLB file
};
```

### 7. Performance Optimizations

#### GPU Memory Management

```typescript
// Dispose resources on unmount
const dispose = () => {
  positionBuffer.dispose();
  velocityBuffer.dispose();
  colorBuffer.dispose();
  geometry.dispose();
  material.dispose();
  renderer.dispose();
};
```

#### Frame Budget Allocation

```
Total: 16.67ms (60fps)
├── Compute Dispatch: 2ms
├── Render Pass: 8ms
├── Post-Processing: 4ms
└── React/UI: 2ms
```

#### Particle Count Scaling

```typescript
const getOptimalParticleCount = (gpuTier: number) => {
  switch (gpuTier) {
    case 3: return 1000000;  // High-end
    case 2: return 500000;   // Mid-range
    case 1: return 200000;   // Low-end
    default: return 100000;  // Fallback
  }
};
```

### 8. Error Handling

#### Service Error Boundaries

```typescript
// Graceful degradation
const handleImageTo3DError = (error: Error, backend: Backend) => {
  console.error(`${backend} failed:`, error);

  // Try next backend in fallback order
  const fallbackOrder = ['spar3d', 'instantmesh', 'trellis', 'hunyuan3d'];
  const currentIndex = fallbackOrder.indexOf(backend);
  const nextBackend = fallbackOrder[currentIndex + 1];

  if (nextBackend) {
    return convertTo3D(image, nextBackend);
  }

  throw new Error('All backends failed');
};
```

### 9. Security Considerations

#### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://js.puter.com;
  connect-src 'self' https://*.huggingface.co;
  img-src 'self' blob: data:;
  style-src 'self' 'unsafe-inline';
">
```

#### Input Validation

```typescript
// Sanitize prompts
const sanitizePrompt = (prompt: string): string => {
  return prompt
    .slice(0, 500)  // Max length
    .replace(/[<>]/g, '')  // Remove HTML
    .trim();
};

// Validate file types
const validateImage = (file: File): boolean => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
};
```

### 10. Testing Strategy

#### Unit Tests

```typescript
// Particle math functions
describe('ShapeGenerators', () => {
  it('should generate valid positions', () => {
    const { pos, normal } = generateSphere(0, 1000);
    expect(pos.length()).toBeCloseTo(50, 1);
    expect(normal.length()).toBeCloseTo(1, 5);
  });
});
```

#### Integration Tests

```typescript
// Full pipeline
describe('Pipeline', () => {
  it('should convert image to particles', async () => {
    const image = await loadTestImage();
    const glb = await convertTo3D(image, 'spar3d');
    const particles = await sampleSurface(glb, 10000);

    expect(particles.length).toBe(10000);
  });
});
```

#### E2E Tests

```typescript
// User flow
test('complete generation flow', async ({ page }) => {
  await page.goto('/studio');
  await page.fill('[data-testid="prompt-input"]', 'test prompt');
  await page.click('[data-testid="generate-button"]');

  await expect(page.locator('[data-testid="particle-canvas"]'))
    .toBeVisible({ timeout: 60000 });
});
```

## Deployment Architecture

### Static Deployment (Cloudflare Pages)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE EDGE NETWORK                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    CDN      │    │   Pages     │    │   Cache     │         │
│  │   (Global)  │    │   (Static)  │    │   (KV)      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    User's       │
                    │    Browser      │
                    │    (All Logic)  │
                    └─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │  Puter.js   │ │  HF Spaces  │ │  HF Spaces  │
      │  (Images)   │ │  (SPAR3D)   │ │  (TRELLIS)  │
      └─────────────┘ └─────────────┘ └─────────────┘
```

All processing happens client-side or via free external APIs. No backend server required.

## Future Architecture Considerations

### Local AI Processing (Optional)

For users who want offline processing:

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOCAL PROCESSING MODE                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Ollama    │    │   TripoSR   │    │   Local     │         │
│  │   (Images)  │    │   (3D)      │    │   SPAR3D    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Real-time Collaboration (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                     COLLABORATIVE MODE                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   WebRTC    │ ←→ │   Shared    │ ←→ │   Other     │         │
│  │   (P2P)     │    │   State     │    │   Users     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```
