# 3Dme Foundation — Plan 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the design system foundation — tokens, typography, core UI primitives, and the global scene store with URL-hash shareable state — without touching existing app code. Ships as a reviewable `/dev/ui` route.

**Architecture:** Tailwind-extended design tokens drive a small set of composable Radix-based primitives in `components/ui/*`. A Zustand store with `zundo` undo/redo middleware owns generation and scene state, and serializes to/from URL hash via `lz-string` for shareable scenes. All foundations land additive — no existing files modified beyond config.

**Tech Stack:** React 19, TypeScript strict, Vite, Tailwind CSS, Radix UI, Zustand + zundo, lz-string, @fontsource-variable, class-variance-authority, clsx, tailwind-merge, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-04-13-pro-uiux-redesign-design.md`

---

## File Structure

### Create
- `frontend/src/lib/cn.ts` — className merger utility (tailwind-merge + clsx)
- `frontend/src/lib/urlHash.ts` — scene state URL hash codec (lz-string)
- `frontend/src/stores/sceneStore.ts` — Zustand + zundo global store
- `frontend/src/stores/sceneStore.types.ts` — scene state types
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/IconButton.tsx`
- `frontend/src/components/ui/Panel.tsx`
- `frontend/src/components/ui/Tabs.tsx`
- `frontend/src/components/ui/Slider.tsx`
- `frontend/src/components/ui/NumberField.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Textarea.tsx`
- `frontend/src/components/ui/Tooltip.tsx`
- `frontend/src/components/ui/Kbd.tsx`
- `frontend/src/components/ui/index.ts` — barrel export
- `frontend/src/pages/DevUIPage.tsx` — preview route
- `frontend/src/lib/urlHash.test.ts`
- `frontend/src/stores/sceneStore.test.ts`
- `frontend/src/components/ui/Button.test.tsx`
- `frontend/src/components/ui/NumberField.test.tsx`

### Modify
- `frontend/package.json` — add deps
- `frontend/tailwind.config.js` — extend tokens
- `frontend/src/index.css` — font imports, CSS variables
- `frontend/src/App.tsx` — add `/dev/ui` route
- `frontend/tsconfig.json` — `paths` alias `@/*` → `src/*` (if not present)

---

## Task 1: Install dependencies

**Files:** `frontend/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd frontend && npm install zustand zundo lz-string cmdk sonner \
  @fontsource-variable/inter @fontsource-variable/geist-mono
```

- [ ] **Step 2: Verify install**

```bash
cd frontend && npm ls zustand zundo lz-string cmdk sonner
```
Expected: all packages listed, no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(deps): add zustand, zundo, lz-string, cmdk, sonner, fontsource"
```

---

## Task 2: Path alias

**Files:** `frontend/tsconfig.json`, `frontend/vite.config.ts`

- [ ] **Step 1: Check current tsconfig**

```bash
cd frontend && cat tsconfig.json
```

- [ ] **Step 2: Add `@/*` path alias if absent**

In `frontend/tsconfig.json`, add under `compilerOptions`:
```json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

- [ ] **Step 3: Mirror in Vite config**

In `frontend/vite.config.ts`, ensure:
```ts
import path from 'node:path';

export default defineConfig({
  // ...existing config
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 4: Verify typecheck still passes**

```bash
cd frontend && npm run typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/tsconfig.json frontend/vite.config.ts
git commit -m "chore(build): add @/* path alias"
```

---

## Task 3: Design tokens in Tailwind

**Files:** `frontend/tailwind.config.js`

- [ ] **Step 1: Read current config**

```bash
cd frontend && cat tailwind.config.js
```

- [ ] **Step 2: Extend theme with tokens**

Replace the `theme.extend` block in `frontend/tailwind.config.js` with:

```js
theme: {
  extend: {
    colors: {
      surface: {
        0: 'rgb(9 9 11)',
        1: 'rgb(24 24 27 / 0.8)',
        2: 'rgb(39 39 42 / 0.6)',
        3: 'rgb(63 63 70 / 0.5)',
      },
      border: {
        subtle: 'rgb(255 255 255 / 0.05)',
        DEFAULT: 'rgb(255 255 255 / 0.1)',
        strong: 'rgb(255 255 255 / 0.15)',
      },
      brand: {
        primary: 'rgb(139 92 246)',
        secondary: 'rgb(34 211 238)',
      },
      signal: {
        success: 'rgb(74 222 128)',
        warning: 'rgb(250 204 21)',
        danger: 'rgb(248 113 113)',
      },
    },
    fontFamily: {
      sans: ['Inter Variable', 'system-ui', 'sans-serif'],
      mono: ['Geist Mono Variable', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      '2xs': ['11px', { lineHeight: '14px' }],
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['13px', { lineHeight: '18px' }],
      base: ['14px', { lineHeight: '20px' }],
      lg: ['18px', { lineHeight: '26px' }],
      xl: ['24px', { lineHeight: '32px' }],
      '2xl': ['32px', { lineHeight: '40px' }],
      '3xl': ['48px', { lineHeight: '56px' }],
      '4xl': ['56px', { lineHeight: '64px' }],
      '5xl': ['72px', { lineHeight: '80px' }],
    },
    borderRadius: {
      sm: '6px',
      DEFAULT: '8px',
      md: '12px',
      lg: '16px',
    },
    transitionDuration: {
      fast: '150ms',
      panel: '250ms',
    },
    transitionTimingFunction: {
      out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
},
```

- [ ] **Step 3: Verify build still works**

```bash
cd frontend && npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/tailwind.config.js
git commit -m "feat(design): add 2026 design tokens to tailwind"
```

---

## Task 4: Font setup

**Files:** `frontend/src/index.css`

- [ ] **Step 1: Add font imports at top of index.css**

Prepend to `frontend/src/index.css`:
```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/geist-mono';
```

- [ ] **Step 2: Add CSS variables for tokens**

After the existing `@tailwind` directives in `frontend/src/index.css`, append:
```css
@layer base {
  :root {
    --brand-primary: 139 92 246;
    --brand-secondary: 34 211 238;
  }
  body {
    @apply bg-surface-0 text-white font-sans antialiased;
    font-feature-settings: 'cv11', 'ss01', 'ss03';
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 3: Dev server starts without errors**

```bash
cd frontend && timeout 8 npm run dev 2>&1 | tail -20 || true
```
Expected: Vite reports running on :5173 and no CSS errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(design): add inter + geist mono fonts and base CSS vars"
```

---

## Task 5: `cn` utility

**Files:** `frontend/src/lib/cn.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/cn.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('dedupes conflicting tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
cd frontend && npx vitest run src/lib/cn.test.ts
```
Expected: FAIL (`cn` not found).

- [ ] **Step 3: Implement `cn`**

Create `frontend/src/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
```

- [ ] **Step 4: Run test, expect pass**

```bash
cd frontend && npx vitest run src/lib/cn.test.ts
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/cn.ts frontend/src/lib/cn.test.ts
git commit -m "feat(lib): add cn() className merger utility"
```

---

## Task 6: URL-hash codec

**Files:** `frontend/src/lib/urlHash.ts`, `frontend/src/lib/urlHash.test.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/lib/urlHash.test.ts`:
```ts
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
  it('produces URL-safe hash', () => {
    const hash = encodeState({ a: 1 });
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
cd frontend && npx vitest run src/lib/urlHash.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `frontend/src/lib/urlHash.ts`:
```ts
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
```

- [ ] **Step 4: Run, expect pass**

```bash
cd frontend && npx vitest run src/lib/urlHash.test.ts
```
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/urlHash.ts frontend/src/lib/urlHash.test.ts
git commit -m "feat(lib): add URL hash codec for shareable scenes"
```

---

## Task 7: Scene store types

**Files:** `frontend/src/stores/sceneStore.types.ts`

- [ ] **Step 1: Create types file**

Create `frontend/src/stores/sceneStore.types.ts`:
```ts
export type RenderMode = 'splat' | 'particles';
export type QualityTier = 'fast' | 'balanced' | 'pro';
export type ImageModel = 'flux-2-turbo' | 'flux-2-pro' | 'flux-2-dev';
export type LoraStyle =
  | 'none'
  | 'cyberpunk'
  | 'claymation'
  | 'ink-wash'
  | 'vaporwave'
  | 'studio-photo';

export interface GenerationState {
  prompt: string;
  enhancedPrompt: string | null;
  enhancerEnabled: boolean;
  imageModel: ImageModel;
  tier: QualityTier;
  loraStyle: LoraStyle;
  variants: Array<{ url: string; seed: number }>;
  selectedVariantIdx: number | null;
  glbUrl: string | null;
  splatUrl: string | null;
  status: 'idle' | 'enhancing' | 'generating-image' | 'generating-3d' | 'ready' | 'error';
  error: string | null;
  costUsd: number;
}

export interface ParticleConfig {
  count: number;
  size: number;
  shape: 'sphere' | 'galaxy' | 'star' | 'mesh';
  colorMode: 'image' | 'gradient' | 'solid';
  solidColor: string;
}

export interface MaterialConfig {
  exposure: number;
  splatScale: number;
  opacityCutoff: number;
  emissive: number;
  fresnel: number;
}

export interface PhysicsConfig {
  mouseGravity: number;
  mouseRadius: number;
  turbulence: number;
  attractor: 'none' | 'lorenz' | 'aizawa' | 'chen';
}

export interface PostConfig {
  bloom: number;
  dof: boolean;
  chromaticAberration: number;
  vignette: number;
}

export interface AudioConfig {
  enabled: boolean;
  source: 'mic' | 'file' | 'demo';
  sensitivity: number;
  bassToColor: boolean;
  midToTurbulence: boolean;
  trebleToBurst: boolean;
}

export interface SceneConfig {
  mode: RenderMode;
  particles: ParticleConfig;
  material: MaterialConfig;
  physics: PhysicsConfig;
  post: PostConfig;
  audio: AudioConfig;
}

export interface SceneState {
  generation: GenerationState;
  scene: SceneConfig;
}

export interface SceneActions {
  setPrompt: (prompt: string) => void;
  setEnhancedPrompt: (prompt: string | null) => void;
  toggleEnhancer: () => void;
  setImageModel: (m: ImageModel) => void;
  setTier: (t: QualityTier) => void;
  setLoraStyle: (s: LoraStyle) => void;
  setVariants: (v: GenerationState['variants']) => void;
  selectVariant: (idx: number | null) => void;
  setAssets: (p: { glbUrl?: string | null; splatUrl?: string | null }) => void;
  setStatus: (s: GenerationState['status'], error?: string | null) => void;
  setCost: (usd: number) => void;
  setMode: (mode: RenderMode) => void;
  updateParticles: (patch: Partial<ParticleConfig>) => void;
  updateMaterial: (patch: Partial<MaterialConfig>) => void;
  updatePhysics: (patch: Partial<PhysicsConfig>) => void;
  updatePost: (patch: Partial<PostConfig>) => void;
  updateAudio: (patch: Partial<AudioConfig>) => void;
  resetScene: () => void;
  hydrateFromHash: (hash: string) => boolean;
  toHash: () => string;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/sceneStore.types.ts
git commit -m "feat(store): add scene store types"
```

---

## Task 8: Scene store implementation

**Files:** `frontend/src/stores/sceneStore.ts`, `frontend/src/stores/sceneStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/stores/sceneStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore, DEFAULT_SCENE_STATE } from './sceneStore';

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState(DEFAULT_SCENE_STATE, true);
  });

  it('initializes with defaults', () => {
    const s = useSceneStore.getState();
    expect(s.generation.prompt).toBe('');
    expect(s.scene.mode).toBe('particles');
    expect(s.scene.particles.count).toBeGreaterThan(0);
  });

  it('setPrompt updates prompt', () => {
    useSceneStore.getState().setPrompt('a cat');
    expect(useSceneStore.getState().generation.prompt).toBe('a cat');
  });

  it('updateParticles patches particle config', () => {
    useSceneStore.getState().updateParticles({ count: 100000, size: 3 });
    const p = useSceneStore.getState().scene.particles;
    expect(p.count).toBe(100000);
    expect(p.size).toBe(3);
  });

  it('setMode switches render mode', () => {
    useSceneStore.getState().setMode('splat');
    expect(useSceneStore.getState().scene.mode).toBe('splat');
  });

  it('toHash() and hydrateFromHash() round-trip scene state', () => {
    const s = useSceneStore.getState();
    s.setPrompt('roundtrip');
    s.updateParticles({ count: 42000 });
    s.setMode('splat');
    const hash = s.toHash();
    useSceneStore.setState(DEFAULT_SCENE_STATE, true);
    expect(useSceneStore.getState().generation.prompt).toBe('');
    const ok = useSceneStore.getState().hydrateFromHash(hash);
    expect(ok).toBe(true);
    const after = useSceneStore.getState();
    expect(after.generation.prompt).toBe('roundtrip');
    expect(after.scene.particles.count).toBe(42000);
    expect(after.scene.mode).toBe('splat');
  });

  it('hydrateFromHash returns false for invalid hash', () => {
    expect(useSceneStore.getState().hydrateFromHash('xxx')).toBe(false);
  });

  it('resetScene restores defaults', () => {
    useSceneStore.getState().setPrompt('x');
    useSceneStore.getState().resetScene();
    expect(useSceneStore.getState().generation.prompt).toBe('');
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
cd frontend && npx vitest run src/stores/sceneStore.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement store**

Create `frontend/src/stores/sceneStore.ts`:
```ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import type { SceneState, SceneActions } from './sceneStore.types';
import { encodeState, decodeState } from '@/lib/urlHash';

export const DEFAULT_SCENE_STATE: SceneState = {
  generation: {
    prompt: '',
    enhancedPrompt: null,
    enhancerEnabled: true,
    imageModel: 'flux-2-turbo',
    tier: 'fast',
    loraStyle: 'none',
    variants: [],
    selectedVariantIdx: null,
    glbUrl: null,
    splatUrl: null,
    status: 'idle',
    error: null,
    costUsd: 0,
  },
  scene: {
    mode: 'particles',
    particles: {
      count: 500000,
      size: 2,
      shape: 'mesh',
      colorMode: 'image',
      solidColor: '#8b5cf6',
    },
    material: {
      exposure: 1,
      splatScale: 1,
      opacityCutoff: 0.02,
      emissive: 0,
      fresnel: 0.3,
    },
    physics: {
      mouseGravity: 0.5,
      mouseRadius: 1.5,
      turbulence: 0.2,
      attractor: 'none',
    },
    post: {
      bloom: 0.4,
      dof: false,
      chromaticAberration: 0.02,
      vignette: 0.25,
    },
    audio: {
      enabled: false,
      source: 'mic',
      sensitivity: 0.5,
      bassToColor: true,
      midToTurbulence: true,
      trebleToBurst: false,
    },
  },
};

export const useSceneStore = create<SceneState & SceneActions>()(
  temporal((set, get) => ({
    ...DEFAULT_SCENE_STATE,

    setPrompt: (prompt) =>
      set((s) => ({ generation: { ...s.generation, prompt } })),
    setEnhancedPrompt: (enhancedPrompt) =>
      set((s) => ({ generation: { ...s.generation, enhancedPrompt } })),
    toggleEnhancer: () =>
      set((s) => ({
        generation: { ...s.generation, enhancerEnabled: !s.generation.enhancerEnabled },
      })),
    setImageModel: (imageModel) =>
      set((s) => ({ generation: { ...s.generation, imageModel } })),
    setTier: (tier) =>
      set((s) => ({ generation: { ...s.generation, tier } })),
    setLoraStyle: (loraStyle) =>
      set((s) => ({ generation: { ...s.generation, loraStyle } })),
    setVariants: (variants) =>
      set((s) => ({ generation: { ...s.generation, variants } })),
    selectVariant: (selectedVariantIdx) =>
      set((s) => ({ generation: { ...s.generation, selectedVariantIdx } })),
    setAssets: ({ glbUrl, splatUrl }) =>
      set((s) => ({
        generation: {
          ...s.generation,
          glbUrl: glbUrl ?? s.generation.glbUrl,
          splatUrl: splatUrl ?? s.generation.splatUrl,
        },
      })),
    setStatus: (status, error = null) =>
      set((s) => ({ generation: { ...s.generation, status, error } })),
    setCost: (costUsd) =>
      set((s) => ({ generation: { ...s.generation, costUsd } })),

    setMode: (mode) =>
      set((s) => ({ scene: { ...s.scene, mode } })),
    updateParticles: (patch) =>
      set((s) => ({ scene: { ...s.scene, particles: { ...s.scene.particles, ...patch } } })),
    updateMaterial: (patch) =>
      set((s) => ({ scene: { ...s.scene, material: { ...s.scene.material, ...patch } } })),
    updatePhysics: (patch) =>
      set((s) => ({ scene: { ...s.scene, physics: { ...s.scene.physics, ...patch } } })),
    updatePost: (patch) =>
      set((s) => ({ scene: { ...s.scene, post: { ...s.scene.post, ...patch } } })),
    updateAudio: (patch) =>
      set((s) => ({ scene: { ...s.scene, audio: { ...s.scene.audio, ...patch } } })),

    resetScene: () => set(DEFAULT_SCENE_STATE, true),

    toHash: () => {
      const { generation, scene } = get();
      return encodeState({ generation, scene });
    },
    hydrateFromHash: (hash) => {
      const decoded = decodeState<Pick<SceneState, 'generation' | 'scene'>>(hash);
      if (!decoded || !decoded.generation || !decoded.scene) return false;
      set({ generation: decoded.generation, scene: decoded.scene });
      return true;
    },
  }))
);
```

- [ ] **Step 4: Run tests, expect pass**

```bash
cd frontend && npx vitest run src/stores/sceneStore.test.ts
```
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/stores/sceneStore.ts frontend/src/stores/sceneStore.test.ts
git commit -m "feat(store): add zustand scene store with zundo undo and URL hash"
```

---

## Task 9: Button primitive

**Files:** `frontend/src/components/ui/Button.tsx`, `frontend/src/components/ui/Button.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/components/ui/Button.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
  it('calls onClick', async () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>x</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });
  it('disabled prevents click', async () => {
    const fn = vi.fn();
    render(<Button disabled onClick={fn}>x</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });
  it('applies variant class', () => {
    render(<Button variant="primary">x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('brand');
  });
});
```

- [ ] **Step 2: Install user-event**

```bash
cd frontend && npm install -D @testing-library/user-event
```

- [ ] **Step 3: Run test, expect failure**

```bash
cd frontend && npx vitest run src/components/ui/Button.test.tsx
```
Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

Create `frontend/src/components/ui/Button.tsx`:
```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const button = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded transition-colors duration-fast ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 active:bg-brand-primary/80',
        secondary: 'bg-surface-2 text-white border border-border hover:bg-surface-3',
        ghost: 'bg-transparent text-white/80 hover:bg-surface-2 hover:text-white',
        danger: 'bg-signal-danger/90 text-white hover:bg-signal-danger',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, leading, trailing, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(button({ variant, size }), className)} {...props}>
        {leading}
        {children}
        {trailing}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
```

- [ ] **Step 5: Run tests, expect pass**

```bash
cd frontend && npx vitest run src/components/ui/Button.test.tsx
```
Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/Button.tsx frontend/src/components/ui/Button.test.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(ui): add Button primitive with cva variants"
```

---

## Task 10: IconButton primitive

**Files:** `frontend/src/components/ui/IconButton.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/ui/IconButton.tsx`:
```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const iconButton = cva(
  'inline-flex items-center justify-center rounded transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        ghost: 'text-white/70 hover:text-white hover:bg-surface-2',
        solid: 'bg-surface-2 text-white hover:bg-surface-3 border border-border',
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
      },
      size: {
        sm: 'h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5',
        md: 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4',
        lg: 'h-10 w-10 [&>svg]:h-5 [&>svg]:w-5',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  }
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButton> {
  icon: ReactNode;
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, icon, label, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      className={cn(iconButton({ variant, size }), className)}
      {...props}
    >
      {icon}
    </button>
  )
);
IconButton.displayName = 'IconButton';
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/IconButton.tsx
git commit -m "feat(ui): add IconButton primitive"
```

---

## Task 11: Panel primitive

**Files:** `frontend/src/components/ui/Panel.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/ui/Panel.tsx`:
```tsx
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, title, actions, padded = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md bg-surface-1 backdrop-blur-md border border-border-subtle shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]',
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between h-9 px-3 border-b border-border-subtle">
          {title && <h3 className="text-2xs uppercase tracking-wider text-white/50 font-medium">{title}</h3>}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && 'p-3')}>{children}</div>
    </div>
  )
);
Panel.displayName = 'Panel';
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/Panel.tsx
git commit -m "feat(ui): add Panel primitive"
```

---

## Task 12: Tabs primitive

**Files:** `frontend/src/components/ui/Tabs.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/ui/Tabs.tsx`:
```tsx
import * as RadixTabs from '@radix-ui/react-tabs';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/cn';

export const Tabs = RadixTabs.Root;

export const TabsList = forwardRef<
  ElementRef<typeof RadixTabs.List>,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn('flex items-center gap-0.5 p-1 bg-surface-2 rounded', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  ElementRef<typeof RadixTabs.Trigger>,
  ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center h-7 px-3 text-xs font-medium rounded-sm transition-colors duration-fast',
      'text-white/60 hover:text-white/90',
      'data-[state=active]:bg-surface-0 data-[state=active]:text-white data-[state=active]:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  ElementRef<typeof RadixTabs.Content>,
  ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn('focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/Tabs.tsx
git commit -m "feat(ui): add Tabs primitive"
```

---

## Task 13: Slider primitive

**Files:** `frontend/src/components/ui/Slider.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/ui/Slider.tsx`:
```tsx
import * as RadixSlider from '@radix-ui/react-slider';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/cn';

export const Slider = forwardRef<
  ElementRef<typeof RadixSlider.Root>,
  ComponentPropsWithoutRef<typeof RadixSlider.Root>
>(({ className, ...props }, ref) => (
  <RadixSlider.Root
    ref={ref}
    className={cn('relative flex items-center select-none touch-none w-full h-5', className)}
    {...props}
  >
    <RadixSlider.Track className="relative grow h-1 rounded-full bg-surface-2">
      <RadixSlider.Range className="absolute h-full rounded-full bg-brand-primary" />
    </RadixSlider.Track>
    <RadixSlider.Thumb
      className="block h-3.5 w-3.5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 hover:scale-110 transition-transform duration-fast"
      aria-label="value"
    />
  </RadixSlider.Root>
));
Slider.displayName = 'Slider';
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/Slider.tsx
git commit -m "feat(ui): add Slider primitive"
```

---

## Task 14: NumberField primitive (scrub-to-edit)

**Files:** `frontend/src/components/ui/NumberField.tsx`, `frontend/src/components/ui/NumberField.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/components/ui/NumberField.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('renders value', () => {
    render(<NumberField value={42} onChange={() => {}} label="count" />);
    expect(screen.getByDisplayValue('42')).toBeInTheDocument();
  });
  it('calls onChange on input commit', async () => {
    const fn = vi.fn();
    render(<NumberField value={1} onChange={fn} label="count" />);
    const input = screen.getByLabelText('count') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '7{Enter}');
    expect(fn).toHaveBeenLastCalledWith(7);
  });
  it('clamps to min/max', async () => {
    const fn = vi.fn();
    render(<NumberField value={5} min={0} max={10} onChange={fn} label="v" />);
    const input = screen.getByLabelText('v') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '99{Enter}');
    expect(fn).toHaveBeenLastCalledWith(10);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
cd frontend && npx vitest run src/components/ui/NumberField.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `frontend/src/components/ui/NumberField.tsx`:
```tsx
import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { cn } from '@/lib/cn';

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const NumberField = ({
  value,
  onChange,
  label,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix,
  className,
}: NumberFieldProps) => {
  const [draft, setDraft] = useState(String(value));
  const scrubbing = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(value);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    onChange(clamp(parsed, min, max));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit(draft);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setDraft(String(value));
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(clamp(value + step * (e.shiftKey ? 10 : 1), min, max));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(clamp(value - step * (e.shiftKey ? 10 : 1), min, max));
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLLabelElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    scrubbing.current = true;
    startX.current = e.clientX;
    startValue.current = value;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLLabelElement>) => {
    if (!scrubbing.current) return;
    const dx = e.clientX - startX.current;
    const next = startValue.current + Math.round(dx) * step;
    onChange(clamp(next, min, max));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLLabelElement>) => {
    scrubbing.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <label
      className={cn(
        'group flex items-center gap-2 h-7 px-2 rounded-sm bg-surface-2 border border-border-subtle hover:border-border cursor-ew-resize select-none',
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span className="text-2xs uppercase tracking-wider text-white/40 font-mono">{label}</span>
      <input
        aria-label={label}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent text-right text-sm font-mono tabular-nums text-white outline-none cursor-text"
      />
      {suffix && <span className="text-2xs font-mono text-white/40">{suffix}</span>}
    </label>
  );
};
```

- [ ] **Step 4: Run, expect pass**

```bash
cd frontend && npx vitest run src/components/ui/NumberField.test.tsx
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/NumberField.tsx frontend/src/components/ui/NumberField.test.tsx
git commit -m "feat(ui): add NumberField primitive with scrub-to-edit"
```

---

## Task 15: Input + Textarea primitives

**Files:** `frontend/src/components/ui/Input.tsx`, `frontend/src/components/ui/Textarea.tsx`

- [ ] **Step 1: Implement Input**

Create `frontend/src/components/ui/Input.tsx`:
```tsx
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-8 px-3 rounded-sm bg-surface-2 border border-border-subtle text-sm text-white placeholder:text-white/30',
        'hover:border-border focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
        'transition-colors duration-fast',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
```

- [ ] **Step 2: Implement Textarea**

Create `frontend/src/components/ui/Textarea.tsx`:
```tsx
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[72px] p-3 rounded-sm bg-surface-2 border border-border-subtle text-sm text-white placeholder:text-white/30 resize-y',
        'hover:border-border focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
        'transition-colors duration-fast',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/ui/Input.tsx frontend/src/components/ui/Textarea.tsx && \
  git commit -m "feat(ui): add Input and Textarea primitives"
```

---

## Task 16: Tooltip + Kbd primitives

**Files:** `frontend/src/components/ui/Tooltip.tsx`, `frontend/src/components/ui/Kbd.tsx`

- [ ] **Step 1: Implement Tooltip**

Create `frontend/src/components/ui/Tooltip.tsx`:
```tsx
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

export const Tooltip = ({ content, side = 'top', children }: TooltipProps) => (
  <RadixTooltip.Root delayDuration={300}>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={6}
        className={cn(
          'z-50 px-2 py-1 rounded-sm bg-surface-0 border border-border text-2xs text-white/90 shadow-xl',
          'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0'
        )}
      >
        {content}
        <RadixTooltip.Arrow className="fill-surface-0" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
);
```

- [ ] **Step 2: Implement Kbd**

Create `frontend/src/components/ui/Kbd.tsx`:
```tsx
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Kbd = ({ className, children, ...props }: HTMLAttributes<HTMLElement>) => (
  <kbd
    className={cn(
      'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm',
      'bg-surface-0 border border-border-subtle text-[10px] font-mono text-white/70',
      className
    )}
    {...props}
  >
    {children}
  </kbd>
);
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/ui/Tooltip.tsx frontend/src/components/ui/Kbd.tsx && \
  git commit -m "feat(ui): add Tooltip and Kbd primitives"
```

---

## Task 17: UI barrel export

**Files:** `frontend/src/components/ui/index.ts`

- [ ] **Step 1: Create barrel**

Create `frontend/src/components/ui/index.ts`:
```ts
export { Button, type ButtonProps } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';
export { Panel, type PanelProps } from './Panel';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export { Slider } from './Slider';
export { NumberField, type NumberFieldProps } from './NumberField';
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Tooltip, TooltipProvider, type TooltipProps } from './Tooltip';
export { Kbd } from './Kbd';
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/ui/index.ts && \
  git commit -m "feat(ui): add barrel export"
```

---

## Task 18: `/dev/ui` review route

**Files:** `frontend/src/pages/DevUIPage.tsx`, `frontend/src/App.tsx`

- [ ] **Step 1: Create preview page**

Create `frontend/src/pages/DevUIPage.tsx`:
```tsx
import { useState } from 'react';
import { Settings, Play, Download } from 'lucide-react';
import {
  Button, IconButton, Panel, Tabs, TabsList, TabsTrigger, TabsContent,
  Slider, NumberField, Input, Textarea, Tooltip, TooltipProvider, Kbd,
} from '@/components/ui';
import { useSceneStore } from '@/stores/sceneStore';

export default function DevUIPage() {
  const [sliderVal, setSliderVal] = useState([50]);
  const prompt = useSceneStore((s) => s.generation.prompt);
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const particles = useSceneStore((s) => s.scene.particles);
  const updateParticles = useSceneStore((s) => s.updateParticles);
  const toHash = useSceneStore((s) => s.toHash);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-0 text-white p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">3Dme — UI Preview</h1>
          <p className="text-sm text-white/50">Design system primitives and scene store demo.</p>
        </header>

        <Panel title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button leading={<Play className="w-3.5 h-3.5" />}>With icon</Button>
          </div>
        </Panel>

        <Panel title="Icon buttons">
          <div className="flex items-center gap-2">
            <Tooltip content="Settings">
              <IconButton icon={<Settings />} label="Settings" />
            </Tooltip>
            <Tooltip content="Export"><IconButton icon={<Download />} label="Export" variant="solid" /></Tooltip>
            <Tooltip content="Play"><IconButton icon={<Play />} label="Play" variant="primary" /></Tooltip>
          </div>
        </Panel>

        <Panel title="Tabs">
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Particles</TabsTrigger>
              <TabsTrigger value="b">Material</TabsTrigger>
              <TabsTrigger value="c">Physics</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="pt-4 text-sm text-white/70">Particles tab content</TabsContent>
            <TabsContent value="b" className="pt-4 text-sm text-white/70">Material tab content</TabsContent>
            <TabsContent value="c" className="pt-4 text-sm text-white/70">Physics tab content</TabsContent>
          </Tabs>
        </Panel>

        <Panel title="Slider + NumberField">
          <div className="space-y-4 max-w-sm">
            <Slider value={sliderVal} onValueChange={setSliderVal} min={0} max={100} />
            <NumberField
              label="count"
              value={particles.count}
              onChange={(v) => updateParticles({ count: v })}
              min={1000}
              max={2_000_000}
              step={1000}
              suffix="pts"
            />
            <NumberField
              label="size"
              value={particles.size}
              onChange={(v) => updateParticles({ size: v })}
              min={0.1}
              max={10}
              step={0.1}
            />
          </div>
        </Panel>

        <Panel title="Inputs">
          <div className="space-y-3 max-w-md">
            <Input
              placeholder="Describe what you want to create…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Textarea placeholder="Longer prompt…" />
          </div>
        </Panel>

        <Panel title="Keyboard shortcuts">
          <div className="flex flex-wrap gap-3 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><Kbd>⌘</Kbd><Kbd>K</Kbd> command palette</span>
            <span className="flex items-center gap-1.5"><Kbd>/</Kbd> focus prompt</span>
            <span className="flex items-center gap-1.5"><Kbd>G</Kbd> generate</span>
            <span className="flex items-center gap-1.5"><Kbd>M</Kbd> toggle mode</span>
          </div>
        </Panel>

        <Panel title="Store → URL hash">
          <div className="space-y-3 text-sm">
            <div className="text-white/70">Prompt in store: <span className="font-mono text-white">{prompt || '(empty)'}</span></div>
            <div className="text-white/70">Particles count: <span className="font-mono text-white">{particles.count.toLocaleString()}</span></div>
            <div className="text-white/70 break-all">
              Hash: <span className="font-mono text-2xs text-brand-secondary">{toHash().slice(0, 120)}…</span>
            </div>
          </div>
        </Panel>
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Mount `/dev/ui` route in App.tsx**

Read current `frontend/src/App.tsx` and add the new route. Add import:
```tsx
import DevUIPage from './pages/DevUIPage';
```
Add inside the existing `<Routes>`:
```tsx
<Route path="/dev/ui" element={<DevUIPage />} />
```

- [ ] **Step 3: Dev server boots**

```bash
cd frontend && (timeout 10 npm run dev >/tmp/3dme-dev.log 2>&1 &) && sleep 6 && tail -20 /tmp/3dme-dev.log
```
Expected: `Local: http://localhost:5173` printed, no errors.

- [ ] **Step 4: Typecheck + build**

```bash
cd frontend && npm run typecheck && npm run build
```
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/DevUIPage.tsx frontend/src/App.tsx
git commit -m "feat(dev): add /dev/ui preview route for design system"
```

---

## Task 19: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && npx vitest run
```
Expected: all new tests pass (cn, urlHash, sceneStore, Button, NumberField).

- [ ] **Step 2: Lint**

```bash
cd frontend && npm run lint
```
Expected: no new errors.

- [ ] **Step 3: Typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: zero errors.

- [ ] **Step 4: Manual smoke test**

Visit `http://localhost:5173/dev/ui`. Verify:
- All sections render
- Buttons clickable
- Slider draggable
- NumberField scrub-to-edit works (drag label left/right)
- NumberField arrow keys work
- Tabs switch
- Store updates reflect in "Store → URL hash" panel

- [ ] **Step 5: No commit needed — verification only**

---

## Self-Review Checklist

- ✅ Spec coverage: design tokens (§Visual system), UI primitives (§Components > ui/), Zustand + zundo + URL hash (§State management), shareable URLs (§Goal), reduced motion (§Motion).
- ✅ No placeholders — every step has complete code or exact commands.
- ✅ Type consistency — `SceneState`, `GenerationState`, `SceneActions` used consistently.
- ✅ Plan scope: foundation only. Does not touch existing `StudioPage`, `HomePage`, `ControlPanel`, or particles — additive.
- ✅ All commits frequent, TDD where behavior exists to test.

## Gaps intentionally deferred to later plans

- Command palette (`cmdk`) — Plan 3
- Toast (`sonner`) — Plan 2 (for API error UI)
- Dialog, Sheet, Select, ColorPicker — added in the plans that need them
- `useSceneStore` integration with existing `StudioPage` — Plan 3
