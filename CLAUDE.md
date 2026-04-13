# CLAUDE.md - 3Dme Project Guidelines

This file provides guidance to Claude Code when working with the 3Dme codebase.

## Project Overview

**3Dme** is a free, open-source application that transforms any image or text prompt into stunning 3D particle visualizations. It combines cutting-edge AI for image generation and 3D reconstruction with WebGPU-powered particle rendering.

### The Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. GENERATE    │ →  │  2. IMAGE → 3D  │ →  │  3. GLB → PTS   │ →  │  4. RENDER      │
│  Puter.js       │    │  SPAR3D/TRELLIS │    │  MeshSampler    │    │  WebGPU+TSL     │
│  Nano Banana    │    │  Hugging Face   │    │  Three.js       │    │  1M particles   │
│  (FREE)         │    │  (FREE)         │    │  (FREE)         │    │  (FREE)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Three.js
- **3D Rendering:** Three.js WebGPU + TSL (Three Shading Language)
- **Image Generation:** Puter.js (Nano Banana Pro / Gemini 3 Pro Image)
- **Image to 3D:** SPAR3D, TRELLIS.2, Hunyuan3D-2, InstantMesh (via Hugging Face)
- **Particle System:** MeshSurfaceSampler + GPGPU Compute Shaders
- **Deployment:** Cloudflare Pages (static hosting, FREE)

## Development Commands

### Frontend

```bash
cd frontend

# Setup
npm install

# Development
npm run dev       # Start Vite dev server on :5173
npm run build     # Build for production
npm run preview   # Preview production build

# Testing
npm test                 # Run Vitest tests
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint issues
npm run typecheck        # TypeScript check
```

### Backend (Optional - for local AI processing)

```bash
cd backend

# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Development
uvicorn api.main:app --reload  # Start dev server on :8000

# Code Quality
ruff check .
ruff format .
```

## Architecture

### Frontend Structure

```
frontend/src/
├── components/
│   ├── particles/
│   │   ├── ParticleCanvas.tsx      # WebGPU Canvas wrapper
│   │   ├── ParticleRenderer.tsx    # TSL compute particles
│   │   ├── MeshToParticles.tsx     # MeshSurfaceSampler logic
│   │   ├── ParticleControls.tsx    # UI controls for customization
│   │   └── ShapeGenerators.ts      # Procedural shape algorithms
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Slider.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   └── controls/
│       ├── ImageGenerator.tsx      # Nano Banana Pro UI
│       ├── ModelConverter.tsx      # Tripo/SPAR3D progress UI
│       └── ExportControls.tsx      # Download/share options
├── hooks/
│   ├── useNanoBanana.ts           # Puter.js wrapper
│   ├── useImageTo3D.ts            # Hugging Face Gradio client
│   ├── useGPGPUParticles.ts       # Compute shader management
│   └── useWebGPU.ts               # WebGPU availability check
├── services/
│   ├── nanoBananaService.ts       # Image generation API
│   ├── imageTo3DService.ts        # 3D conversion API
│   └── exportService.ts           # GLB/Video export
├── pages/
│   ├── HomePage.tsx               # Landing page
│   ├── StudioPage.tsx             # Main particle studio
│   └── GalleryPage.tsx            # User creations showcase
├── types/
│   └── index.ts                   # TypeScript definitions
└── assets/
    └── presets/                   # Pre-made particle configs
```

### Key Components

#### 1. Image Generation (Puter.js - FREE)
```typescript
// No API key required - completely free
puter.ai.txt2img(prompt, { model: "gemini-3-pro-image-preview" })
```

#### 2. Image to 3D (Hugging Face Spaces - FREE)
```typescript
import { Client } from "@gradio/client";

// SPAR3D - 0.7s generation (fastest)
const spar3d = await Client.connect("stabilityai/stable-point-aware-3d");

// TRELLIS.2 - Best quality
const trellis = await Client.connect("trellis-community/TRELLIS");

// Hunyuan3D-2 - Full PBR materials
const hunyuan = await Client.connect("tencent/Hunyuan3D-2");
```

#### 3. GLB to Particles (MeshSurfaceSampler)
```typescript
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

const sampler = new MeshSurfaceSampler(mesh).build();
// Sample 500k particles from mesh surface
```

#### 4. WebGPU Particle Rendering (TSL)
```typescript
import * as THREE from 'three/webgpu';
import { instancedArray, Fn, instanceIndex } from 'three/tsl';

// GPU-side storage - 500k-1M particles
const positionBuffer = instancedArray(500000, 'vec3');
const velocityBuffer = instancedArray(500000, 'vec3');

// Compute shader for physics (runs on GPU)
const computeUpdate = Fn(() => {
  const pos = positionBuffer.element(instanceIndex);
  // Physics calculations...
})().compute(500000);
```

## AI Service Providers (All FREE)

### Image Generation

| Provider | Model | Cost | Notes |
|----------|-------|------|-------|
| **Puter.js** | Nano Banana Pro | FREE | No API key, unlimited |
| Puter.js | Gemini 2.5 Flash | FREE | Faster, lower quality |

### Image to 3D

| Provider | Speed | Quality | Cost |
|----------|-------|---------|------|
| **SPAR3D** | 0.7s | ⭐⭐⭐⭐⭐ | FREE |
| TRELLIS.2 | 5-10s | ⭐⭐⭐⭐⭐ | FREE |
| Hunyuan3D-2.1 | 10-30s | ⭐⭐⭐⭐⭐ | FREE |
| InstantMesh | 10s | ⭐⭐⭐⭐ | FREE |

## Coding Standards

### TypeScript
- Strict mode enabled
- No implicit any
- Use type inference where obvious
- Export types from `types/index.ts`

### React
- Functional components only
- Custom hooks for reusable logic
- Memoize expensive computations
- Use React 19 features (use hook, actions)

### Three.js / WebGPU
- Prefer WebGPU renderer when available
- Fallback to WebGL for unsupported browsers
- Use TSL (Three Shading Language) for shaders
- Clean up resources in useEffect cleanup

### Styling
- Tailwind CSS for all styling
- Dark theme by default
- Responsive design (mobile-first)
- Smooth animations with Framer Motion

## Performance Guidelines

### Particle System
- Target: 500k-1M particles at 60fps
- Use GPGPU compute shaders for physics
- Avoid CPU-side particle updates
- Use instancedArray for GPU storage

### WebGPU Optimization
- Storage buffers over textures
- Single compute dispatch per frame
- Minimize CPU-GPU data transfer
- Use sprite-based rendering over instanced meshes

### React Optimization
- Lazy load heavy components
- Memoize Three.js scene setup
- Debounce control inputs
- Virtual scrolling for galleries

## Testing Strategy

### Unit Tests
- Test hooks in isolation
- Mock AI service responses
- Test particle math functions

### Integration Tests
- Full pipeline tests (image → 3D → particles)
- WebGPU availability fallback
- Error handling for API failures

### E2E Tests
- Full user flow testing
- Cross-browser compatibility
- Mobile responsiveness

## Environment Variables

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:8000  # Optional backend URL

# No API keys needed - all services are free!
```

## Common Tasks

### Adding a New Particle Shape
1. Add generator function to `ShapeGenerators.ts`
2. Register in shape registry
3. Add UI option in `ParticleControls.tsx`
4. Test with different particle counts

### Adding a New Image-to-3D Provider
1. Create hook in `hooks/useImageTo3D.ts`
2. Add Gradio client connection
3. Handle loading/error states
4. Update `ModelConverter.tsx` UI

### Optimizing Particle Performance
1. Profile with Chrome DevTools
2. Check GPU utilization
3. Reduce particle count if needed
4. Simplify compute shader

## Deployment

### Cloudflare Pages (Recommended - FREE)
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=3dme
```

### Vercel (Alternative - FREE)
```bash
cd frontend
npm run build
npx vercel --prod
```

## Resources

### Documentation
- [Three.js WebGPU](https://threejs.org/docs/#manual/en/introduction/Installation)
- [TSL Guide (Maxime Heckel)](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [Wawa Sensei GPGPU Course](https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu)
- [Puter.js Docs](https://developer.puter.com/)
- [Gradio Client](https://www.gradio.app/guides/getting-started-with-the-js-client)

### AI Services
- [SPAR3D (Stability AI)](https://github.com/Stability-AI/stable-point-aware-3d)
- [TRELLIS.2 (Microsoft)](https://github.com/microsoft/TRELLIS.2)
- [Hunyuan3D-2.1 (Tencent)](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1)
- [InstantMesh (TencentARC)](https://github.com/TencentARC/InstantMesh)

### Hugging Face Spaces
- [SPAR3D Demo](https://huggingface.co/spaces/stabilityai/stable-point-aware-3d)
- [TRELLIS Demo](https://huggingface.co/spaces/trellis-community/TRELLIS)
- [Hunyuan3D-2 Demo](https://huggingface.co/spaces/tencent/Hunyuan3D-2)
- [InstantMesh Demo](https://huggingface.co/spaces/TencentARC/InstantMesh)

## Git Workflow

- Main branch: `main`
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

## License

MIT License - Free for personal and commercial use.
