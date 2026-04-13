# 3Dme — Pro UI/UX Redesign (v2, 2026-state-of-the-art)

**Date:** 2026-04-13
**Status:** Design approved, pending spec review
**Owner:** Romain

## Goal

Reposition 3Dme as the 2026 standard for creative AI-to-3D. End-to-end redesign of Home, Studio, and Gallery; move from Puter.js/HF Spaces to a **fal.ai + Vercel AI SDK v6** stack; upgrade the render pipeline from point-sampled meshes to **3D Gaussian Splatting + GPGPU particles** with a mode toggle; make scenes shareable and embeddable.

## Success criteria

- Studio reads as a pro creative DCC (docked rails, command palette, keyboard shortcuts), not a tech demo.
- Default generation pipeline ≤ 10s total (Flux 2 Turbo 6.6s → Trellis 5s).
- No API keys in the client bundle. All provider traffic routed through Vercel Edge Functions.
- Splat ↔ Particles mode toggle in the canvas. Both renderers working, switchable live.
- Every generation produces a **shareable URL** that reopens the exact scene.
- Any scene embeddable as `/embed/#<hash>` iframe.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95 on Home.

## Non-goals

- User accounts, auth, saved projects (stateless; shareable URLs instead).
- Real-time multi-user collaboration.
- Backend Python service — current `backend/` stays untouched.
- Prompt history with server-side persistence (localStorage only).

## Architecture

### High-level

```
Browser (React 19 + Vite + WebGPU)
  ├─ Home        → Framer-grade marketing + live hero prompt
  ├─ Studio      → Docked-rail workspace (canvas + rails + cmd palette)
  ├─ Gallery     → Preset grid
  └─ Embed       → Minimal iframe renderer
        │
        ▼  Vercel AI SDK v6 (streamUI, unified providers)
Vercel Edge Functions `/api/*`
  ├─ /api/enhance-prompt    Gemini / Cerebras — prompt rewriting
  ├─ /api/generate-image    fal.ai FLUX.2 Turbo / Pro / Dev (batch 4)
  ├─ /api/generate-3d       fal.ai Trellis / Hunyuan3D v2 / Rodin Gen-2
  └─ /api/stream/:id        SSE stream for progress events
        │  FAL_API_KEY, GOOGLE_API_KEY, CEREBRAS_API_KEY (server-only)
        ▼
Providers
  ├─ fal.ai
  │   ├─ fal-ai/flux-2/turbo      text → image, 6.6s, $0.008
  │   ├─ fal-ai/flux-2-pro        text → image, quality, $0.03/MP
  │   ├─ fal-ai/flux-2            dev + LoRA support
  │   ├─ fal-ai/trellis           image → GLB/splat, $0.02, 5–10s
  │   ├─ fal-ai/hunyuan3d/v2      image → GLB, $0.16, mid-tier
  │   └─ fal-ai/hyper3d/rodin/v2  image/text → PBR GLB, $0.40, pro
  ├─ Google Gemini                prompt enhancement
  └─ Cerebras                     fast prompt enhancement (fallback)
```

### Studio layout

```
┌────────────────────────────────────────────────────────────┐
│ TopBar 48px │ logo • project name • undo/redo • mode toggle (Splat/Particles) • share • export │
├────────┬────────────────────────────────────────┬──────────┤
│LeftRail│ Canvas (WebGPU, fills available space) │RightRail │
│ 280px  │  ┌─────────────────────────────┐       │ 320px    │
│        │  │ Gizmos (axes/fps/cam presets)│      │          │
│ Scene  │  │ Mode badge: SPLAT ● PARTICLES│      │Particles │
│Library │  └─────────────────────────────┘       │Material  │
│  AI    │                                         │Physics   │
│History │                                         │Post      │
│        │                                         │Animation │
│        │                                         │Audio     │
├────────┴────────────────────────────────────────┴──────────┤
│ BottomTransport 60px │ ◀ ▶ ⏵ timeline ● keyframes │ cmd bar │
└────────────────────────────────────────────────────────────┘

⌘K anywhere → command palette overlay
```

## Render pipeline

### Two modes, one pipeline

Generation produces **both** a GLB (for particles) and a Gaussian splat (`.ply`/`.spz`) — Trellis and Rodin both output splats natively. The client stores both and the mode toggle swaps renderers live without re-generating.

**Splat mode**
- Library: [Spark](https://sparkjs.dev/) — Three.js-native Gaussian splat renderer.
- File formats: `.ply`, `.spz`, `.splat`, `.ksplat`.
- Renders in WebGPU when available, WebGL fallback.
- Integrates with existing Three.js scene, lights, post-processing.
- Material panel controls: exposure, spherical harmonics degree, opacity cutoff, splat scale.

**Particles mode (existing, polished)**
- Current `UltimateParticles` GPGPU stack, kept as-is.
- `MeshSurfaceSampler` samples the GLB into point buffers.
- Updates particle physics, color modes, strange attractors, mouse gravity.
- Three.js r183+ compute shader instantiation — moves particle spawning off the CPU.

Mode toggle lives in TopBar + `M` keyboard shortcut. Switching preserves camera, post effects, and animation timeline state.

### Audio-reactive sub-mode

Web Audio API → FFT → uniform buffer → particle physics. Controlled from a new `AudioPanel` in the right rail: source (mic / file upload / demo track), sensitivity, frequency bands mapped to color/turbulence/burst. Works in both Splat and Particles modes.

## Components

### New (`frontend/src/components/`)

**`ui/` — primitives (Radix + Tailwind):**
Button, IconButton, Panel, Tabs, Slider, NumberField (scrub-to-edit), Input, Textarea, Tooltip, Dialog, Sheet, Select, Combobox, ColorPicker, Kbd, CommandPalette.

**`studio/` — shell:**
StudioShell, TopBar, LeftRail, RightRail, BottomTransport, CanvasViewport, GizmoOverlay, EmptyState, GenerationProgress, PromptBar, ModeToggle, ShareDialog, ExportDialog, CommandPalette.

**`studio/panels/`:**
ScenePanel, LibraryPanel, AIPanel (history + enhancer + variants), ParticlesPanel, MaterialPanel (splat-aware), PhysicsPanel, PostPanel, AnimationPanel, AudioPanel (new).

**`studio/generation/`:**
VariantPicker (4-up grid), PromptEnhancerToggle, QualityLadder (Fast/Balanced/Pro selector with price + ETA).

**`renderers/`:**
SplatRenderer (Spark wrapper), ParticleRenderer (existing UltimateParticles refactor), RendererSwitcher (handles live mode swap, preserves camera/state).

**`home/`:**
HeroSection (interactive prompt bar, live splat background), PipelineSection (animated 4-stage diagram), PresetShowcase, SpecsSection, FAQSection, Footer.

**`gallery/`:**
GalleryGrid, PresetCard.

**`embed/`:**
EmbedPage — minimal canvas-only renderer for iframe embedding.

### Refactored/deleted

- `components/controls/ControlPanel.tsx` — decomposed into `studio/panels/*`
- `pages/HomePage.tsx` — rewritten
- `pages/StudioPage.tsx` — thin wrapper around `StudioShell`
- New: `pages/GalleryPage.tsx`, `pages/EmbedPage.tsx`

## State management

**New:** Zustand store `stores/sceneStore.ts`
- Generation state (prompt, variants, selected variant, model choices, progress)
- Scene state (mode, render settings, particle config, material, physics, post, audio)
- History (undo/redo via zundo middleware)
- Serialization: `toUrlHash()` / `fromUrlHash()` for shareable URLs

Single source of truth → URL hash → shareable scenes for free.

## API layer (Vercel Edge Functions)

### Directory

```
api/
  enhance-prompt.ts           POST — Gemini/Cerebras rewrite
  generate-image.ts           POST — Flux 2 Turbo/Pro/Dev + batch
  generate-3d.ts              POST — Trellis/Hunyuan/Rodin
  stream/[id].ts              GET SSE — progress events
  _lib/
    ai-sdk-client.ts          Vercel AI SDK v6 provider setup
    fal-client.ts             fal.ai wrapper with AI SDK
    rate-limit.ts             Upstash KV + Turnstile
    validate.ts               zod schemas
    pricing.ts                cost estimates per model
```

All functions deployed with `runtime: 'edge'`.

### Request contracts

**`POST /api/enhance-prompt`**
```ts
// request
{ prompt: string; style?: 'photoreal' | 'illustration' | 'minimal' | 'cinematic' }
// response
{ enhanced: string; tokens: number }
```

**`POST /api/generate-image`**
```ts
// request
{
  prompt: string;
  model: 'flux-2-turbo' | 'flux-2-pro' | 'flux-2-dev';
  batch?: 1 | 4;             // default 4 for variant picker
  aspectRatio?: '1:1' | '16:9' | '9:16';
  seed?: number;
  loraStyle?: 'cyberpunk' | 'claymation' | 'ink-wash' | 'vaporwave' | 'studio-photo';
}
// response (streaming via SSE)
{ images: Array<{ url: string; seed: number }>; elapsedMs: number; costUsd: number }
```

**`POST /api/generate-3d`**
```ts
// request
{
  imageUrl?: string;         // image → 3D
  prompt?: string;           // text → 3D (Rodin only)
  tier: 'fast' | 'balanced' | 'pro';  // Trellis | Hunyuan3D | Rodin Gen-2
  outputs?: Array<'glb' | 'splat'>;   // default both
}
// response (streaming via SSE)
{
  glbUrl?: string;
  splatUrl?: string;
  elapsedMs: number;
  costUsd: number;
}
```

### Client wrapper

`services/aiService.ts` uses Vercel AI SDK v6:
- `enhancePrompt(prompt, style)`
- `generateImage(prompt, options)` — returns async iterable over SSE events
- `generate3D(imageOrPrompt, tier)` — same pattern
- `cancelGeneration(id)`

### Security & cost

- `FAL_API_KEY`, `GOOGLE_API_KEY`, `CEREBRAS_API_KEY` in Vercel env only.
- Rate limit: 20 gen/min/IP via Upstash KV (available on Vercel Marketplace).
- Turnstile challenge after 10 gens/day/IP.
- Max prompt 500 chars, zod validation.
- **Cost guard:** client shows `$0.XX` preview before any Pro-tier generation. User confirms. This is an anti-foot-gun.

## Data flow (end-to-end)

1. User types prompt in `PromptBar`. Optional: toggle "Enhance" → `POST /api/enhance-prompt`.
2. User picks quality tier (Fast/Balanced/Pro). Inline cost + ETA shown.
3. Client `POST /api/generate-image` with `batch: 4`. SSE stream updates 4-up `VariantPicker` grid as images arrive.
4. User clicks a variant → `POST /api/generate-3d` with `{ imageUrl, tier, outputs: ['glb', 'splat'] }`.
5. SSE stream updates `GenerationProgress` (mesh → textures → splat export).
6. On completion, client receives both URLs. Renderer initialized in current mode.
7. Scene state serialized to URL hash. Share button copies URL.
8. User can toggle Splat/Particles mode freely without regeneration.

## Visual system

### Design tokens (Tailwind extend)

```ts
colors: {
  surface: {
    0: 'rgb(9 9 11)',          // base
    1: 'rgb(24 24 27 / 0.8)',  // panel
    2: 'rgb(39 39 42 / 0.6)',  // elevated
    3: 'rgb(63 63 70 / 0.5)',  // hover
  },
  border: {
    subtle: 'rgb(255 255 255 / 0.05)',
    default: 'rgb(255 255 255 / 0.1)',
    strong: 'rgb(255 255 255 / 0.15)',
  },
  brand: {
    primary: 'rgb(139 92 246)',    // violet-500
    secondary: 'rgb(34 211 238)',  // cyan-400
  },
  signal: {
    success: 'rgb(74 222 128)',
    warning: 'rgb(250 204 21)',
    danger:  'rgb(248 113 113)',
  },
}
```

### Type scale

Display 72/56/48 — home hero
Title 32/24/18 — section headers
Body 14/13 — default UI
Caption/numeric 12/11 — labels, gizmos (Geist Mono)

Fonts: **Inter Variable** (UI), **Geist Mono** (numbers, kbd). Self-hosted via `@fontsource-variable`.

### Motion

- Standard: 150ms ease-out
- Panels: 250ms ease-out
- Hero reveals: spring `{ stiffness: 180, damping: 22 }`
- Respects `prefers-reduced-motion`

### Keyboard shortcuts

| Key | Action |
|---|---|
| `⌘K` | Command palette |
| `/` | Focus prompt |
| `G` | Generate |
| `E` | Export |
| `Space` | Play/pause |
| `M` | Toggle Splat/Particles mode |
| `[` `]` | Prev/next preset |
| `⌘Z` / `⌘⇧Z` | Undo/redo |
| `F` | Frame all |
| `1`–`6` | Right rail tab switcher |
| `⌘⇧S` | Copy shareable URL |
| `?` | Shortcut cheatsheet |

## Error handling

- Provider errors bubble as typed errors (`FalApiError`, `RateLimitError`, `ValidationError`, `InsufficientBudgetError`).
- Client shows inline error with retry + tier-downgrade CTA.
- WebGPU unavailable → existing fallback path + clearer banner.
- Offline → queue generation for retry on reconnect.
- Splat load failure → auto-fallback to GLB mesh + toast.

## Testing

- **Unit (Vitest):** `aiService` with mocked SSE; zod schemas; `sceneStore` serialization round-trips.
- **Component (Vitest + Testing Library):** `PromptBar`, `VariantPicker`, `QualityLadder`, `CommandPalette`, panels.
- **E2E (browser-use agent):** full pipeline test — enhance → generate → pick variant → 3D → toggle mode → export → share URL → reopen. Visual regression screenshots.

## Build sequence

1. **Design tokens + UI primitives** — Tailwind extend, `components/ui/*`, `/dev/ui` review route.
2. **Scene store + URL hash** — Zustand store, serialization, shareable URLs work standalone.
3. **API proxy** — Vercel Edge Functions, AI SDK v6, fal client, rate limit, env wiring. Verified with curl.
4. **`aiService` client** — SSE streaming wrapper. Replaces Puter.js paths.
5. **Studio shell** — `StudioShell`, `TopBar`, rails, transport. Migrate existing `ControlPanel` tabs one at a time.
6. **Renderer layer** — `SplatRenderer` (Spark), `ParticleRenderer` refactor, `RendererSwitcher`, mode toggle.
7. **Generation flow** — `PromptBar`, `QualityLadder`, `VariantPicker`, `GenerationProgress`, prompt enhancer.
8. **Command palette** — `⌘K` fuzzy everything.
9. **Audio panel** — Web Audio FFT → uniform buffer wiring.
10. **Home redesign** — sections, scroll reveals, live hero prompt with real generation.
11. **Gallery + Embed** — preset grid, iframe route.
12. **LoRA style packs + camera choreography presets** (v1.1 if time-boxed).
13. **Browser-use test loop** — automated screenshots + flow tests, iterate.
14. **Polish** — `/polish`, `/audit`, `/critique` skill passes on final build.

## Open questions — resolved

- fal.ai paid API behind proxy: ✅
- Deployment: Vercel
- Scope: full end-to-end incl. Gallery + Embed
- Default tier: Fast (Trellis + Flux Turbo = ~$0.028/gen)
- Pro tier (Rodin Gen-2) gated behind explicit cost confirmation

## Risks

- **Cost overrun** — even with rate limits, determined abuse = real dollars. Mitigation: Upstash KV rate limit, Turnstile after 10 gens/day/IP, per-scene cost cap, daily global budget alarm.
- **Spark integration** — newer library, less battle-tested than Three.js mesh path. Mitigation: ship mode toggle — if splat fails, user falls back to particles seamlessly.
- **Three.js r183+ migration** — existing code may need updates. Mitigation: pin current version, migrate in step 6 behind a flag.
- **Vercel AI SDK v6 + edge cold starts** — first request may be slow. Mitigation: warm-up ping on page load.
- **Audio panel browser permissions** — mic access denied → graceful degrade to file upload only.
- **Migration churn** — ControlPanel.tsx is ~800 lines, complex state. Mitigation: zustand store absorbs state; panels migrated one tab per commit with app always functional.
