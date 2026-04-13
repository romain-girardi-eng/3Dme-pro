# UltimateParticles - The Definitive Three.js Particle System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ULTIMATE PARTICLES ENGINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    GPGPU PHYSICS LAYER (GPU Textures)                │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │    │
│  │  │ Position Texture │  │ Velocity Texture │  │ Original Position  │  │    │
│  │  │   (RGBA Float)   │  │   (RGBA Float)   │  │   (RGBA Float)     │  │    │
│  │  │  xyz + life      │  │  xyz + age       │  │   xyz + region     │  │    │
│  │  └────────┬─────────┘  └────────┬─────────┘  └─────────┬──────────┘  │    │
│  │           │                     │                      │             │    │
│  │           ▼                     ▼                      ▼             │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │              VELOCITY SHADER (Physics Simulation)             │   │    │
│  │  │  • Strange Attractors (Thomas, Lorenz, Aizawa, Halvorsen)    │   │    │
│  │  │  • Animation Forces (Wave, Vortex, Explode, Implode, Float)  │   │    │
│  │  │  • Mouse Interaction (Repel, Attract, Orbit, Vortex)         │   │    │
│  │  │  • Curl Noise Flow Fields                                     │   │    │
│  │  │  • Friction, Gravity, Turbulence                              │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                              │                                       │    │
│  │                              ▼                                       │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │              POSITION SHADER (Integration)                    │   │    │
│  │  │  • Velocity Integration (pos += vel * dt)                     │   │    │
│  │  │  • Return Force (drift back to original)                      │   │    │
│  │  │  • Boundary Constraints                                       │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    RENDER LAYER (Visual Output)                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │    │
│  │  │  Vertex Shader   │  │ Fragment Shader │  │  Post-Processing   │  │    │
│  │  │  • Sample pos/vel│  │  • Color modes  │  │  • Bloom           │  │    │
│  │  │  • Size calc     │  │  • Sharpness    │  │  • Trails          │  │    │
│  │  │  • Color select  │  │  • Region FX    │  │  • Tone mapping    │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Feature Matrix

| Feature | Generated3D | GPGPU | Ultimate |
|---------|-------------|-------|----------|
| Max Particles | 5M (CPU) | 1M (GPU) | **4M (GPU)** |
| Physics Persistence | ❌ | ✅ | ✅ |
| Strange Attractors | ❌ | ✅ | ✅ |
| Animation Modes | 8 | 1 | **12** |
| Color Modes | 8 | 5 | **10** |
| Region Painting | ✅ | ❌ | ✅ |
| Trails | ✅ | ❌ | ✅ |
| Shape Generators | 8 | 1 | **8** |
| Visual Controls | ✅ | ❌ | ✅ |
| Hover Effects | ✅ | ❌ | ✅ |
| Dynamic Updates | ✅ | ❌ | ✅ |
| Mouse Forces | 1 | 4 | **4** |

## Animation Modes (12 Total)

### Physics-Based (GPGPU Velocity)
1. **none** - No additional forces
2. **float** - Gentle buoyancy + micro-movements
3. **wave** - Radial sine waves from center
4. **vortex** - Spiral rotation around Y axis
5. **explode** - Outward force from center
6. **implode** - Inward force to center
7. **turbulence** - Curl noise flow field
8. **magnetic** - Polar attraction forces

### Strange Attractors (Mathematical Chaos)
9. **thomas** - Spiraling orbits (b=0.208186)
10. **lorenz** - Chaotic butterfly (σ=10, ρ=28, β=8/3)
11. **aizawa** - Torus-like shapes
12. **halvorsen** - 3D spirals

## Color Modes (10 Total)

1. **original** - Point cloud colors / shape-generated
2. **rainbow** - HSV cycling by particle index
3. **ocean** - Blue gradients
4. **sunset** - Orange/red warm tones
5. **neon** - Magenta/cyan/yellow
6. **fire** - Orange to yellow flames
7. **matrix** - Green digital rain
8. **velocity** - Cool→hot based on speed
9. **position** - Rainbow based on XYZ
10. **custom** - User-defined hex color

## Mouse Force Modes

1. **repel** - Push particles away
2. **attract** - Pull particles toward cursor
3. **orbit** - Perpendicular circular force
4. **vortex** - Spiral inward combination

## Technical Specifications

### GPGPU Texture Sizes
- **512×512** = 262,144 particles (default)
- **1024×1024** = 1,048,576 particles
- **2048×2048** = 4,194,304 particles (requires good GPU)

### Data Layout
```
Position Texture (RGBA32F):
  R = x position
  G = y position
  B = z position
  A = life (0-1)

Velocity Texture (RGBA32F):
  R = x velocity
  G = y velocity
  B = z velocity
  A = age (accumulated time)

Original Position Texture (RGBA32F):
  R = original x
  G = original y
  B = original z
  A = region (0-4)
```

### Uniform Categories

**Structural (require scene recreation):**
- pointCloud, shape, particleCount
- textureSize, backgroundColor
- enableBloom, enableTrails

**Dynamic (real-time update):**
- All animation parameters
- All visual parameters
- All physics parameters
- Mouse interaction
- Region configs

## Performance Optimizations

1. **Ping-pong FBO** - Double-buffered textures for read/write
2. **Frustum culling disabled** - Particles move dynamically
3. **Additive blending** - No depth sorting needed
4. **Uniform batching** - Group updates to minimize state changes
5. **Texture filtering** - NearestFilter for precise sampling
6. **Dynamic uniform refs** - Avoid scene recreation for visual changes

## Usage Example

```tsx
<UltimateParticles
  // Source
  pointCloud={pointCloudData}
  shape="sphere"
  particleCount={500000}
  textureSize={1024}

  // Animation
  animationMode="thomas"
  animationSpeed={1.0}
  animationIntensity={0.5}

  // Physics
  friction={0.98}
  returnForce={0.01}
  gravity={0}
  turbulence={0.3}

  // Mouse
  enableMouse={true}
  mouseForce={0.5}
  mouseRadius={50}
  forceMode="repel"

  // Visual
  particleSize={2}
  particleSharpness={0.5}
  colorMode="velocity"
  brightness={1.2}
  saturation={1.0}
  hueShift={0}
  shimmerIntensity={0.3}

  // Effects
  enableBloom={true}
  bloomIntensity={0.8}
  enableTrails={true}
  trailLength={0.9}

  // Region painting
  paintingMode={false}
  selectedRegion={1}
  brushRadius={5}
  regionConfigs={[...]}
/>
```

## File Structure

```
frontend/src/components/particles/
├── UltimateParticles.tsx      # Main unified component
├── ULTIMATE_PARTICLES.md      # This documentation
├── Generated3DParticles.tsx   # Legacy (deprecated)
└── GPGPUParticles.tsx         # Legacy (deprecated)
```

## Migration Guide

Replace imports:
```tsx
// Before
import { Generated3DParticles } from './Generated3DParticles';
import { GPGPUParticles } from './GPGPUParticles';

// After
import { UltimateParticles } from './UltimateParticles';
```

The API is backward-compatible with Generated3DParticles props.
New GPGPU features are additive (attractorType → animationMode).
