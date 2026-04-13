# Control Panel UX Redesign

## Problem Statement

The current control panel has **30+ controls in a single scrollable panel**, leading to:
- Poor discoverability - users can't find controls
- No clear hierarchy - everything feels equally important
- Mixed concerns - visual, physics, animation jumbled together
- Long scroll distance to reach important features
- No workflow guidance

## Design Principles

1. **Progressive Disclosure** - Simple first, advanced on demand
2. **Workflow-Oriented** - Tabs follow natural creative flow
3. **Frequency of Use** - Most-used controls most accessible
4. **Contextual Grouping** - Related controls together
5. **Minimal Scrolling** - Each tab fits without scroll (or minimal)

## New Architecture: 5 Tabs

```
┌─────────────────────────────────────────────────┐
│  🎨    ✨    🎬    🖌️    ⚙️                      │
│ Look Motion Export Paint Settings               │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Tab Content - No/Minimal Scroll]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Tab 1: Look 🎨 (Default)

**Purpose:** Visual appearance - the most frequently used controls

```
┌─────────────────────────────────────┐
│ SHAPE                               │
│ ┌───┬───┬───┬───┬───┬───┬───┬───┐  │
│ │ ○ │ □ │ ◎ │ ♥ │ ★ │ 🧬│ ~ │ 🌀│  │
│ └───┴───┴───┴───┴───┴───┴───┴───┘  │
│                                     │
│ COLOR                               │
│ ┌────┬────┬────┬────┬────┐         │
│ │Orig│Rain│Ocea│Suns│Neo │         │
│ ├────┼────┼────┼────┼────┤         │
│ │Fire│Mtrx│Vel │Pos │Cust│         │
│ └────┴────┴────┴────┴────┘         │
│ [────────────────] Custom picker    │
│                                     │
│ ADJUST           ─────────────────  │
│ Brightness  ████████░░░░  1.2       │
│ Saturation  █████░░░░░░░  0.8       │
│ Hue Shift   ░░░░░░░░░░░░  0°        │
│                                     │
│ PARTICLES        ─────────────────  │
│ Size        ██████░░░░░░  2.0       │
│ Sharpness   ████████░░░░  65%       │
│ Shimmer     ███░░░░░░░░░  0.3       │
│                                     │
│ EFFECTS                             │
│ ☑ Bloom      ████████░░░░  0.6      │
│ ☐ Trails     ░░░░░░░░░░░░  0.85     │
└─────────────────────────────────────┘
```

**Controls:**
- Shape selector (8 icons in grid)
- Color mode (10 options in 2-row grid)
- Custom color picker (conditional)
- Brightness, Saturation, Hue sliders
- Size, Sharpness, Shimmer sliders
- Bloom toggle + intensity
- Trails toggle + length

---

## Tab 2: Motion ✨

**Purpose:** Animation modes and physics simulation

```
┌─────────────────────────────────────┐
│ ANIMATION                           │
│ ┌────┬────┬────┬────┐              │
│ │None│Flot│Wave│Vrtx│              │
│ ├────┼────┼────┼────┤              │
│ │Expl│Impl│Turb│Magn│              │
│ └────┴────┴────┴────┘              │
│                                     │
│ ▼ STRANGE ATTRACTORS (if selected) │
│ ┌────┬────┬────┬────┐              │
│ │Thom│Lorz│Aiza│Halv│              │
│ └────┴────┴────┴────┘              │
│                                     │
│ Speed       █████████░░░  1.5       │
│ Intensity   ██████░░░░░░  1.0       │
│ Rotation    ███░░░░░░░░░  0.1       │
│                                     │
│ PHYSICS          ─────────────────  │
│ ⭐ Shape Memory █████░░░  25%       │
│    Pulls particles back to shape    │
│                                     │
│ Friction    ████████████  0.98      │
│ Gravity     ░░░░░█░░░░░░  0.0       │
│ Turbulence  ███░░░░░░░░░  0.15      │
│                                     │
│ MOUSE FORCE      ─────────────────  │
│ ☑ Enable    Mode: [Repel ▼]         │
│ Force       █████░░░░░░░  2.0       │
│ Radius      ████████░░░░  80        │
│                                     │
│ ▶ Noise Displacement (collapsed)    │
└─────────────────────────────────────┘
```

**Controls:**
- Animation mode grid (8 standard)
- Strange attractors (4 - collapsible when not in use)
- Speed, Intensity, Rotation sliders
- Shape Memory (prominent! key feature)
- Friction, Gravity, Turbulence
- Mouse interaction section
- Noise displacement (collapsible)

---

## Tab 3: Export 🎬

**Purpose:** Animation timeline and video export

```
┌─────────────────────────────────────┐
│ PRESETS                             │
│ ┌─────────┬─────────┬─────────┐    │
│ │ Gentle  │ Cosmic  │ Vortex  │    │
│ │  Float  │  Drift  │  Spin   │    │
│ ├─────────┼─────────┼─────────┤    │
│ │ Breath  │ Fire    │ Custom  │    │
│ │  Pulse  │  Burst  │   +     │    │
│ └─────────┴─────────┴─────────┘    │
│                                     │
│ PLAYBACK         ─────────────────  │
│   ⏮  ▶  ⏹  🔁     00:03 / 00:10   │
│ ═══════════●══════════════════════  │
│                                     │
│ Duration  [  10  ] seconds          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     🎬 EXPORT VIDEO             │ │
│ │     MP4 • WebM • GIF            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ▶ VFX Overlay (collapsed)           │
│   Fire • Explosion • Magic • etc.   │
└─────────────────────────────────────┘
```

**Controls:**
- Preset gallery (visual cards)
- Playback controls (play/pause/stop/loop)
- Timeline scrubber
- Duration input
- Large export button
- VFX overlay (collapsible)

---

## Tab 4: Paint 🖌️

**Purpose:** Region-based effect painting

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │      🖌️ START PAINTING         │ │
│ │      Click to enable            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ REGION                              │
│ ┌───┬───┬───┬───┬───┐              │
│ │ ✗ │ 1 │ 2 │ 3 │ 4 │              │
│ │Era│   │   │   │   │              │
│ └───┴───┴───┴───┴───┘              │
│                                     │
│ Brush Size  █████░░░░░░░  8         │
│                                     │
│ REGION 1 EFFECT    ───────────────  │
│ ┌────┬────┬────┬────┬────┐         │
│ │None│Fire│Puls│Elec│Rain│         │
│ └────┴────┴────┴────┴────┘         │
│ Intensity   █████████░░░  1.5       │
│ Bloom       ██████░░░░░░  1.2x      │
│                                     │
│ STATS              ───────────────  │
│ R1: 12,450  R2: 8,200               │
│ R3: 0       R4: 0                   │
│                                     │
│ 💡 Click and drag on particles      │
│    to paint region effects          │
└─────────────────────────────────────┘
```

**Controls:**
- Big toggle button for paint mode
- Region selector (eraser + 4 regions)
- Brush size slider
- Effect selector per region
- Intensity and bloom per region
- Painted particle stats

---

## Tab 5: Settings ⚙️

**Purpose:** Performance and advanced options

```
┌─────────────────────────────────────┐
│ PERFORMANCE        ───────────────  │
│ Particles   ██████████░░  1,048,576 │
│             65K ─── 1M ─── 4M       │
│ ⚠️ High GPU usage above 1M          │
│                                     │
│ BACKGROUND         ───────────────  │
│ ┌───┬───┬───┬───┬───┐              │
│ │ ■ │ ■ │ ■ │ ■ │ ■ │              │
│ │Blk│Gry│Nvy│Pur│Wht│              │
│ └───┴───┴───┴───┴───┘              │
│                                     │
│ BREATHING          ───────────────  │
│ ☑ Enable                            │
│ Speed       █████░░░░░░░  0.8       │
│ Intensity   ████░░░░░░░░  0.5       │
│                                     │
│ ADVANCED NOISE     ───────────────  │
│ ☐ Enable                            │
│ Scale       ██████░░░░░░  1.5       │
│ Speed       ███░░░░░░░░░  0.5       │
│ Intensity   █████░░░░░░░  0.8       │
│                                     │
│ ACTIONS            ───────────────  │
│ [  Reset All  ]  [  Randomize  ]    │
└─────────────────────────────────────┘
```

**Controls:**
- Particle count with performance indicator
- Background color swatches
- Breathing effect controls
- Advanced noise (collapsible)
- Reset and randomize buttons

---

## Implementation Plan

### Phase 1: Create Tab Component Structure
- `ControlPanel.tsx` - Main container with tab state
- `TabBar.tsx` - Horizontal tab navigation
- `ControlSection.tsx` - Reusable section wrapper

### Phase 2: Create Individual Tab Components
- `TabLook.tsx`
- `TabMotion.tsx`
- `TabExport.tsx`
- `TabPaint.tsx`
- `TabSettings.tsx`

### Phase 3: Migrate Controls
- Move existing control code to appropriate tabs
- Refactor for compact layout
- Add collapsible sections

### Phase 4: Polish
- Add keyboard shortcuts (1-5 for tabs)
- Add tooltips
- Smooth tab transitions
- Persist last-used tab in localStorage

---

## Component Props Interface

```typescript
interface ControlPanelProps {
  // All the state setters from StudioPage
  // These will be passed down to individual tabs

  // Shape & Visual
  selectedShape: ShapeType;
  setSelectedShape: (s: ShapeType) => void;
  colorMode: ColorMode;
  setColorMode: (m: ColorMode) => void;
  // ... etc

  // Callbacks
  onExport: () => void;
  onReset: () => void;
  onRandomize: () => void;
}
```

---

## Visual Design Tokens

```css
/* Spacing */
--tab-height: 40px;
--section-gap: 12px;
--control-gap: 8px;

/* Colors */
--tab-active: rgba(255, 255, 255, 0.15);
--tab-hover: rgba(255, 255, 255, 0.08);
--section-border: rgba(255, 255, 255, 0.1);
--accent-look: #f472b6;     /* pink */
--accent-motion: #a78bfa;   /* purple */
--accent-export: #fb923c;   /* orange */
--accent-paint: #4ade80;    /* green */
--accent-settings: #94a3b8; /* slate */
```

---

## Keyboard Shortcuts

- `1` - Look tab
- `2` - Motion tab
- `3` - Export tab
- `4` - Paint tab
- `5` - Settings tab
- `Space` - Play/Pause animation
- `R` - Reset all
- `P` - Toggle paint mode
- `E` - Open export dialog
