# 3Dme Studio Shell, Renderers & Generation Flow — Plan 3

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current floating `ControlPanel.tsx` with a professional docked-rail Studio. Add Gaussian-splat rendering alongside the existing GPGPU particle system (live `M` key toggle). Wire the new `aiService` through a generation flow with prompt enhancer, 4-up variant picker, quality-tier ladder with cost preview, inline SSE progress, shareable URL hash, and a `⌘K` command palette.

**Architecture:** A new `StudioShell` composes `TopBar`, `LeftRail`, `CanvasViewport`, `RightRail`, and `BottomTransport`. The canvas hosts a `RendererSwitcher` that mounts either the existing `UltimateParticles` system or a new `SplatRenderer` (via the `@sparkjsdev/spark` package) based on `sceneStore.scene.mode`. The generation flow is a 3-state machine (empty → generating → ready) driven entirely by the zustand store, which already persists to URL hash. Every panel is ≤150 lines; the old `ControlPanel.tsx` is deleted at the end.

**Tech Stack:** React 19, Zustand, `@sparkjsdev/spark` (Gaussian splat renderer for Three.js), `cmdk` (already installed in Plan 1), `sonner` (toasts), framer-motion, Radix Dialog/Sheet, existing Three.js WebGPU stack.

**Spec:** `docs/superpowers/specs/2026-04-13-pro-uiux-redesign-design.md`

---

## File Structure

### Create
- `frontend/src/components/ui/Dialog.tsx`
- `frontend/src/components/ui/Sheet.tsx`
- `frontend/src/components/ui/Toaster.tsx`
- `frontend/src/components/ui/Select.tsx`
- `frontend/src/components/studio/StudioShell.tsx`
- `frontend/src/components/studio/TopBar.tsx`
- `frontend/src/components/studio/LeftRail.tsx`
- `frontend/src/components/studio/RightRail.tsx`
- `frontend/src/components/studio/BottomTransport.tsx`
- `frontend/src/components/studio/CanvasViewport.tsx`
- `frontend/src/components/studio/GizmoOverlay.tsx`
- `frontend/src/components/studio/EmptyState.tsx`
- `frontend/src/components/studio/GenerationProgress.tsx`
- `frontend/src/components/studio/PromptBar.tsx`
- `frontend/src/components/studio/ModeToggle.tsx`
- `frontend/src/components/studio/ShareDialog.tsx`
- `frontend/src/components/studio/CommandPalette.tsx`
- `frontend/src/components/studio/generation/QualityLadder.tsx`
- `frontend/src/components/studio/generation/VariantPicker.tsx`
- `frontend/src/components/studio/generation/PromptEnhancerToggle.tsx`
- `frontend/src/components/studio/panels/ScenePanel.tsx`
- `frontend/src/components/studio/panels/LibraryPanel.tsx`
- `frontend/src/components/studio/panels/AIPanel.tsx`
- `frontend/src/components/studio/panels/ParticlesPanel.tsx`
- `frontend/src/components/studio/panels/MaterialPanel.tsx`
- `frontend/src/components/studio/panels/PhysicsPanel.tsx`
- `frontend/src/components/studio/panels/PostPanel.tsx`
- `frontend/src/components/studio/panels/AnimationPanel.tsx`
- `frontend/src/components/renderers/SplatRenderer.tsx`
- `frontend/src/components/renderers/RendererSwitcher.tsx`
- `frontend/src/hooks/useKeyboardShortcut.ts`
- `frontend/src/hooks/useUrlHashSync.ts`
- `frontend/src/hooks/useGenerationFlow.ts`
- `frontend/src/hooks/useKeyboardShortcut.test.ts`
- `frontend/src/hooks/useUrlHashSync.test.ts`

### Modify
- `frontend/package.json` — add `@sparkjsdev/spark`
- `frontend/src/pages/StudioPage.tsx` — replace with `<StudioShell />`
- `frontend/src/App.tsx` — wrap with `<TooltipProvider>` and `<Toaster>`
- `frontend/src/components/ui/index.ts` — export new primitives

### Delete (at the end, after migration verified)
- `frontend/src/components/controls/ControlPanel.tsx`

---

## Task 1: Install Spark and prep deps

**Files:** `frontend/package.json`

- [ ] **Step 1: Install Spark**

```bash
cd frontend && npm install @sparkjsdev/spark
```
If the package isn't found, try `npm view @sparkjsdev/spark` and fall back to the package name listed on https://sparkjs.dev — update the import accordingly and note in your report.

- [ ] **Step 2: Verify**

```bash
cd frontend && npm ls @sparkjsdev/spark
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(deps): add @sparkjsdev/spark for gaussian splat rendering"
```

---

## Task 2: Dialog, Sheet, Select, Toaster primitives

**Files:** `frontend/src/components/ui/{Dialog,Sheet,Select,Toaster}.tsx`

- [ ] **Step 1: Dialog**

Create `frontend/src/components/ui/Dialog.tsx`:
```tsx
import * as RadixDialog from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content> & { title?: ReactNode; description?: ReactNode }
>(({ className, children, title, description, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'rounded-md bg-surface-1 backdrop-blur-xl border border-border shadow-2xl',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <header className="p-5 border-b border-border-subtle">
          {title && <RadixDialog.Title className="text-lg font-semibold text-white">{title}</RadixDialog.Title>}
          {description && <RadixDialog.Description className="text-sm text-white/60 mt-1">{description}</RadixDialog.Description>}
        </header>
      )}
      <div className="p-5">{children}</div>
      <RadixDialog.Close className="absolute top-3 right-3 text-white/50 hover:text-white">
        <X className="w-4 h-4" />
        <span className="sr-only">Close</span>
      </RadixDialog.Close>
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
DialogContent.displayName = 'DialogContent';
```

- [ ] **Step 2: Sheet (mobile bottom sheet)**

Create `frontend/src/components/ui/Sheet.tsx`:
```tsx
import * as RadixDialog from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/cn';

export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;

export const SheetContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, children, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 rounded-t-lg border-t border-border bg-surface-1 backdrop-blur-xl p-4 max-h-[85vh] overflow-y-auto',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full',
        className
      )}
      {...props}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
SheetContent.displayName = 'SheetContent';
```

- [ ] **Step 3: Select — simple native fallback**

Create `frontend/src/components/ui/Select.tsx`:
```tsx
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full h-8 px-2 rounded-sm bg-surface-2 border border-border-subtle text-sm text-white',
        'hover:border-border focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
        'transition-colors duration-fast cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
```

- [ ] **Step 4: Toaster (Sonner wrapper)**

Create `frontend/src/components/ui/Toaster.tsx`:
```tsx
import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => (
  <SonnerToaster
    theme="dark"
    position="bottom-right"
    toastOptions={{
      className: 'rounded-md bg-surface-1 border border-border text-white text-sm',
    }}
  />
);
```

- [ ] **Step 5: Update barrel**

Append to `frontend/src/components/ui/index.ts`:
```ts
export { Dialog, DialogTrigger, DialogContent } from './Dialog';
export { Sheet, SheetTrigger, SheetContent } from './Sheet';
export { Select } from './Select';
export { Toaster } from './Toaster';
```

- [ ] **Step 6: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/ui/Dialog.tsx frontend/src/components/ui/Sheet.tsx frontend/src/components/ui/Select.tsx frontend/src/components/ui/Toaster.tsx frontend/src/components/ui/index.ts && \
  git commit -m "feat(ui): add Dialog, Sheet, Select, Toaster primitives"
```

---

## Task 3: `useKeyboardShortcut` hook with tests

**Files:** `frontend/src/hooks/useKeyboardShortcut.ts`, `.test.ts`

- [ ] **Step 1: Write failing test**

Create `frontend/src/hooks/useKeyboardShortcut.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from './useKeyboardShortcut';

const fire = (init: KeyboardEventInit) => {
  window.dispatchEvent(new KeyboardEvent('keydown', init));
};

afterEach(() => { vi.restoreAllMocks(); });

describe('useKeyboardShortcut', () => {
  it('calls handler on exact key match', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('g', fn));
    fire({ key: 'g' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('ignores modifiers unless requested', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('g', fn));
    fire({ key: 'g', metaKey: true });
    expect(fn).not.toHaveBeenCalled();
  });

  it('matches meta+key when requested', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('k', fn, { meta: true }));
    fire({ key: 'k', metaKey: true });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('skips when target is input', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('g', fn));
    const input = document.createElement('input');
    document.body.appendChild(input);
    const evt = new KeyboardEvent('keydown', { key: 'g', bubbles: true });
    Object.defineProperty(evt, 'target', { value: input });
    window.dispatchEvent(evt);
    expect(fn).not.toHaveBeenCalled();
    input.remove();
  });
});
```

- [ ] **Step 2: Implement**

Create `frontend/src/hooks/useKeyboardShortcut.ts`:
```ts
import { useEffect, useRef } from 'react';

export interface ShortcutOptions {
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  allowInInput?: boolean;
}

export const useKeyboardShortcut = (
  key: string,
  handler: (e: KeyboardEvent) => void,
  opts: ShortcutOptions = {}
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (Boolean(opts.meta) !== e.metaKey) return;
      if (Boolean(opts.ctrl) !== e.ctrlKey) return;
      if (opts.shift !== undefined && Boolean(opts.shift) !== e.shiftKey) return;
      if (opts.alt !== undefined && Boolean(opts.alt) !== e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!opts.allowInInput && target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      handlerRef.current(e);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, opts.meta, opts.ctrl, opts.shift, opts.alt, opts.allowInInput]);
};
```

- [ ] **Step 3: Run tests**

```bash
cd frontend && npx vitest run src/hooks/useKeyboardShortcut.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useKeyboardShortcut.ts frontend/src/hooks/useKeyboardShortcut.test.ts
git commit -m "feat(hooks): add useKeyboardShortcut"
```

---

## Task 4: `useUrlHashSync` hook

**Files:** `frontend/src/hooks/useUrlHashSync.ts`, `.test.ts`

- [ ] **Step 1: Test**

Create `frontend/src/hooks/useUrlHashSync.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSceneStore, DEFAULT_SCENE_STATE } from '@/stores/sceneStore';
import { useUrlHashSync } from './useUrlHashSync';

describe('useUrlHashSync', () => {
  beforeEach(() => {
    useSceneStore.setState(DEFAULT_SCENE_STATE);
    window.location.hash = '';
  });

  it('hydrates from initial hash', () => {
    useSceneStore.getState().setPrompt('seeded');
    const hash = useSceneStore.getState().toHash();
    useSceneStore.setState(DEFAULT_SCENE_STATE);
    window.location.hash = `#${hash}`;
    renderHook(() => useUrlHashSync());
    expect(useSceneStore.getState().generation.prompt).toBe('seeded');
  });

  it('ignores empty hash', () => {
    window.location.hash = '';
    renderHook(() => useUrlHashSync());
    expect(useSceneStore.getState().generation.prompt).toBe('');
  });
});
```

- [ ] **Step 2: Implement**

Create `frontend/src/hooks/useUrlHashSync.ts`:
```ts
import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/stores/sceneStore';

export const useUrlHashSync = () => {
  const hydrated = useRef(false);
  const hydrate = useSceneStore((s) => s.hydrateFromHash);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) hydrate(hash);
  }, [hydrate]);
};
```

- [ ] **Step 3: Run tests, commit**

```bash
cd frontend && npx vitest run src/hooks/useUrlHashSync.test.ts && \
  git add frontend/src/hooks/useUrlHashSync.ts frontend/src/hooks/useUrlHashSync.test.ts && \
  git commit -m "feat(hooks): add useUrlHashSync for shareable scene URLs"
```

---

## Task 5: `useGenerationFlow` hook

**Files:** `frontend/src/hooks/useGenerationFlow.ts`

- [ ] **Step 1: Implement**

Create `frontend/src/hooks/useGenerationFlow.ts`:
```ts
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useSceneStore } from '@/stores/sceneStore';
import { enhancePrompt, generateImage, generate3D } from '@/services/aiService';

export const useGenerationFlow = () => {
  const setStatus = useSceneStore((s) => s.setStatus);
  const setEnhancedPrompt = useSceneStore((s) => s.setEnhancedPrompt);
  const setVariants = useSceneStore((s) => s.setVariants);
  const selectVariant = useSceneStore((s) => s.selectVariant);
  const setAssets = useSceneStore((s) => s.setAssets);
  const setCost = useSceneStore((s) => s.setCost);

  const runImageStage = useCallback(async () => {
    const { generation } = useSceneStore.getState();
    const prompt = generation.enhancedPrompt ?? generation.prompt;
    if (!prompt) {
      toast.error('Type a prompt first');
      return;
    }

    try {
      if (generation.enhancerEnabled && !generation.enhancedPrompt) {
        setStatus('enhancing');
        const { enhanced } = await enhancePrompt({ prompt: generation.prompt, style: 'cinematic' });
        setEnhancedPrompt(enhanced);
      }
    } catch {
      toast.message('Enhancer unavailable — using raw prompt');
    }

    setStatus('generating-image');
    setVariants([]);
    selectVariant(null);

    try {
      const stream = generateImage({
        prompt: useSceneStore.getState().generation.enhancedPrompt ?? prompt,
        model: generation.imageModel,
        batch: 4,
      });
      let cost = 0;
      for await (const evt of stream) {
        if (evt.type === 'images' && evt.images) setVariants(evt.images);
        else if (evt.type === 'done') {
          if (evt.images) setVariants(evt.images);
          cost += evt.costUsd ?? 0;
        } else if (evt.type === 'error') {
          throw new Error(evt.error ?? 'generation error');
        }
      }
      setCost(cost);
      setStatus('idle');
    } catch (err) {
      setStatus('error', (err as Error).message);
      toast.error('Image generation failed');
    }
  }, [setStatus, setEnhancedPrompt, setVariants, selectVariant, setCost]);

  const runThreeDStage = useCallback(async () => {
    const { generation } = useSceneStore.getState();
    const variant = generation.selectedVariantIdx !== null ? generation.variants[generation.selectedVariantIdx] : null;
    if (!variant) {
      toast.error('Pick a variant first');
      return;
    }

    setStatus('generating-3d');
    try {
      const stream = generate3D({
        imageUrl: variant.url,
        tier: generation.tier,
        outputs: ['glb', 'splat'],
      });
      for await (const evt of stream) {
        if (evt.type === 'done') {
          setAssets({ glbUrl: evt.glbUrl, splatUrl: evt.splatUrl });
          setCost(generation.costUsd + (evt.costUsd ?? 0));
        } else if (evt.type === 'error') {
          throw new Error(evt.error ?? '3D generation error');
        }
      }
      setStatus('ready');
      toast.success('Scene ready');
    } catch (err) {
      setStatus('error', (err as Error).message);
      toast.error('3D generation failed');
    }
  }, [setStatus, setAssets, setCost]);

  return { runImageStage, runThreeDStage };
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/hooks/useGenerationFlow.ts && \
  git commit -m "feat(hooks): add useGenerationFlow orchestrator"
```

---

## Task 6: `PromptBar` component

**Files:** `frontend/src/components/studio/PromptBar.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/studio/PromptBar.tsx`:
```tsx
import { useRef } from 'react';
import { Sparkles, ArrowUp, Loader2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { Button, Input, Kbd, Tooltip } from '@/components/ui';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn } from '@/lib/cn';

export interface PromptBarProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export const PromptBar = ({ size = 'lg', className }: PromptBarProps) => {
  const prompt = useSceneStore((s) => s.generation.prompt);
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const enhancerEnabled = useSceneStore((s) => s.generation.enhancerEnabled);
  const toggleEnhancer = useSceneStore((s) => s.toggleEnhancer);
  const status = useSceneStore((s) => s.generation.status);
  const setEnhancedPrompt = useSceneStore((s) => s.setEnhancedPrompt);
  const { runImageStage } = useGenerationFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcut('/', () => inputRef.current?.focus());
  useKeyboardShortcut('g', () => void runImageStage());

  const busy = status === 'enhancing' || status === 'generating-image' || status === 'generating-3d';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md bg-surface-1 backdrop-blur-md border border-border',
        size === 'lg' ? 'p-2 pl-4' : 'p-1.5 pl-3',
        className
      )}
    >
      <Tooltip content={enhancerEnabled ? 'Disable prompt enhancer' : 'Enable prompt enhancer'}>
        <button
          type="button"
          onClick={toggleEnhancer}
          aria-pressed={enhancerEnabled}
          className={cn(
            'flex items-center justify-center rounded-sm transition-colors duration-fast',
            size === 'lg' ? 'h-8 w-8' : 'h-7 w-7',
            enhancerEnabled ? 'bg-brand-primary/20 text-brand-primary' : 'text-white/40 hover:text-white/70'
          )}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </Tooltip>
      <Input
        ref={inputRef}
        value={prompt}
        onChange={(e) => { setPrompt(e.target.value); setEnhancedPrompt(null); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !busy) { e.preventDefault(); void runImageStage(); }
        }}
        placeholder={size === 'lg' ? 'Describe or drop an image…' : 'Prompt…'}
        className="flex-1 h-8 bg-transparent border-0 px-0 focus:ring-0"
        disabled={busy}
      />
      {!busy && (
        <span className="hidden md:flex items-center gap-1 text-2xs text-white/30">
          <Kbd>/</Kbd>
        </span>
      )}
      <Button
        variant="primary"
        size={size === 'lg' ? 'md' : 'sm'}
        onClick={() => void runImageStage()}
        disabled={busy || !prompt.trim()}
        leading={busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
      >
        {busy ? 'Working…' : 'Generate'}
      </Button>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/PromptBar.tsx && \
  git commit -m "feat(studio): add PromptBar with enhancer toggle"
```

---

## Task 7: `QualityLadder` with cost preview

**Files:** `frontend/src/components/studio/generation/QualityLadder.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/studio/generation/QualityLadder.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { cn } from '@/lib/cn';

interface TierMeta {
  id: 'fast' | 'balanced' | 'pro';
  label: string;
  model: string;
  eta: string;
  cost: number;
  blurb: string;
}

const TIERS: TierMeta[] = [
  { id: 'fast', label: 'Fast', model: 'Trellis', eta: '5s', cost: 0.02, blurb: 'Quickest 3D path' },
  { id: 'balanced', label: 'Balanced', model: 'Hunyuan3D v2', eta: '15s', cost: 0.16, blurb: 'Higher quality mesh' },
  { id: 'pro', label: 'Pro', model: 'Rodin Gen-2', eta: '30s', cost: 0.4, blurb: 'Production PBR mesh' },
];

export const QualityLadder = () => {
  const tier = useSceneStore((s) => s.generation.tier);
  const setTier = useSceneStore((s) => s.setTier);

  return (
    <div className="grid grid-cols-3 gap-2">
      {TIERS.map((t) => {
        const active = tier === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTier(t.id)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors duration-fast',
              active
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-border-subtle bg-surface-2 hover:border-border'
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold text-white">{t.label}</span>
              <span className="text-2xs font-mono tabular-nums text-white/60">${t.cost.toFixed(3)}</span>
            </div>
            <span className="text-2xs text-white/50">{t.model}</span>
            <span className="text-2xs text-white/40">~{t.eta}</span>
          </button>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/generation/QualityLadder.tsx && \
  git commit -m "feat(studio): add QualityLadder with inline cost preview"
```

---

## Task 8: `VariantPicker` (4-up grid)

**Files:** `frontend/src/components/studio/generation/VariantPicker.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/studio/generation/VariantPicker.tsx`:
```tsx
import { Check } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';

export const VariantPicker = () => {
  const variants = useSceneStore((s) => s.generation.variants);
  const selectedIdx = useSceneStore((s) => s.generation.selectedVariantIdx);
  const selectVariant = useSceneStore((s) => s.selectVariant);
  const { runThreeDStage } = useGenerationFlow();

  if (variants.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {variants.map((v, idx) => {
          const active = selectedIdx === idx;
          return (
            <button
              key={`${v.seed}-${idx}`}
              type="button"
              onClick={() => selectVariant(idx)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-md border transition-all duration-fast',
                active ? 'border-brand-primary ring-2 ring-brand-primary/40' : 'border-border-subtle hover:border-border'
              )}
            >
              <img src={v.url} alt={`variant ${idx + 1}`} className="h-full w-full object-cover" />
              {active && (
                <span className="absolute top-1.5 right-1.5 rounded-full bg-brand-primary p-1 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Button
        variant="primary"
        size="md"
        onClick={() => void runThreeDStage()}
        disabled={selectedIdx === null}
        className="w-full"
      >
        Convert to 3D
      </Button>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/generation/VariantPicker.tsx && \
  git commit -m "feat(studio): add VariantPicker 4-up grid"
```

---

## Task 9: `GenerationProgress` + `EmptyState`

**Files:** `frontend/src/components/studio/{GenerationProgress,EmptyState}.tsx`

- [ ] **Step 1: GenerationProgress**

Create `frontend/src/components/studio/GenerationProgress.tsx`:
```tsx
import { Loader2, Check, Image as ImageIcon, Box, Wand2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { cn } from '@/lib/cn';

type StepState = 'pending' | 'active' | 'done';
interface Step { id: string; label: string; icon: React.ReactNode; state: StepState; }

export const GenerationProgress = () => {
  const status = useSceneStore((s) => s.generation.status);
  const variants = useSceneStore((s) => s.generation.variants);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);

  if (status === 'idle' && variants.length === 0) return null;

  const steps: Step[] = [
    {
      id: 'enhance',
      label: 'Enhance prompt',
      icon: <Wand2 className="h-3.5 w-3.5" />,
      state: status === 'enhancing' ? 'active' : variants.length > 0 || status === 'generating-image' ? 'done' : 'pending',
    },
    {
      id: 'image',
      label: 'Generate image',
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      state: status === 'generating-image' ? 'active' : variants.length > 0 ? 'done' : 'pending',
    },
    {
      id: '3d',
      label: 'Build 3D',
      icon: <Box className="h-3.5 w-3.5" />,
      state: status === 'generating-3d' ? 'active' : glbUrl ? 'done' : 'pending',
    },
  ];

  return (
    <div className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-1 px-4 py-2">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border',
              s.state === 'active' && 'border-brand-primary text-brand-primary',
              s.state === 'done' && 'border-signal-success text-signal-success',
              s.state === 'pending' && 'border-border-subtle text-white/30'
            )}
          >
            {s.state === 'active' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : s.state === 'done' ? <Check className="h-3.5 w-3.5" /> : s.icon}
          </div>
          <span className={cn('text-xs', s.state === 'pending' ? 'text-white/30' : 'text-white/80')}>{s.label}</span>
          {idx < steps.length - 1 && <span className="h-px w-4 bg-border" />}
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 2: EmptyState**

Create `frontend/src/components/studio/EmptyState.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { PromptBar } from './PromptBar';
import { QualityLadder } from './generation/QualityLadder';
import { VariantPicker } from './generation/VariantPicker';
import { GenerationProgress } from './GenerationProgress';

const PRESETS = [
  'A crystalline jellyfish drifting through deep space',
  'Neon cyberpunk samurai in the rain',
  'Ancient ice dragon carved from obsidian',
  'Bioluminescent forest at twilight',
  'Molten lava skull with glowing eyes',
  'Origami phoenix made of gold foil',
];

export const EmptyState = () => {
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const variants = useSceneStore((s) => s.generation.variants);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);

  if (glbUrl) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-6 pointer-events-none">
      <div className="w-full max-w-2xl space-y-6 pointer-events-auto">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-white">Create a 3D scene</h1>
          <p className="text-sm text-white/50">Start with a prompt or drop an image.</p>
        </header>
        <PromptBar />
        <GenerationProgress />
        <QualityLadder />
        {variants.length > 0 && <VariantPicker />}
        {variants.length === 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-white/70 hover:border-border hover:text-white transition-colors duration-fast"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/GenerationProgress.tsx frontend/src/components/studio/EmptyState.tsx && \
  git commit -m "feat(studio): add GenerationProgress stepper and EmptyState"
```

---

## Task 10: `ModeToggle`

**Files:** `frontend/src/components/studio/ModeToggle.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/studio/ModeToggle.tsx`:
```tsx
import { Sparkles, Droplet } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn } from '@/lib/cn';

export const ModeToggle = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const setMode = useSceneStore((s) => s.setMode);

  useKeyboardShortcut('m', () => setMode(mode === 'splat' ? 'particles' : 'splat'));

  return (
    <div className="flex items-center gap-0.5 rounded-sm bg-surface-2 p-0.5 border border-border-subtle">
      <button
        type="button"
        onClick={() => setMode('splat')}
        aria-pressed={mode === 'splat'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-6 rounded-sm text-xs font-medium transition-colors duration-fast',
          mode === 'splat' ? 'bg-surface-0 text-white' : 'text-white/60 hover:text-white/90'
        )}
      >
        <Droplet className="h-3 w-3" />
        Splat
      </button>
      <button
        type="button"
        onClick={() => setMode('particles')}
        aria-pressed={mode === 'particles'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-6 rounded-sm text-xs font-medium transition-colors duration-fast',
          mode === 'particles' ? 'bg-surface-0 text-white' : 'text-white/60 hover:text-white/90'
        )}
      >
        <Sparkles className="h-3 w-3" />
        Particles
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/studio/ModeToggle.tsx && \
  git commit -m "feat(studio): add Splat/Particles ModeToggle with M shortcut"
```

---

## Task 11: `SplatRenderer` + `RendererSwitcher`

**Files:** `frontend/src/components/renderers/{SplatRenderer,RendererSwitcher}.tsx`

- [ ] **Step 1: SplatRenderer**

Create `frontend/src/components/renderers/SplatRenderer.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Spark is imported dynamically to avoid bundling when splat mode is unused.
export interface SplatRendererProps {
  url: string;
  className?: string;
}

export const SplatRenderer = ({ url, className }: SplatRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let raf = 0;

    const init = async () => {
      let SparkRenderer: unknown;
      let SplatMesh: unknown;
      try {
        const spark = await import('@sparkjsdev/spark');
        SparkRenderer = (spark as Record<string, unknown>).SparkRenderer;
        SplatMesh = (spark as Record<string, unknown>).SplatMesh;
      } catch (err) {
        console.warn('[3Dme] Spark failed to load — splat mode unavailable', err);
        return;
      }
      if (disposed || !SparkRenderer || !SplatMesh) return;

      const { clientWidth: w, clientHeight: h } = container;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.set(0, 0, 4);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(w, h);
      container.appendChild(renderer.domElement);

      const sparkCtor = SparkRenderer as new (args: { renderer: THREE.WebGLRenderer }) => THREE.Object3D;
      const sparkInstance = new sparkCtor({ renderer });
      scene.add(sparkInstance);

      const meshCtor = SplatMesh as new (args: { url: string }) => THREE.Object3D;
      const mesh = new meshCtor({ url });
      scene.add(mesh);

      const tick = () => {
        if (disposed) return;
        mesh.rotation.y += 0.002;
        renderer!.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      const handleResize = () => {
        if (!renderer) return;
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    };
    const cleanup = init();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      void cleanup;
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [url]);

  return <div ref={containerRef} className={className} />;
};
```

- [ ] **Step 2: RendererSwitcher**

Create `frontend/src/components/renderers/RendererSwitcher.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { SplatRenderer } from './SplatRenderer';
import UltimateParticles from '@/components/particles/UltimateParticles';

export const RendererSwitcher = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const splatUrl = useSceneStore((s) => s.generation.splatUrl);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);

  if (mode === 'splat' && splatUrl) {
    return <SplatRenderer url={splatUrl} className="h-full w-full" />;
  }
  return <UltimateParticles imageUrl={glbUrl ?? undefined} />;
};
```

Note: `UltimateParticles` current prop shape may differ. Read `frontend/src/components/particles/UltimateParticles.tsx` and adjust the props to whatever it actually accepts — pass the most sensible current-code-compatible subset. The point here is to keep the existing particles rendering path alive.

- [ ] **Step 3: Typecheck**

```bash
cd frontend && npm run typecheck
```
If typecheck fails because `UltimateParticles` takes different props, open the file, read its prop type, and adjust `RendererSwitcher.tsx` accordingly. Do not modify `UltimateParticles.tsx`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/renderers/SplatRenderer.tsx frontend/src/components/renderers/RendererSwitcher.tsx && \
  git commit -m "feat(renderers): add SplatRenderer and RendererSwitcher"
```

---

## Task 12: `GizmoOverlay` + `CanvasViewport`

**Files:** `frontend/src/components/studio/{GizmoOverlay,CanvasViewport}.tsx`

- [ ] **Step 1: GizmoOverlay**

Create `frontend/src/components/studio/GizmoOverlay.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';

export const GizmoOverlay = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const count = useSceneStore((s) => s.scene.particles.count);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-sm bg-surface-0/70 backdrop-blur border border-border-subtle px-2 py-1 text-2xs font-mono text-white/70">
        <span className="uppercase tracking-wider">{mode}</span>
        <span className="text-white/30">·</span>
        <span className="tabular-nums">{count.toLocaleString()} pts</span>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: CanvasViewport**

Create `frontend/src/components/studio/CanvasViewport.tsx`:
```tsx
import { RendererSwitcher } from '@/components/renderers/RendererSwitcher';
import { GizmoOverlay } from './GizmoOverlay';
import { EmptyState } from './EmptyState';

export const CanvasViewport = () => (
  <div className="relative flex-1 bg-surface-0 overflow-hidden">
    <RendererSwitcher />
    <GizmoOverlay />
    <EmptyState />
  </div>
);
```

- [ ] **Step 3: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/GizmoOverlay.tsx frontend/src/components/studio/CanvasViewport.tsx && \
  git commit -m "feat(studio): add CanvasViewport with gizmos and empty state"
```

---

## Task 13: Right-rail panels — migrate from ControlPanel

**Files:** `frontend/src/components/studio/panels/{Particles,Material,Physics,Post,Animation}Panel.tsx`

- [ ] **Step 1: Read existing ControlPanel**

```bash
cat frontend/src/components/controls/ControlPanel.tsx | head -200
```

Note which store-like prop keys it currently uses. You will migrate those controls to use `sceneStore` selectors.

- [ ] **Step 2: ParticlesPanel**

Create `frontend/src/components/studio/panels/ParticlesPanel.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { NumberField, Select } from '@/components/ui';

export const ParticlesPanel = () => {
  const p = useSceneStore((s) => s.scene.particles);
  const update = useSceneStore((s) => s.updateParticles);

  return (
    <div className="space-y-3">
      <NumberField label="count" value={p.count} onChange={(v) => update({ count: v })} min={1000} max={2_000_000} step={10_000} suffix="pts" />
      <NumberField label="size" value={p.size} onChange={(v) => update({ size: v })} min={0.1} max={10} step={0.1} />
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">shape</span>
        <Select value={p.shape} onChange={(e) => update({ shape: e.target.value as typeof p.shape })}>
          <option value="mesh">From mesh</option>
          <option value="sphere">Sphere</option>
          <option value="galaxy">Galaxy</option>
          <option value="star">Star</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">color mode</span>
        <Select value={p.colorMode} onChange={(e) => update({ colorMode: e.target.value as typeof p.colorMode })}>
          <option value="image">Sample image</option>
          <option value="gradient">Gradient</option>
          <option value="solid">Solid</option>
        </Select>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: MaterialPanel**

Create `frontend/src/components/studio/panels/MaterialPanel.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { NumberField } from '@/components/ui';

export const MaterialPanel = () => {
  const m = useSceneStore((s) => s.scene.material);
  const update = useSceneStore((s) => s.updateMaterial);
  return (
    <div className="space-y-3">
      <NumberField label="exposure" value={m.exposure} onChange={(v) => update({ exposure: v })} min={0} max={4} step={0.05} />
      <NumberField label="splat scale" value={m.splatScale} onChange={(v) => update({ splatScale: v })} min={0.1} max={4} step={0.05} />
      <NumberField label="opacity cutoff" value={m.opacityCutoff} onChange={(v) => update({ opacityCutoff: v })} min={0} max={1} step={0.005} />
      <NumberField label="emissive" value={m.emissive} onChange={(v) => update({ emissive: v })} min={0} max={2} step={0.05} />
      <NumberField label="fresnel" value={m.fresnel} onChange={(v) => update({ fresnel: v })} min={0} max={1} step={0.01} />
    </div>
  );
};
```

- [ ] **Step 4: PhysicsPanel**

Create `frontend/src/components/studio/panels/PhysicsPanel.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { NumberField, Select } from '@/components/ui';

export const PhysicsPanel = () => {
  const p = useSceneStore((s) => s.scene.physics);
  const update = useSceneStore((s) => s.updatePhysics);
  return (
    <div className="space-y-3">
      <NumberField label="mouse gravity" value={p.mouseGravity} onChange={(v) => update({ mouseGravity: v })} min={0} max={4} step={0.05} />
      <NumberField label="mouse radius" value={p.mouseRadius} onChange={(v) => update({ mouseRadius: v })} min={0.1} max={8} step={0.1} />
      <NumberField label="turbulence" value={p.turbulence} onChange={(v) => update({ turbulence: v })} min={0} max={2} step={0.02} />
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">attractor</span>
        <Select value={p.attractor} onChange={(e) => update({ attractor: e.target.value as typeof p.attractor })}>
          <option value="none">None</option>
          <option value="lorenz">Lorenz</option>
          <option value="aizawa">Aizawa</option>
          <option value="chen">Chen</option>
        </Select>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: PostPanel**

Create `frontend/src/components/studio/panels/PostPanel.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { NumberField } from '@/components/ui';

export const PostPanel = () => {
  const p = useSceneStore((s) => s.scene.post);
  const update = useSceneStore((s) => s.updatePost);
  return (
    <div className="space-y-3">
      <NumberField label="bloom" value={p.bloom} onChange={(v) => update({ bloom: v })} min={0} max={3} step={0.05} />
      <NumberField label="chromatic" value={p.chromaticAberration} onChange={(v) => update({ chromaticAberration: v })} min={0} max={0.2} step={0.005} />
      <NumberField label="vignette" value={p.vignette} onChange={(v) => update({ vignette: v })} min={0} max={1} step={0.02} />
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={p.dof} onChange={(e) => update({ dof: e.target.checked })} />
        Depth of field
      </label>
    </div>
  );
};
```

- [ ] **Step 6: AnimationPanel (placeholder wrapping existing controls)**

Create `frontend/src/components/studio/panels/AnimationPanel.tsx`:
```tsx
export const AnimationPanel = () => (
  <div className="space-y-2 text-sm text-white/60">
    <p>Animation timeline lives in the bottom transport.</p>
    <p className="text-2xs text-white/40">Theatre.js keyframes are preserved across mode switches.</p>
  </div>
);
```

- [ ] **Step 7: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/panels && \
  git commit -m "feat(studio): add Particles/Material/Physics/Post/Animation panels wired to scene store"
```

---

## Task 14: Left-rail panels

**Files:** `frontend/src/components/studio/panels/{Scene,Library,AI}Panel.tsx`

- [ ] **Step 1: ScenePanel**

Create `frontend/src/components/studio/panels/ScenePanel.tsx`:
```tsx
import { Camera, Box, Sun } from 'lucide-react';

export const ScenePanel = () => (
  <ul className="space-y-1 text-sm text-white/70">
    <li className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-2">
      <Camera className="h-3.5 w-3.5 text-white/40" />Camera
    </li>
    <li className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-2">
      <Sun className="h-3.5 w-3.5 text-white/40" />Lighting
    </li>
    <li className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-2">
      <Box className="h-3.5 w-3.5 text-white/40" />Subject
    </li>
  </ul>
);
```

- [ ] **Step 2: LibraryPanel**

Create `frontend/src/components/studio/panels/LibraryPanel.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';

const PRESETS = [
  { id: 'galaxy', label: 'Milky Way', prompt: 'A realistic spiral galaxy with visible dust lanes and bright core' },
  { id: 'dragon', label: 'Ice Dragon', prompt: 'An ancient ice dragon carved from blue obsidian, volumetric fog' },
  { id: 'jellyfish', label: 'Jellyfish', prompt: 'A translucent bioluminescent jellyfish drifting in dark water' },
  { id: 'mech', label: 'Mech', prompt: 'A battle-worn mecha with intricate armor and glowing core' },
];

export const LibraryPanel = () => {
  const setPrompt = useSceneStore((s) => s.setPrompt);
  return (
    <ul className="space-y-1">
      {PRESETS.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => setPrompt(p.prompt)}
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-white/70 hover:bg-surface-2 hover:text-white transition-colors duration-fast"
          >
            {p.label}
          </button>
        </li>
      ))}
    </ul>
  );
};
```

- [ ] **Step 3: AIPanel**

Create `frontend/src/components/studio/panels/AIPanel.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { QualityLadder } from '../generation/QualityLadder';
import { VariantPicker } from '../generation/VariantPicker';

export const AIPanel = () => {
  const enhanced = useSceneStore((s) => s.generation.enhancedPrompt);
  const cost = useSceneStore((s) => s.generation.costUsd);
  const variants = useSceneStore((s) => s.generation.variants);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-2xs uppercase tracking-wider text-white/40">quality tier</span>
        <QualityLadder />
      </div>
      {enhanced && (
        <div className="space-y-1">
          <span className="text-2xs uppercase tracking-wider text-white/40">enhanced prompt</span>
          <p className="text-xs text-white/60 leading-relaxed">{enhanced}</p>
        </div>
      )}
      {variants.length > 0 && (
        <div className="space-y-2">
          <span className="text-2xs uppercase tracking-wider text-white/40">variants</span>
          <VariantPicker />
        </div>
      )}
      <div className="flex items-center justify-between text-2xs text-white/50">
        <span>Session cost</span>
        <span className="font-mono tabular-nums text-white/80">${cost.toFixed(3)}</span>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/panels/ScenePanel.tsx frontend/src/components/studio/panels/LibraryPanel.tsx frontend/src/components/studio/panels/AIPanel.tsx && \
  git commit -m "feat(studio): add Scene, Library, AI panels"
```

---

## Task 15: `LeftRail` and `RightRail`

**Files:** `frontend/src/components/studio/{LeftRail,RightRail}.tsx`

- [ ] **Step 1: LeftRail**

Create `frontend/src/components/studio/LeftRail.tsx`:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { ScenePanel } from './panels/ScenePanel';
import { LibraryPanel } from './panels/LibraryPanel';
import { AIPanel } from './panels/AIPanel';

export const LeftRail = () => (
  <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-border-subtle bg-surface-1 backdrop-blur-md">
    <Tabs defaultValue="ai" className="flex h-full flex-col">
      <TabsList className="m-2">
        <TabsTrigger value="scene">Scene</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="ai">AI</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto p-3">
        <TabsContent value="scene"><ScenePanel /></TabsContent>
        <TabsContent value="library"><LibraryPanel /></TabsContent>
        <TabsContent value="ai"><AIPanel /></TabsContent>
      </div>
    </Tabs>
  </aside>
);
```

- [ ] **Step 2: RightRail**

Create `frontend/src/components/studio/RightRail.tsx`:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { ParticlesPanel } from './panels/ParticlesPanel';
import { MaterialPanel } from './panels/MaterialPanel';
import { PhysicsPanel } from './panels/PhysicsPanel';
import { PostPanel } from './panels/PostPanel';
import { AnimationPanel } from './panels/AnimationPanel';

export const RightRail = () => (
  <aside className="hidden md:flex w-[320px] shrink-0 flex-col border-l border-border-subtle bg-surface-1 backdrop-blur-md">
    <Tabs defaultValue="particles" className="flex h-full flex-col">
      <TabsList className="m-2">
        <TabsTrigger value="particles">Particles</TabsTrigger>
        <TabsTrigger value="material">Material</TabsTrigger>
        <TabsTrigger value="physics">Physics</TabsTrigger>
        <TabsTrigger value="post">Post</TabsTrigger>
        <TabsTrigger value="anim">Anim</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto p-3">
        <TabsContent value="particles"><ParticlesPanel /></TabsContent>
        <TabsContent value="material"><MaterialPanel /></TabsContent>
        <TabsContent value="physics"><PhysicsPanel /></TabsContent>
        <TabsContent value="post"><PostPanel /></TabsContent>
        <TabsContent value="anim"><AnimationPanel /></TabsContent>
      </div>
    </Tabs>
  </aside>
);
```

- [ ] **Step 3: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/LeftRail.tsx frontend/src/components/studio/RightRail.tsx && \
  git commit -m "feat(studio): add LeftRail and RightRail"
```

---

## Task 16: `TopBar` + `ShareDialog`

**Files:** `frontend/src/components/studio/{TopBar,ShareDialog}.tsx`

- [ ] **Step 1: ShareDialog**

Create `frontend/src/components/studio/ShareDialog.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, Button, Input } from '@/components/ui';
import { useSceneStore } from '@/stores/sceneStore';

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareDialog = ({ open, onOpenChange }: ShareDialogProps) => {
  const toHash = useSceneStore((s) => s.toHash);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (!open) return '';
    return `${window.location.origin}/studio#${toHash()}`;
  }, [open, toHash]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Share URL copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Share scene" description="Anyone with this URL opens the exact scene.">
        <div className="space-y-3">
          <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <Button onClick={copy} className="w-full" leading={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
            {copied ? 'Copied' : 'Copy URL'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 2: TopBar**

Create `frontend/src/components/studio/TopBar.tsx`:
```tsx
import { useState } from 'react';
import { Sparkles, Share2, Download, Undo2, Redo2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { IconButton, Tooltip, Button } from '@/components/ui';
import { ModeToggle } from './ModeToggle';
import { ShareDialog } from './ShareDialog';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const TopBar = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const status = useSceneStore((s) => s.generation.status);
  const cost = useSceneStore((s) => s.generation.costUsd);

  useKeyboardShortcut('s', () => setShareOpen(true), { meta: true, shift: true });

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-1 backdrop-blur-md px-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-primary" />
        <span className="font-semibold text-sm text-white">3Dme</span>
        <span className="hidden md:inline text-2xs text-white/40 ml-2">Untitled scene</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 p-0.5">
          <Tooltip content="Undo ⌘Z"><IconButton icon={<Undo2 />} label="Undo" size="sm" /></Tooltip>
          <Tooltip content="Redo ⌘⇧Z"><IconButton icon={<Redo2 />} label="Redo" size="sm" /></Tooltip>
        </div>
        <span className="text-2xs font-mono text-white/50">
          {status === 'ready' ? 'Ready' : status === 'idle' ? 'Idle' : status}
          <span className="mx-2 text-white/20">·</span>
          ${cost.toFixed(3)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <Tooltip content="Share scene ⌘⇧S">
          <Button variant="secondary" size="sm" leading={<Share2 className="h-3.5 w-3.5" />} onClick={() => setShareOpen(true)}>
            Share
          </Button>
        </Tooltip>
        <Tooltip content="Export">
          <IconButton icon={<Download />} label="Export" variant="solid" size="sm" />
        </Tooltip>
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </header>
  );
};
```

- [ ] **Step 3: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/TopBar.tsx frontend/src/components/studio/ShareDialog.tsx && \
  git commit -m "feat(studio): add TopBar and ShareDialog"
```

---

## Task 17: `BottomTransport`

**Files:** `frontend/src/components/studio/BottomTransport.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/studio/BottomTransport.tsx`:
```tsx
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { IconButton, Slider } from '@/components/ui';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const BottomTransport = () => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);

  useKeyboardShortcut(' ', () => setPlaying((p) => !p));

  return (
    <footer className="flex h-[60px] shrink-0 items-center gap-4 border-t border-border-subtle bg-surface-1 backdrop-blur-md px-4">
      <div className="flex items-center gap-1">
        <IconButton icon={<SkipBack />} label="Previous keyframe" size="sm" />
        <IconButton
          icon={playing ? <Pause /> : <Play />}
          label={playing ? 'Pause' : 'Play'}
          variant="primary"
          size="md"
          onClick={() => setPlaying((p) => !p)}
        />
        <IconButton icon={<SkipForward />} label="Next keyframe" size="sm" />
      </div>
      <Slider value={progress} onValueChange={setProgress} min={0} max={100} className="flex-1" />
      <span className="text-2xs font-mono tabular-nums text-white/50 w-12 text-right">
        {progress[0].toFixed(0)}%
      </span>
    </footer>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/BottomTransport.tsx && \
  git commit -m "feat(studio): add BottomTransport with playback controls"
```

---

## Task 18: `CommandPalette`

**Files:** `frontend/src/components/studio/CommandPalette.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/studio/CommandPalette.tsx`:
```tsx
import { useState } from 'react';
import { Command } from 'cmdk';
import { Sparkles, Share2, Droplet, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useSceneStore } from '@/stores/sceneStore';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const setMode = useSceneStore((s) => s.setMode);
  const resetScene = useSceneStore((s) => s.resetScene);
  const toHash = useSceneStore((s) => s.toHash);
  const { runImageStage } = useGenerationFlow();

  useKeyboardShortcut('k', () => setOpen((v) => !v), { meta: true });

  const close = () => setOpen(false);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command Palette">
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
        onClick={close}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-md bg-surface-1 border border-border shadow-2xl overflow-hidden"
        >
          <Command.Input
            placeholder="Type a command…"
            className="w-full h-11 px-4 bg-transparent border-b border-border-subtle text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <Command.List className="max-h-[320px] overflow-y-auto p-1">
            <Command.Empty className="px-4 py-6 text-center text-xs text-white/40">No commands found.</Command.Empty>
            <Command.Group heading="Generation">
              <Command.Item onSelect={() => { close(); void runImageStage(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2">
                <Sparkles className="h-3.5 w-3.5" /> Generate from current prompt
              </Command.Item>
            </Command.Group>
            <Command.Group heading="View">
              <Command.Item onSelect={() => { setMode('splat'); close(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2">
                <Droplet className="h-3.5 w-3.5" /> Switch to Splat mode
              </Command.Item>
              <Command.Item onSelect={() => { setMode('particles'); close(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2">
                <Play className="h-3.5 w-3.5" /> Switch to Particles mode
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Scene">
              <Command.Item
                onSelect={async () => {
                  await navigator.clipboard.writeText(`${window.location.origin}/studio#${toHash()}`);
                  toast.success('Share URL copied');
                  close();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2"
              >
                <Share2 className="h-3.5 w-3.5" /> Copy share URL
              </Command.Item>
              <Command.Item onSelect={() => { resetScene(); close(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2">
                <RotateCcw className="h-3.5 w-3.5" /> Reset scene
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/CommandPalette.tsx && \
  git commit -m "feat(studio): add ⌘K command palette"
```

---

## Task 19: `StudioShell`

**Files:** `frontend/src/components/studio/StudioShell.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/studio/StudioShell.tsx`:
```tsx
import { TopBar } from './TopBar';
import { LeftRail } from './LeftRail';
import { RightRail } from './RightRail';
import { CanvasViewport } from './CanvasViewport';
import { BottomTransport } from './BottomTransport';
import { CommandPalette } from './CommandPalette';
import { useUrlHashSync } from '@/hooks/useUrlHashSync';

export const StudioShell = () => {
  useUrlHashSync();

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-0 text-white overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftRail />
        <CanvasViewport />
        <RightRail />
      </div>
      <BottomTransport />
      <CommandPalette />
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/StudioShell.tsx && \
  git commit -m "feat(studio): add StudioShell composition"
```

---

## Task 20: Replace `StudioPage` and wire `Toaster`

**Files:** `frontend/src/pages/StudioPage.tsx`, `frontend/src/App.tsx`

- [ ] **Step 1: Backup current StudioPage**

```bash
cp frontend/src/pages/StudioPage.tsx frontend/src/pages/StudioPage.legacy.tsx.bak
```
(Don't commit the backup — it's a local safety net.)

- [ ] **Step 2: Replace StudioPage**

Overwrite `frontend/src/pages/StudioPage.tsx`:
```tsx
import { StudioShell } from '@/components/studio/StudioShell';

export default function StudioPage() {
  return <StudioShell />;
}
```

- [ ] **Step 3: Wire Toaster and TooltipProvider in App.tsx**

Read `frontend/src/App.tsx`. Wrap the routing with `<TooltipProvider>` (from `@/components/ui`) and mount `<Toaster />` at the root. Minimal diff — do not change route definitions other than wrapping them.

- [ ] **Step 4: Typecheck + build**

```bash
cd frontend && npm run typecheck && npm run build
```

- [ ] **Step 5: Dev server smoke**

```bash
cd frontend && (timeout 12 npm run dev >/tmp/3dme-dev.log 2>&1 &) && sleep 8 && tail -30 /tmp/3dme-dev.log
```
Expected: no HMR errors. Visit `http://localhost:5173/studio` should render the new shell (manual verification).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/StudioPage.tsx frontend/src/App.tsx && \
  git commit -m "feat(studio): replace StudioPage with StudioShell and wire Toaster"
```

---

## Task 21: Delete legacy `ControlPanel.tsx`

**Files:** `frontend/src/components/controls/ControlPanel.tsx`

- [ ] **Step 1: Confirm no remaining references**

```bash
cd frontend && grep -R "ControlPanel" src --include="*.tsx" --include="*.ts" | grep -v "ControlPanel.tsx"
```
Expected: no results. If any remain, fix them by removing imports or replacing with `StudioShell` equivalents before deleting.

- [ ] **Step 2: Delete the file**

```bash
rm frontend/src/components/controls/ControlPanel.tsx && \
  rm -f frontend/src/pages/StudioPage.legacy.tsx.bak
```

- [ ] **Step 3: Typecheck + build**

```bash
cd frontend && npm run typecheck && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A frontend/src/components/controls frontend/src/pages && \
  git commit -m "refactor(studio): remove legacy ControlPanel"
```

---

## Task 22: Final verification

- [ ] **Step 1: Test suite**

```bash
cd frontend && npx vitest run
```
Expected: all prior tests plus new hook tests pass.

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```

- [ ] **Step 3: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Dev server manual smoke**

Run dev server. Verify in browser:
- `/studio` renders the new shell (top bar, rails, canvas, transport)
- `/` (Home) still works
- `/dev/ui` still works
- `⌘K` opens the command palette
- `M` toggles Splat/Particles mode
- `/` focuses the prompt bar (if visible in empty state)
- Clicking a preset chip fills the prompt

- [ ] **Step 5: Report — no commit**

---

## Self-Review

- ✅ Spec coverage: docked rails (§Studio layout), mode toggle (§Render pipeline), generation flow (§Data flow), command palette (§Keyboard shortcuts), share URL (§Data flow, §Success criteria), panels tied to scene store (§State management).
- ✅ No placeholders.
- ✅ Type consistency — `RenderMode`, `QualityTier`, `ImageModel` match `sceneStore.types.ts` and `aiService.types.ts`.
- ✅ Each commit leaves app in working state (old ControlPanel stays until Task 21 removes it).

## Deferred

- Audio panel (Plan 4)
- Camera choreography presets (Plan 4)
- LoRA style packs (Plan 4)
- `/dev/ui` remains for design-system review — leave it in
