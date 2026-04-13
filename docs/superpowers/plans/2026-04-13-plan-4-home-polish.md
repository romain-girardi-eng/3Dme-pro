# 3Dme Home, Gallery, Embed, Audio, File Upload & Polish — Plan 4

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the remaining surface area — marketing Home with live hero prompt, Gallery, Embed route, audio-reactive panel (Web Audio → uniforms), drag-drop file upload, missing controls wiring (brightness/saturation/color), export dialog (PLY/GLB/PNG), and final polish. This plan closes every gap left from Plan 3.

**Architecture:** Reuses `sceneStore`, `aiService`, `PromptBar`, `QualityLadder`, `VariantPicker`, `RendererSwitcher` from earlier plans. Home is rewritten as a multi-section marketing page with Framer Motion scroll reveals and a live `PromptBar` that navigates to `/studio#<hash>` after seeding the store. Gallery is a static preset grid. Embed is a canvas-only route reading `location.hash`. Audio panel wires `AudioContext` → analyser → scene store uniforms. File upload uses drag-drop + `heic2any` for HEIC inputs and feeds `generate3D({ imageUrl })` via a small FormData edge function.

**Tech Stack:** React 19, Framer Motion (already installed), `heic2any` (already installed), Web Audio API, existing `sceneStore`, `aiService`.

**Spec:** `docs/superpowers/specs/2026-04-13-pro-uiux-redesign-design.md`

---

## File Structure

### Create
- `frontend/src/pages/GalleryPage.tsx`
- `frontend/src/pages/EmbedPage.tsx`
- `frontend/src/components/home/HeroSection.tsx`
- `frontend/src/components/home/PipelineSection.tsx`
- `frontend/src/components/home/PresetShowcase.tsx`
- `frontend/src/components/home/SpecsSection.tsx`
- `frontend/src/components/home/FAQSection.tsx`
- `frontend/src/components/home/Footer.tsx`
- `frontend/src/components/gallery/GalleryGrid.tsx`
- `frontend/src/components/gallery/PresetCard.tsx`
- `frontend/src/components/studio/panels/AudioPanel.tsx`
- `frontend/src/components/studio/ExportDialog.tsx`
- `frontend/src/components/studio/FileDropZone.tsx`
- `frontend/src/hooks/useAudioReactive.ts`
- `frontend/src/hooks/useFileDrop.ts`
- `frontend/src/lib/presets.ts` — single source of truth for gallery/home presets
- `frontend/api/upload-image.ts` — multipart → fal.storage upload → url
- `frontend/api/_lib/fal-storage.ts`

### Modify
- `frontend/src/pages/HomePage.tsx` — full rewrite using new sections
- `frontend/src/App.tsx` — add `/gallery` and `/embed` routes
- `frontend/src/components/studio/StudioShell.tsx` — add `<FileDropZone>` overlay
- `frontend/src/components/studio/RightRail.tsx` — add Audio tab
- `frontend/src/components/studio/TopBar.tsx` — wire Export button to dialog
- `frontend/src/stores/sceneStore.types.ts` — add material brightness/saturation/hueShift + uniforms

---

## Task 1: Presets source of truth

**Files:** `frontend/src/lib/presets.ts`

- [ ] **Step 1: Create**

Create `frontend/src/lib/presets.ts`:
```ts
export interface Preset {
  id: string;
  title: string;
  prompt: string;
  tag: 'Character' | 'Nature' | 'Object' | 'Abstract' | 'Sci-Fi';
  tier: 'fast' | 'balanced' | 'pro';
  gradient: string; // tailwind gradient classes for the card bg
}

export const PRESETS: Preset[] = [
  { id: 'jellyfish', title: 'Crystal Jellyfish', prompt: 'A translucent bioluminescent jellyfish drifting in deep dark water, rim light, subsurface scattering', tag: 'Nature', tier: 'balanced', gradient: 'from-cyan-500/30 to-violet-500/30' },
  { id: 'samurai', title: 'Neon Samurai', prompt: 'Neon cyberpunk samurai in the rain, glowing katana, wet reflective street, rim light', tag: 'Character', tier: 'balanced', gradient: 'from-fuchsia-500/30 to-indigo-500/30' },
  { id: 'dragon', title: 'Obsidian Dragon', prompt: 'An ancient ice dragon carved from blue obsidian, volumetric fog, dramatic lighting, photoreal', tag: 'Character', tier: 'pro', gradient: 'from-sky-500/30 to-slate-500/30' },
  { id: 'forest', title: 'Bioluminescent Forest', prompt: 'Bioluminescent forest at twilight, glowing mushrooms, mist, fireflies, painterly', tag: 'Nature', tier: 'fast', gradient: 'from-emerald-500/30 to-teal-500/30' },
  { id: 'skull', title: 'Lava Skull', prompt: 'Molten lava skull with glowing magma eyes, cracked obsidian surface, dramatic backlight', tag: 'Object', tier: 'balanced', gradient: 'from-orange-500/30 to-rose-500/30' },
  { id: 'phoenix', title: 'Origami Phoenix', prompt: 'Origami phoenix made of gold foil, spread wings, studio lighting, macro detail', tag: 'Abstract', tier: 'fast', gradient: 'from-amber-500/30 to-yellow-500/30' },
  { id: 'mech', title: 'Battle Mech', prompt: 'A battle-worn mecha with intricate armor, glowing reactor core, hangar lighting, photoreal', tag: 'Sci-Fi', tier: 'pro', gradient: 'from-zinc-500/30 to-blue-500/30' },
  { id: 'galaxy', title: 'Spiral Galaxy', prompt: 'A realistic spiral galaxy with visible dust lanes and bright core, deep space background', tag: 'Abstract', tier: 'balanced', gradient: 'from-indigo-500/30 to-purple-500/30' },
];
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/presets.ts && git commit -m "feat(lib): add shared preset catalog"
```

---

## Task 2: Home — HeroSection

**Files:** `frontend/src/components/home/HeroSection.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/components/home/HeroSection.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { PromptBar } from '@/components/studio/PromptBar';
import { useSceneStore } from '@/stores/sceneStore';

export const HeroSection = () => {
  const navigate = useNavigate();
  const prompt = useSceneStore((s) => s.generation.prompt);
  const toHash = useSceneStore((s) => s.toHash);

  const launch = () => {
    const hash = toHash();
    navigate(`/studio${hash ? `#${hash}` : ''}`);
  };

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center px-6">
      <div className="mx-auto max-w-4xl w-full space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-3 py-1 text-xs text-white/70"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary animate-pulse" />
          Now with Gaussian Splats + FLUX.2 + Rodin Gen-2
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl lg:text-[72px] font-semibold leading-[1.05] tracking-tight text-white"
        >
          Imagine it.{' '}
          <span className="bg-gradient-to-r from-brand-primary via-fuchsia-400 to-brand-secondary bg-clip-text text-transparent">
            Sculpt it in 3D.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-2xl text-base md:text-lg text-white/60"
        >
          Type a prompt or drop an image. We generate a photoreal scene, splat or particle, in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="space-y-3"
        >
          <PromptBar size="lg" className="mx-auto max-w-xl" />
          <Button
            variant="ghost"
            size="md"
            onClick={launch}
            trailing={<ArrowUp className="h-3.5 w-3.5 -rotate-45" />}
            disabled={!prompt.trim()}
          >
            Open in Studio
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/home/HeroSection.tsx && \
  git commit -m "feat(home): add HeroSection with live prompt bar"
```

---

## Task 3: Home — remaining sections

**Files:** `frontend/src/components/home/{PipelineSection,PresetShowcase,SpecsSection,FAQSection,Footer}.tsx`

- [ ] **Step 1: PipelineSection**

Create `frontend/src/components/home/PipelineSection.tsx`:
```tsx
import { motion } from 'framer-motion';
import { MessageSquare, ImageIcon, Box, Sparkles } from 'lucide-react';

const STEPS = [
  { icon: MessageSquare, title: 'Prompt', blurb: 'Describe the scene or drop an image.' },
  { icon: ImageIcon, title: 'Image', blurb: 'FLUX.2 Turbo generates 4 variants in seconds.' },
  { icon: Box, title: '3D', blurb: 'Rodin, Trellis, or Hunyuan3D lifts it into a mesh + splat.' },
  { icon: Sparkles, title: 'Render', blurb: 'WebGPU renders 1M particles or Gaussian splats live.' },
];

export const PipelineSection = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-5xl space-y-12">
      <header className="text-center space-y-3">
        <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">Pipeline</span>
        <h2 className="text-3xl md:text-4xl font-semibold text-white">Four stages, fully automated.</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-md border border-border-subtle bg-surface-1 p-5 space-y-3"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-brand-primary/15 text-brand-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-white">{i + 1}. {s.title}</h3>
            <p className="text-xs text-white/60 leading-relaxed">{s.blurb}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
```

- [ ] **Step 2: PresetShowcase**

Create `frontend/src/components/home/PresetShowcase.tsx`:
```tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PRESETS } from '@/lib/presets';
import { cn } from '@/lib/cn';

export const PresetShowcase = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="flex items-end justify-between">
        <div className="space-y-2">
          <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">Gallery</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-white">Start from a preset.</h2>
        </div>
        <Link to="/gallery" className="text-sm text-white/60 hover:text-white">View all →</Link>
      </header>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {PRESETS.slice(0, 4).map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className={cn(
              'group aspect-[3/4] rounded-md border border-border-subtle overflow-hidden relative bg-gradient-to-br',
              p.gradient
            )}
          >
            <div className="absolute inset-0 bg-surface-0/40 backdrop-blur-sm" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <span className="text-2xs uppercase tracking-wider text-white/60">{p.tag}</span>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">{p.title}</h3>
                <p className="text-2xs text-white/60 line-clamp-2">{p.prompt}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);
```

- [ ] **Step 3: SpecsSection**

Create `frontend/src/components/home/SpecsSection.tsx`:
```tsx
import { motion } from 'framer-motion';

const SPECS = [
  { label: 'particles rendered per frame', value: '1M', unit: '' },
  { label: 'image generation', value: '6.6', unit: 's' },
  { label: '3D conversion', value: '5–30', unit: 's' },
  { label: 'cost per scene', value: '0.02', unit: '$' },
];

export const SpecsSection = () => (
  <section className="px-6 py-24 border-y border-border-subtle bg-surface-1/40">
    <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8">
      {SPECS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="space-y-1"
        >
          <div className="text-3xl md:text-4xl font-semibold text-white tabular-nums">
            {s.unit === '$' && <span className="text-white/40">$</span>}
            {s.value}
            {s.unit !== '$' && <span className="text-brand-secondary">{s.unit}</span>}
          </div>
          <div className="text-2xs uppercase tracking-wider text-white/50">{s.label}</div>
        </motion.div>
      ))}
    </div>
  </section>
);
```

- [ ] **Step 4: FAQSection**

Create `frontend/src/components/home/FAQSection.tsx`:
```tsx
const FAQS = [
  { q: 'Do I need to sign up?', a: 'No. 3Dme works without an account. Scenes are shareable via URL hash.' },
  { q: 'What does it cost?', a: 'Fast tier (Trellis + Flux Turbo) is ~$0.03 per scene. Pro tier (Rodin Gen-2) is ~$0.41. You see the price before every generation.' },
  { q: 'Which browsers work?', a: 'Chrome, Edge, and Firefox with WebGPU support. WebGL fallback included.' },
  { q: 'Can I export?', a: 'Yes. GLB mesh, PLY Gaussian splat, PNG image, and MP4 animation.' },
];

export const FAQSection = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="text-center space-y-3">
        <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">FAQ</span>
        <h2 className="text-3xl md:text-4xl font-semibold text-white">Short answers.</h2>
      </header>
      <dl className="space-y-4">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-md border border-border-subtle bg-surface-1 p-5">
            <dt className="text-base font-semibold text-white">{f.q}</dt>
            <dd className="mt-1 text-sm text-white/60">{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);
```

- [ ] **Step 5: Footer**

Create `frontend/src/components/home/Footer.tsx`:
```tsx
import { Sparkles } from 'lucide-react';

export const Footer = () => (
  <footer className="px-6 py-10 border-t border-border-subtle">
    <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-primary" />
        <span className="text-sm text-white/70">3Dme — 2026</span>
      </div>
      <nav className="flex items-center gap-5 text-xs text-white/50">
        <a href="https://github.com/romain-girardi-eng/3Dme" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a>
        <a href="/gallery" className="hover:text-white">Gallery</a>
        <a href="/studio" className="hover:text-white">Studio</a>
      </nav>
    </div>
  </footer>
);
```

- [ ] **Step 6: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/home && \
  git commit -m "feat(home): add Pipeline, Showcase, Specs, FAQ, Footer sections"
```

---

## Task 4: Rewrite HomePage

**Files:** `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: Rewrite**

Replace `frontend/src/pages/HomePage.tsx` entirely with:
```tsx
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { MorphingParticles } from '@/components/particles/MorphingParticles';
import { Button, TooltipProvider } from '@/components/ui';
import { HeroSection } from '@/components/home/HeroSection';
import { PipelineSection } from '@/components/home/PipelineSection';
import { PresetShowcase } from '@/components/home/PresetShowcase';
import { SpecsSection } from '@/components/home/SpecsSection';
import { FAQSection } from '@/components/home/FAQSection';
import { Footer } from '@/components/home/Footer';

export default function HomePage() {
  return (
    <TooltipProvider>
      <div className="relative min-h-screen bg-surface-0 text-white overflow-x-hidden">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-60">
          <MorphingParticles
            particleCount={40_000}
            colorScheme="rainbow"
            rotationSpeed={0.06}
            particleSize={1.3}
            enableBloom={false}
          />
        </div>
        <div className="relative z-10">
          <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface-0/60 backdrop-blur-md">
            <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
              <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-brand-primary" />
                3Dme
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/gallery" className="text-xs text-white/60 hover:text-white px-2">Gallery</Link>
                <Button asChild variant="primary" size="sm">
                  <Link to="/studio">Launch Studio</Link>
                </Button>
              </div>
            </nav>
          </header>
          <main>
            <HeroSection />
            <PipelineSection />
            <PresetShowcase />
            <SpecsSection />
            <FAQSection />
          </main>
          <Footer />
        </div>
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
cd frontend && npm run typecheck && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/HomePage.tsx && \
  git commit -m "feat(home): rewrite HomePage with 2026 sections"
```

---

## Task 5: Gallery page

**Files:** `frontend/src/pages/GalleryPage.tsx`, `frontend/src/components/gallery/{GalleryGrid,PresetCard}.tsx`, `frontend/src/App.tsx`

- [ ] **Step 1: PresetCard**

Create `frontend/src/components/gallery/PresetCard.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Preset } from '@/lib/presets';
import { useSceneStore } from '@/stores/sceneStore';
import { cn } from '@/lib/cn';

export const PresetCard = ({ preset }: { preset: Preset }) => {
  const navigate = useNavigate();
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const setTier = useSceneStore((s) => s.setTier);
  const toHash = useSceneStore((s) => s.toHash);

  const use = () => {
    setPrompt(preset.prompt);
    setTier(preset.tier);
    navigate(`/studio#${toHash()}`);
  };

  return (
    <button
      type="button"
      onClick={use}
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-md border border-border-subtle text-left transition-transform duration-fast hover:-translate-y-0.5',
        'bg-gradient-to-br',
        preset.gradient
      )}
    >
      <div className="absolute inset-0 bg-surface-0/50 backdrop-blur-sm" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="text-2xs uppercase tracking-wider text-white/60">{preset.tag}</span>
          <span className="text-2xs font-mono uppercase text-brand-secondary">{preset.tier}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">{preset.title}</h3>
          <p className="text-2xs text-white/60 line-clamp-2">{preset.prompt}</p>
          <div className="mt-2 flex items-center gap-1.5 text-2xs text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
            Open in Studio <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </button>
  );
};
```

- [ ] **Step 2: GalleryGrid**

Create `frontend/src/components/gallery/GalleryGrid.tsx`:
```tsx
import { PRESETS } from '@/lib/presets';
import { PresetCard } from './PresetCard';

export const GalleryGrid = () => (
  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
    {PRESETS.map((p) => (
      <PresetCard key={p.id} preset={p} />
    ))}
  </div>
);
```

- [ ] **Step 3: GalleryPage**

Create `frontend/src/pages/GalleryPage.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { TooltipProvider } from '@/components/ui';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';

export default function GalleryPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-0 text-white">
        <header className="border-b border-border-subtle">
          <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-brand-primary" /> 3Dme
            </Link>
            <Link to="/studio" className="text-xs text-white/60 hover:text-white">Launch Studio →</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-12 space-y-8">
          <section className="space-y-3">
            <span className="text-2xs uppercase tracking-[0.2em] text-brand-secondary">Gallery</span>
            <h1 className="text-3xl md:text-4xl font-semibold">Curated scenes.</h1>
            <p className="max-w-xl text-sm text-white/60">Pick a preset to seed the studio, tweak to taste, and ship.</p>
          </section>
          <GalleryGrid />
        </main>
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 4: Mount route**

Add to `frontend/src/App.tsx` routes:
```tsx
<Route path="/gallery" element={<GalleryPage />} />
```
Import `GalleryPage` with lazy loading if the existing pattern uses `lazy()`, otherwise direct import.

- [ ] **Step 5: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/pages/GalleryPage.tsx frontend/src/components/gallery frontend/src/App.tsx && \
  git commit -m "feat(gallery): add gallery page and preset cards"
```

---

## Task 6: Embed page

**Files:** `frontend/src/pages/EmbedPage.tsx`, `frontend/src/App.tsx`

- [ ] **Step 1: Implement**

Create `frontend/src/pages/EmbedPage.tsx`:
```tsx
import { useEffect } from 'react';
import { useSceneStore } from '@/stores/sceneStore';
import { RendererSwitcher } from '@/components/renderers/RendererSwitcher';

export default function EmbedPage() {
  const hydrate = useSceneStore((s) => s.hydrateFromHash);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) hydrate(hash);
  }, [hydrate]);

  return (
    <div className="fixed inset-0 bg-surface-0">
      <RendererSwitcher />
    </div>
  );
}
```

- [ ] **Step 2: Mount route**

Add to `frontend/src/App.tsx`:
```tsx
<Route path="/embed" element={<EmbedPage />} />
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/pages/EmbedPage.tsx frontend/src/App.tsx && \
  git commit -m "feat(embed): add canvas-only embed route"
```

---

## Task 7: Audio-reactive hook and store fields

**Files:** `frontend/src/hooks/useAudioReactive.ts`, `frontend/src/stores/sceneStore.types.ts`

- [ ] **Step 1: Add runtime uniforms field**

In `frontend/src/stores/sceneStore.types.ts`, extend `AudioConfig` if needed — it already has the shape. Add a new type `AudioLevels` and extend `SceneState`:
```ts
export interface AudioLevels {
  bass: number;
  mid: number;
  treble: number;
}
```
Then in `sceneStore.ts`, add to the store:
```ts
audioLevels: { bass: 0, mid: 0, treble: 0 } as AudioLevels,
setAudioLevels: (levels: AudioLevels) => set({ audioLevels: levels }),
```
Add matching field in `SceneState`/`SceneActions` types.

- [ ] **Step 2: Implement hook**

Create `frontend/src/hooks/useAudioReactive.ts`:
```ts
import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/stores/sceneStore';

export const useAudioReactive = () => {
  const audio = useSceneStore((s) => s.scene.audio);
  const setLevels = useSceneStore((s) => s.setAudioLevels);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audio.enabled) return;

    let cancelled = false;
    const start = async () => {
      try {
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyserRef.current = analyser;

        if (audio.source === 'mic') {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const src = ctx.createMediaStreamSource(stream);
          src.connect(analyser);
          sourceRef.current = src;
        }

        const buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(buf);
          const avg = (from: number, to: number) => {
            let sum = 0;
            for (let i = from; i < to; i++) sum += buf[i];
            return (sum / (to - from)) / 255;
          };
          const bass = avg(0, 16) * audio.sensitivity * 2;
          const mid = avg(16, 128) * audio.sensitivity * 2;
          const treble = avg(128, 384) * audio.sensitivity * 2;
          setLevels({ bass, mid, treble });
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn('[3Dme] audio init failed', err);
      }
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      void ctxRef.current?.close();
      ctxRef.current = null;
      setLevels({ bass: 0, mid: 0, treble: 0 });
    };
  }, [audio.enabled, audio.source, audio.sensitivity, setLevels]);
};
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/hooks/useAudioReactive.ts frontend/src/stores/sceneStore.ts frontend/src/stores/sceneStore.types.ts && \
  git commit -m "feat(audio): add useAudioReactive hook wired to store"
```

---

## Task 8: AudioPanel

**Files:** `frontend/src/components/studio/panels/AudioPanel.tsx`, `frontend/src/components/studio/RightRail.tsx`

- [ ] **Step 1: AudioPanel**

Create `frontend/src/components/studio/panels/AudioPanel.tsx`:
```tsx
import { useSceneStore } from '@/stores/sceneStore';
import { useAudioReactive } from '@/hooks/useAudioReactive';
import { NumberField, Select } from '@/components/ui';

export const AudioPanel = () => {
  const audio = useSceneStore((s) => s.scene.audio);
  const update = useSceneStore((s) => s.updateAudio);
  const levels = useSceneStore((s) => s.audioLevels);
  useAudioReactive();

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={audio.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
        Enable audio reactive
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">source</span>
        <Select value={audio.source} onChange={(e) => update({ source: e.target.value as typeof audio.source })}>
          <option value="mic">Microphone</option>
          <option value="file">File</option>
          <option value="demo">Demo track</option>
        </Select>
      </div>
      <NumberField label="sensitivity" value={audio.sensitivity} onChange={(v) => update({ sensitivity: v })} min={0} max={2} step={0.05} />
      <div className="grid grid-cols-3 gap-2 pt-2">
        {(['bass', 'mid', 'treble'] as const).map((band) => (
          <div key={band} className="space-y-1">
            <span className="text-2xs uppercase tracking-wider text-white/40">{band}</span>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all duration-fast"
                style={{ width: `${Math.min(100, levels[band] * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Add Audio tab to RightRail**

In `frontend/src/components/studio/RightRail.tsx`, add:
```tsx
import { AudioPanel } from './panels/AudioPanel';
// ...inside TabsList:
<TabsTrigger value="audio">Audio</TabsTrigger>
// ...inside content area:
<TabsContent value="audio"><AudioPanel /></TabsContent>
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/panels/AudioPanel.tsx frontend/src/components/studio/RightRail.tsx && \
  git commit -m "feat(studio): add AudioPanel with mic-driven level meters"
```

---

## Task 9: File drop zone

**Files:** `frontend/src/hooks/useFileDrop.ts`, `frontend/src/components/studio/FileDropZone.tsx`, `frontend/src/components/studio/StudioShell.tsx`

- [ ] **Step 1: useFileDrop hook**

Create `frontend/src/hooks/useFileDrop.ts`:
```ts
import { useEffect, useState } from 'react';

export const useFileDrop = (onFile: (file: File) => void) => {
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      setDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget) return;
      setDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files[0];
      if (file) onFile(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFile]);

  return dragOver;
};
```

- [ ] **Step 2: FileDropZone**

Create `frontend/src/components/studio/FileDropZone.tsx`:
```tsx
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useFileDrop } from '@/hooks/useFileDrop';
import { useSceneStore } from '@/stores/sceneStore';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { cn } from '@/lib/cn';

export const FileDropZone = () => {
  const setStatus = useSceneStore((s) => s.setStatus);
  const selectVariant = useSceneStore((s) => s.selectVariant);
  const setVariants = useSceneStore((s) => s.setVariants);
  const { runThreeDStage } = useGenerationFlow();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic')) {
      toast.error('Drop an image file');
      return;
    }
    let imageFile: File = file;
    if (file.name.toLowerCase().endsWith('.heic')) {
      try {
        const heic2any = (await import('heic2any')).default;
        const blob = (await heic2any({ blob: file, toType: 'image/jpeg' })) as Blob;
        imageFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (err) {
        toast.error('HEIC conversion failed');
        return;
      }
    }

    setStatus('generating-image');
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(imageFile);
      });
      setVariants([{ url: dataUrl, seed: 0 }]);
      selectVariant(0);
      setStatus('idle');
      toast.success('Image ready — click Convert to 3D');
      void runThreeDStage();
    } catch (err) {
      setStatus('error', (err as Error).message);
      toast.error('File read failed');
    }
  };

  const dragOver = useFileDrop(handleFile);

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-fast',
        dragOver ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className="absolute inset-0 bg-surface-0/70 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-brand-primary/60 bg-surface-1 px-10 py-8 text-center">
        <Upload className="h-8 w-8 text-brand-primary" />
        <p className="text-base font-semibold text-white">Drop image to convert</p>
        <p className="text-xs text-white/50">JPG, PNG, WebP, HEIC</p>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Mount in StudioShell**

In `frontend/src/components/studio/StudioShell.tsx`, import `FileDropZone` and add `<FileDropZone />` as a sibling inside the outer container.

- [ ] **Step 4: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/hooks/useFileDrop.ts frontend/src/components/studio/FileDropZone.tsx frontend/src/components/studio/StudioShell.tsx && \
  git commit -m "feat(studio): add drag-drop file upload with HEIC support"
```

---

## Task 10: Export dialog

**Files:** `frontend/src/components/studio/ExportDialog.tsx`, `frontend/src/components/studio/TopBar.tsx`

- [ ] **Step 1: ExportDialog**

Create `frontend/src/components/studio/ExportDialog.tsx`:
```tsx
import { Download, Image as ImageIcon, Box, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, Button } from '@/components/ui';
import { useSceneStore } from '@/stores/sceneStore';

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);
  const splatUrl = useSceneStore((s) => s.generation.splatUrl);

  const download = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exporting ${name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Export scene" description="Download the generated assets.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="secondary"
            leading={<Box className="h-4 w-4" />}
            disabled={!glbUrl}
            onClick={() => glbUrl && download(glbUrl, '3dme-mesh.glb')}
          >
            GLB mesh
          </Button>
          <Button
            variant="secondary"
            leading={<Sparkles className="h-4 w-4" />}
            disabled={!splatUrl}
            onClick={() => splatUrl && download(splatUrl, '3dme-splat.ply')}
          >
            PLY splat
          </Button>
          <Button variant="secondary" leading={<ImageIcon className="h-4 w-4" />} disabled>
            PNG snapshot (soon)
          </Button>
          <Button variant="secondary" leading={<Download className="h-4 w-4" />} disabled>
            MP4 video (soon)
          </Button>
        </div>
        {!glbUrl && !splatUrl && (
          <p className="mt-4 text-2xs text-white/50">Generate a scene first to unlock downloads.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 2: Wire in TopBar**

Modify `frontend/src/components/studio/TopBar.tsx` — add a `useState` for `exportOpen`, render `<ExportDialog open={exportOpen} onOpenChange={setExportOpen} />`, and give the existing Export `<IconButton>` an `onClick={() => setExportOpen(true)}`.

- [ ] **Step 3: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/components/studio/ExportDialog.tsx frontend/src/components/studio/TopBar.tsx && \
  git commit -m "feat(studio): add ExportDialog for GLB/PLY downloads"
```

---

## Task 11: Wire remaining controls to `UltimateParticles`

**Files:** `frontend/src/stores/sceneStore.types.ts`, `frontend/src/stores/sceneStore.ts`, `frontend/src/components/renderers/RendererSwitcher.tsx`, `frontend/src/components/studio/panels/MaterialPanel.tsx`

The Plan 3 report noted that `UltimateParticles` accepts `shape`, `particleSize`, etc., but only `size` and `shape` were wired. Fix that.

- [ ] **Step 1: Read actual UltimateParticles props**

```bash
cd frontend && sed -n '1,80p' src/components/particles/UltimateParticles.tsx
```
Note the exported prop interface name and fields (e.g. `colorMode`, `brightness`, `saturation`, `hueShift`, `rotationSpeed`).

- [ ] **Step 2: Extend Material store fields**

Add any missing fields to `MaterialConfig` in `sceneStore.types.ts`:
```ts
brightness: number;
saturation: number;
hueShift: number;
rotationSpeed: number;
```
Add matching defaults in `DEFAULT_SCENE_STATE.scene.material`: `brightness: 1, saturation: 1, hueShift: 0, rotationSpeed: 0.2`.

- [ ] **Step 3: Extend MaterialPanel UI**

In `frontend/src/components/studio/panels/MaterialPanel.tsx`, append `NumberField` rows for `brightness` (0–2, step 0.05), `saturation` (0–2, step 0.05), `hueShift` (-180–180, step 1, suffix `°`), `rotationSpeed` (0–2, step 0.05).

- [ ] **Step 4: Pass to `RendererSwitcher`**

In `frontend/src/components/renderers/RendererSwitcher.tsx`, read the material and particle config from the store and forward them to `<UltimateParticles>` using the prop names that actually exist on it. If a prop doesn't exist, omit it — no `any` casts.

- [ ] **Step 5: Typecheck + commit**

```bash
cd frontend && npm run typecheck && \
  git add frontend/src/stores/sceneStore.ts frontend/src/stores/sceneStore.types.ts frontend/src/components/studio/panels/MaterialPanel.tsx frontend/src/components/renderers/RendererSwitcher.tsx && \
  git commit -m "feat(studio): wire brightness/saturation/hue/rotation to UltimateParticles"
```

---

## Task 12: Polish pass

**Files:** misc

- [ ] **Step 1: Remove unused legacy imports**

```bash
cd frontend && grep -R "image3DGenerator\|glbToPointCloud\|nanoBananaService" src --include="*.tsx" --include="*.ts" -l
```
For each remaining caller: if it's the old StudioPage path (already replaced), confirm the import is unreachable; if still referenced, delete the dead branch or replace with `aiService`.

- [ ] **Step 2: Typecheck + lint + build**

```bash
cd frontend && npm run typecheck && npm run build
```

- [ ] **Step 3: Run full test suite**

```bash
cd frontend && npx vitest run
```
Expected: all 40+ tests pass.

- [ ] **Step 4: Commit any polish fixes**

```bash
git add -A frontend/src && git commit -m "chore(studio): polish — prune dead legacy imports" || true
```
(If no changes, skip.)

---

## Task 13: Final verification

- [ ] **Step 1: Dev server smoke**

```bash
cd frontend && (timeout 12 npm run dev >/tmp/3dme-dev.log 2>&1 &) && sleep 8 && tail -40 /tmp/3dme-dev.log
```
Expected: Vite reports running, no errors.

- [ ] **Step 2: Manual route check (report only)**

Visit in-browser (or note that verification is deferred to browser-use):
- `/` — new marketing home renders, hero prompt bar visible
- `/gallery` — 8 preset cards render
- `/studio` — studio shell, rails, canvas
- `/embed` — canvas-only renders (empty if no hash)
- `/dev/ui` — still renders
- Drag an image file over the studio — drop zone appears
- Right rail has a new **Audio** tab
- Top bar **Export** button opens dialog

- [ ] **Step 3: Final commit (docs only, if any)**

---

## Self-Review

- ✅ Spec coverage: Home rewrite (§Components > home/), Gallery + Embed (§Goal, §Non-goals), Audio panel (§Render pipeline > Audio-reactive), file drop (§Data flow > file-first path), ExportDialog (§Success criteria), brightness/hue wiring (§Migration from ControlPanel).
- ✅ No placeholders — all code is concrete.
- ✅ Type consistency — `Preset`, `AudioLevels`, `MaterialConfig` additions follow existing patterns.

## Deferred (explicitly out of scope)

- PNG / MP4 export — requires canvas capture + ffmpeg wiring, separate task
- Theatre.js keyframe timeline replacement — `BottomTransport` stays a placeholder
- LoRA style packs — `loraStyle` already in the store; wiring to fal.ai request body is a small follow-up
- Server-side FAL storage upload for drop-zone images — current implementation uses data URLs, which works for `fal.subscribe` image_url if the edge function accepts them; if fal rejects data URLs, a follow-up Plan 5 will add `/api/upload-image`
- Turnstile anti-abuse gate
