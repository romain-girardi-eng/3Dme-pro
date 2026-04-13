/**
 * VFXEmitters.tsx
 *
 * Stunning GPU-accelerated particle VFX using wawa-vfx.
 * Provides prebuilt emitters for fire, magic, explosions, trails, etc.
 */

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { VFXParticles, VFXEmitter, type VFXEmitterSettings, type VFXParticlesSettings } from 'wawa-vfx';
import * as THREE from 'three';

// ============================================================================
// TYPES
// ============================================================================

export type VFXPresetName =
  | 'fire'
  | 'explosion'
  | 'magic_sparkles'
  | 'electric_arc'
  | 'smoke_trail'
  | 'rainbow_burst'
  | 'cosmic_dust'
  | 'neon_pulse'
  | 'flame_jet'
  | 'aurora';

export interface VFXPreset {
  name: VFXPresetName;
  label: string;
  description: string;
  particleSettings: VFXParticlesSettings;
  emitterSettings: VFXEmitterSettings;
}

// ============================================================================
// VFX PRESETS
// ============================================================================

export const VFX_PRESETS: Record<VFXPresetName, VFXPreset> = {
  fire: {
    name: 'fire',
    label: 'Inferno Fire',
    description: 'Realistic flickering flames with ember particles',
    particleSettings: {
      nbParticles: 5000,
      intensity: 1,
      fadeAlpha: [0, 1],
      fadeSize: [1, 0],
      gravity: [0, 2, 0],
    },
    emitterSettings: {
      spawnMode: 'time',
      loop: true,
      duration: 10,
      nbParticles: 200,
      particlesLifetime: [0.5, 1.5],
      speed: [2, 5],
      size: [0.3, 0.8],
      directionMin: [-0.3, 0.5, -0.3],
      directionMax: [0.3, 1, 0.3],
      colorStart: ['#ff6600', '#ffaa00'],
      colorEnd: ['#ff0000', '#ff2200'],
    },
  },

  explosion: {
    name: 'explosion',
    label: 'Epic Explosion',
    description: 'Dramatic burst with shockwave and debris',
    particleSettings: {
      nbParticles: 3000,
      intensity: 1.5,
      fadeAlpha: [0, 1],
      fadeSize: [0.5, 0],
      gravity: [0, -5, 0],
    },
    emitterSettings: {
      spawnMode: 'burst',
      loop: true,
      duration: 2,
      nbParticles: 500,
      particlesLifetime: [0.3, 1.5],
      speed: [10, 25],
      size: [0.2, 0.6],
      directionMin: [-1, -1, -1],
      directionMax: [1, 1, 1],
      colorStart: ['#ffffff', '#ffff00'],
      colorEnd: ['#ff4400', '#ff0000'],
    },
  },

  magic_sparkles: {
    name: 'magic_sparkles',
    label: 'Magic Sparkles',
    description: 'Enchanting sparkle particles with swirl motion',
    particleSettings: {
      nbParticles: 3000,
      intensity: 0.8,
      fadeAlpha: [0, 1],
      fadeSize: [1, 0.3],
      gravity: [0, 0.5, 0],
    },
    emitterSettings: {
      spawnMode: 'time',
      loop: true,
      duration: 10,
      nbParticles: 100,
      particlesLifetime: [1, 3],
      speed: [0.5, 2],
      size: [0.05, 0.2],
      directionMin: [-1, -1, -1],
      directionMax: [1, 1, 1],
      colorStart: ['#00ffff', '#ff00ff'],
      colorEnd: ['#ff00ff', '#ffdd00'],
    },
  },

  electric_arc: {
    name: 'electric_arc',
    label: 'Electric Arc',
    description: 'Crackling electricity with blue-white sparks',
    particleSettings: {
      nbParticles: 5000,
      intensity: 1.2,
      fadeAlpha: [0, 1],
      fadeSize: [1, 0],
      gravity: [0, 0, 0],
    },
    emitterSettings: {
      spawnMode: 'time',
      loop: true,
      duration: 10,
      nbParticles: 300,
      particlesLifetime: [0.1, 0.4],
      speed: [5, 15],
      size: [0.02, 0.1],
      directionMin: [-0.2, 0.5, -0.2],
      directionMax: [0.2, 1, 0.2],
      colorStart: ['#ffffff', '#88ccff'],
      colorEnd: ['#0088ff', '#0044ff'],
    },
  },

  smoke_trail: {
    name: 'smoke_trail',
    label: 'Smoke Trail',
    description: 'Volumetric smoke with soft dissipation',
    particleSettings: {
      nbParticles: 2000,
      intensity: 0.5,
      fadeAlpha: [0, 1],
      fadeSize: [0.5, 1.5],
      gravity: [0, 0.5, 0],
    },
    emitterSettings: {
      spawnMode: 'time',
      loop: true,
      duration: 10,
      nbParticles: 60,
      particlesLifetime: [2, 5],
      speed: [0.5, 1.5],
      size: [0.5, 2],
      directionMin: [-0.3, 0.5, -0.3],
      directionMax: [0.3, 1, 0.3],
      colorStart: ['#666666', '#888888'],
      colorEnd: ['#222222', '#111111'],
    },
  },

  rainbow_burst: {
    name: 'rainbow_burst',
    label: 'Rainbow Burst',
    description: 'Colorful celebratory particle explosion',
    particleSettings: {
      nbParticles: 3000,
      intensity: 1,
      fadeAlpha: [0, 1],
      fadeSize: [1, 0.5],
      gravity: [0, -3, 0],
    },
    emitterSettings: {
      spawnMode: 'burst',
      loop: true,
      duration: 1,
      nbParticles: 200,
      particlesLifetime: [1, 2],
      speed: [3, 8],
      size: [0.1, 0.3],
      directionMin: [-1, -1, -1],
      directionMax: [1, 1, 1],
      colorStart: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'],
      colorEnd: ['#ff4444', '#ffaa44', '#ffff66', '#44ff44', '#44aaff', '#aa44ff'],
    },
  },

  cosmic_dust: {
    name: 'cosmic_dust',
    label: 'Cosmic Dust',
    description: 'Nebula-like dust cloud with slow drift',
    particleSettings: {
      nbParticles: 5000,
      intensity: 0.6,
      fadeAlpha: [0, 1],
      fadeSize: [0.8, 1.2],
      gravity: [0, 0, 0],
    },
    emitterSettings: {
      spawnMode: 'time',
      loop: true,
      duration: 10,
      nbParticles: 150,
      particlesLifetime: [3, 6],
      speed: [0.2, 0.8],
      size: [0.05, 0.2],
      directionMin: [-1, -1, -1],
      directionMax: [1, 1, 1],
      colorStart: ['#6644ff', '#ff44aa'],
      colorEnd: ['#ff44aa', '#aaaaff'],
    },
  },

  neon_pulse: {
    name: 'neon_pulse',
    label: 'Neon Pulse',
    description: 'Cyberpunk neon rings with pulsing glow',
    particleSettings: {
      nbParticles: 3000,
      intensity: 1.3,
      fadeAlpha: [0, 1],
      fadeSize: [1, 0],
      gravity: [0, 0, 0],
    },
    emitterSettings: {
      spawnMode: 'burst',
      loop: true,
      duration: 0.8,
      nbParticles: 100,
      particlesLifetime: [0.5, 1.2],
      speed: [5, 10],
      size: [0.08, 0.2],
      directionMin: [-1, -0.1, -1],
      directionMax: [1, 0.1, 1],
      colorStart: ['#00ffff', '#ff00ff'],
      colorEnd: ['#ff00ff', '#ffff00'],
    },
  },

  flame_jet: {
    name: 'flame_jet',
    label: 'Flame Jet',
    description: 'Directional jet of intense flames',
    particleSettings: {
      nbParticles: 6000,
      intensity: 1.2,
      fadeAlpha: [0, 1],
      fadeSize: [1, 0.3],
      gravity: [0, 2, 0],
    },
    emitterSettings: {
      spawnMode: 'time',
      loop: true,
      duration: 10,
      nbParticles: 400,
      particlesLifetime: [0.3, 0.8],
      speed: [8, 15],
      size: [0.2, 0.5],
      directionMin: [-0.15, 0.8, -0.15],
      directionMax: [0.15, 1, 0.15],
      colorStart: ['#ffffff', '#ffaa00'],
      colorEnd: ['#ff4400', '#ff0000'],
    },
  },

  aurora: {
    name: 'aurora',
    label: 'Aurora Borealis',
    description: 'Northern lights flowing curtain effect',
    particleSettings: {
      nbParticles: 4000,
      intensity: 0.7,
      fadeAlpha: [0, 1],
      fadeSize: [0.8, 1],
      gravity: [0, 0.2, 0],
    },
    emitterSettings: {
      spawnMode: 'time',
      loop: true,
      duration: 10,
      nbParticles: 200,
      particlesLifetime: [2, 4],
      speed: [0.5, 1.5],
      size: [0.1, 0.4],
      startPositionMin: [-3, 1, -0.5],
      startPositionMax: [3, 2, 0.5],
      directionMin: [-0.2, 0.8, -0.1],
      directionMax: [0.2, 1, 0.1],
      colorStart: ['#00ff88', '#aa00ff'],
      colorEnd: ['#0088ff', '#ff00aa'],
    },
  },
};

// ============================================================================
// VFX SCENE COMPONENT
// ============================================================================

interface VFXSceneProps {
  preset: VFXPresetName;
  intensity?: number;
  scale?: number;
  autoPlay?: boolean;
}

function VFXScene({ preset, intensity = 1, scale = 1 }: VFXSceneProps) {
  const presetConfig = VFX_PRESETS[preset];
  const groupRef = useRef<THREE.Group>(null);
  const emitterName = `vfx-${preset}`;

  // Delay emitter mount to ensure VFXParticles is registered first
  const [emitterReady, setEmitterReady] = useState(false);

  useEffect(() => {
    // Reset when preset changes
    setEmitterReady(false);
    // Small delay to ensure particle system is registered
    const timer = setTimeout(() => setEmitterReady(true), 100);
    return () => clearTimeout(timer);
  }, [preset]);

  // Scale particle count by intensity
  const adjustedParticleSettings: VFXParticlesSettings = {
    ...presetConfig.particleSettings,
    nbParticles: Math.ceil((presetConfig.particleSettings.nbParticles || 3000) * intensity),
    intensity: (presetConfig.particleSettings.intensity || 1) * intensity,
  };

  const adjustedEmitterSettings: VFXEmitterSettings = {
    ...presetConfig.emitterSettings,
    nbParticles: Math.ceil((presetConfig.emitterSettings.nbParticles || 100) * intensity),
  };

  // Auto-rotation for visual interest
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={scale} key={preset}>
      {/* Particle system - must mount first */}
      <VFXParticles
        name={emitterName}
        settings={adjustedParticleSettings}
      />
      {/* Emitter spawns particles into the named particle system - delayed mount */}
      {emitterReady && (
        <VFXEmitter
          emitter={emitterName}
          settings={adjustedEmitterSettings}
          autoStart={true}
        />
      )}
    </group>
  );
}

// ============================================================================
// MAIN VFX VIEWER COMPONENT
// ============================================================================

interface VFXViewerProps {
  preset: VFXPresetName;
  intensity?: number;
  scale?: number;
  backgroundColor?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function VFXViewer({
  preset,
  intensity = 1,
  scale = 1,
  backgroundColor = '#0a0a0f',
  autoPlay = true,
  showControls = true,
  className,
  style,
}: VFXViewerProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style,
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: backgroundColor }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
        {showControls && (
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={50}
          />
        )}

        {/* Ambient light for visibility */}
        <ambientLight intensity={0.3} />

        {/* VFX Scene */}
        <VFXScene
          preset={preset}
          intensity={intensity}
          scale={scale}
          autoPlay={autoPlay}
        />
      </Canvas>
    </div>
  );
}

// ============================================================================
// VFX PRESET SELECTOR COMPONENT
// ============================================================================

interface VFXPresetSelectorProps {
  currentPreset: VFXPresetName;
  onSelect: (preset: VFXPresetName) => void;
}

export function VFXPresetSelector({ currentPreset, onSelect }: VFXPresetSelectorProps) {
  const presets = Object.values(VFX_PRESETS);

  return (
    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
      {presets.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelect(preset.name)}
          className={`p-2 rounded-lg text-left transition-all ${
            currentPreset === preset.name
              ? 'bg-cyan-500/30 border border-cyan-500'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="text-sm font-medium text-white">{preset.label}</div>
          <div className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{preset.description}</div>
        </button>
      ))}
    </div>
  );
}

export default VFXViewer;
