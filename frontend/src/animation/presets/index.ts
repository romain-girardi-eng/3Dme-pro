/**
 * Animation Presets Library - DRAMATICALLY REDESIGNED
 *
 * Pre-defined animation sequences that create STUNNING visual effects.
 * Each preset maps directly to Generated3DParticles props.
 */

// Animation values that map DIRECTLY to Generated3DParticles props
export interface AnimationValues {
  // Size & Shape
  particleSize: number;
  particleSharpness: number;
  rotationSpeed: number;

  // Colors
  brightness: number;
  saturation: number;
  hueShift: number;
  shimmerIntensity: number;

  // Effects
  enableBloom: boolean;
  bloomIntensity: number;
  enableTrails: boolean;
  trailLength: number;

  // Breathing
  enableBreathing: boolean;
  breathingSpeed: number;
  breathingIntensity: number;

  // Animation Mode
  animationMode: number; // 0=none, 1=float, 2=wave, 3=vortex, 4=explode, 5=implode, 6=noise, 7=magnetic
  animationSpeed: number;
  animationIntensity: number;

  // Noise
  enableNoise: boolean;
  noiseScale: number;
  noiseSpeed: number;
  noiseIntensity: number;

  // Physics (GPGPU)
  friction: number;
  returnForce: number;
  gravity: number;
  turbulence: number;

  // Explosion
  explosionProgress: number;
}

// Default values matching the component defaults
export const DEFAULT_ANIMATION_VALUES: AnimationValues = {
  particleSize: 1.5,
  particleSharpness: 0.5,
  rotationSpeed: 0.15,
  brightness: 1,
  saturation: 1,
  hueShift: 0,
  shimmerIntensity: 0.3,
  enableBloom: false,
  bloomIntensity: 0.6,
  enableTrails: false,
  trailLength: 0.85,
  enableBreathing: true,
  breathingSpeed: 0.5,
  breathingIntensity: 0.5,
  animationMode: 1, // float
  animationSpeed: 1,
  animationIntensity: 1,
  enableNoise: false,
  noiseScale: 1,
  noiseSpeed: 0.5,
  noiseIntensity: 0.5,
  friction: 0.98,
  returnForce: 0.01,
  gravity: 0,
  turbulence: 0,
  explosionProgress: 0,
};

// Keyframe definition
export interface PresetKeyframe {
  time: number; // seconds
  values: Partial<AnimationValues>;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
}

// Preset definition
export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'intro' | 'loop' | 'dramatic' | 'psychedelic' | 'ambient';
  duration: number;
  keyframes: PresetKeyframe[];
  loop?: boolean;
}

// =============================================================================
// INTRO ANIMATIONS - Stunning opening sequences
// =============================================================================

export const EPIC_REVEAL: AnimationPreset = {
  id: 'epic-reveal',
  name: 'Epic Reveal',
  description: 'Dramatic emergence with bloom burst',
  category: 'intro',
  duration: 5,
  keyframes: [
    {
      time: 0,
      values: {
        brightness: 0.2,
        particleSize: 0.5,
        enableBloom: true,
        bloomIntensity: 0.2,
        shimmerIntensity: 0,
      },
      easing: 'ease-out',
    },
    {
      time: 1.5,
      values: {
        brightness: 1.8,
        particleSize: 2,
        bloomIntensity: 1.5,
        shimmerIntensity: 0.8,
      },
    },
    {
      time: 3,
      values: {
        brightness: 1.2,
        particleSize: 1.5,
        bloomIntensity: 0.8,
        shimmerIntensity: 0.4,
      },
    },
    {
      time: 5,
      values: {
        brightness: 1,
        particleSize: 1.5,
        bloomIntensity: 0.6,
        shimmerIntensity: 0.3,
      },
    },
  ],
};

export const QUANTUM_BIRTH: AnimationPreset = {
  id: 'quantum-birth',
  name: 'Quantum Birth',
  description: 'Particles materialize from the void with trails',
  category: 'intro',
  duration: 6,
  keyframes: [
    {
      time: 0,
      values: {
        brightness: 0,
        particleSize: 0.2,
        particleSharpness: 1,
        enableTrails: true,
        trailLength: 0.98,
        enableBloom: true,
        bloomIntensity: 0,
        animationMode: 5, // implode
        animationIntensity: 2,
        hueShift: 180,
      },
      easing: 'ease-out',
    },
    {
      time: 2,
      values: {
        brightness: 1.5,
        particleSize: 1,
        bloomIntensity: 1.5,
        animationIntensity: 1,
        hueShift: 90,
      },
    },
    {
      time: 4,
      values: {
        brightness: 1.2,
        particleSize: 1.5,
        particleSharpness: 0.5,
        trailLength: 0.9,
        bloomIntensity: 0.8,
        animationMode: 1, // float
        animationIntensity: 0.5,
        hueShift: 0,
      },
    },
    {
      time: 6,
      values: {
        brightness: 1,
        trailLength: 0.85,
        bloomIntensity: 0.6,
        enableTrails: false,
      },
    },
  ],
};

export const STARDUST_AWAKEN: AnimationPreset = {
  id: 'stardust-awaken',
  name: 'Stardust Awaken',
  description: 'Gentle shimmer builds to brilliant radiance',
  category: 'intro',
  duration: 8,
  keyframes: [
    {
      time: 0,
      values: {
        brightness: 0.1,
        particleSize: 0.8,
        particleSharpness: 0.2,
        shimmerIntensity: 0,
        enableBloom: true,
        bloomIntensity: 0.2,
        saturation: 0.5,
        enableBreathing: true,
        breathingIntensity: 0.2,
      },
      easing: 'ease-in-out',
    },
    {
      time: 3,
      values: {
        brightness: 0.6,
        shimmerIntensity: 0.5,
        bloomIntensity: 0.5,
        saturation: 1,
        breathingIntensity: 0.5,
      },
    },
    {
      time: 6,
      values: {
        brightness: 1.3,
        particleSize: 1.5,
        particleSharpness: 0.5,
        shimmerIntensity: 0.8,
        bloomIntensity: 1,
        saturation: 1.2,
        breathingIntensity: 0.8,
      },
    },
    {
      time: 8,
      values: {
        brightness: 1,
        shimmerIntensity: 0.4,
        bloomIntensity: 0.6,
        saturation: 1,
        breathingIntensity: 0.5,
      },
    },
  ],
};

// =============================================================================
// LOOP ANIMATIONS - Mesmerizing infinite cycles
// =============================================================================

export const COSMIC_BREATH: AnimationPreset = {
  id: 'cosmic-breath',
  name: 'Cosmic Breath',
  description: 'Gentle pulsing with soft color shifts',
  category: 'loop',
  duration: 8,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        brightness: 0.9,
        enableBloom: true,
        bloomIntensity: 0.5,
        hueShift: 0,
        shimmerIntensity: 0.2,
      },
      easing: 'ease-in-out',
    },
    {
      time: 2,
      values: {
        brightness: 1.3,
        bloomIntensity: 0.9,
        hueShift: 30,
        shimmerIntensity: 0.5,
      },
    },
    {
      time: 4,
      values: {
        brightness: 0.9,
        bloomIntensity: 0.5,
        hueShift: 60,
        shimmerIntensity: 0.2,
      },
    },
    {
      time: 6,
      values: {
        brightness: 1.3,
        bloomIntensity: 0.9,
        hueShift: 30,
        shimmerIntensity: 0.5,
      },
    },
    {
      time: 8,
      values: {
        brightness: 0.9,
        bloomIntensity: 0.5,
        hueShift: 0,
        shimmerIntensity: 0.2,
      },
    },
  ],
};

export const AURORA_DANCE: AnimationPreset = {
  id: 'aurora-dance',
  name: 'Aurora Dance',
  description: 'Flowing colors like northern lights',
  category: 'loop',
  duration: 10,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        hueShift: 0,
        saturation: 1.3,
        brightness: 1,
        enableBloom: true,
        bloomIntensity: 0.8,
        animationMode: 2, // wave
        animationSpeed: 0.7,
        animationIntensity: 0.8,
        shimmerIntensity: 0.5,
      },
      easing: 'linear',
    },
    {
      time: 2.5,
      values: {
        hueShift: 90,
        saturation: 1.5,
        brightness: 1.2,
        bloomIntensity: 1,
        shimmerIntensity: 0.7,
      },
    },
    {
      time: 5,
      values: {
        hueShift: 180,
        saturation: 1.3,
        brightness: 1,
        bloomIntensity: 0.8,
        shimmerIntensity: 0.5,
      },
    },
    {
      time: 7.5,
      values: {
        hueShift: 270,
        saturation: 1.5,
        brightness: 1.2,
        bloomIntensity: 1,
        shimmerIntensity: 0.7,
      },
    },
    {
      time: 10,
      values: {
        hueShift: 360,
        saturation: 1.3,
        brightness: 1,
        bloomIntensity: 0.8,
        shimmerIntensity: 0.5,
      },
    },
  ],
};

export const HYPNOTIC_SPIRAL: AnimationPreset = {
  id: 'hypnotic-spiral',
  name: 'Hypnotic Spiral',
  description: 'Vortex motion with pulsing intensity',
  category: 'loop',
  duration: 8,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        animationMode: 3, // vortex
        animationSpeed: 0.5,
        animationIntensity: 0.5,
        rotationSpeed: 0.1,
        enableBloom: true,
        bloomIntensity: 0.6,
        brightness: 1,
        particleSharpness: 0.4,
      },
      easing: 'ease-in-out',
    },
    {
      time: 2,
      values: {
        animationSpeed: 1.5,
        animationIntensity: 1.5,
        rotationSpeed: 0.3,
        bloomIntensity: 1.2,
        brightness: 1.3,
        particleSharpness: 0.7,
      },
    },
    {
      time: 4,
      values: {
        animationSpeed: 0.5,
        animationIntensity: 0.5,
        rotationSpeed: 0.1,
        bloomIntensity: 0.6,
        brightness: 1,
        particleSharpness: 0.4,
      },
    },
    {
      time: 6,
      values: {
        animationSpeed: 1.5,
        animationIntensity: 1.5,
        rotationSpeed: 0.3,
        bloomIntensity: 1.2,
        brightness: 1.3,
        particleSharpness: 0.7,
      },
    },
    {
      time: 8,
      values: {
        animationSpeed: 0.5,
        animationIntensity: 0.5,
        rotationSpeed: 0.1,
        bloomIntensity: 0.6,
        brightness: 1,
        particleSharpness: 0.4,
      },
    },
  ],
};

export const FIREFLY_SWARM: AnimationPreset = {
  id: 'firefly-swarm',
  name: 'Firefly Swarm',
  description: 'Organic floating with random shimmer bursts',
  category: 'loop',
  duration: 5,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        animationMode: 1, // float
        animationSpeed: 0.8,
        animationIntensity: 0.6,
        shimmerIntensity: 0.3,
        enableBloom: true,
        bloomIntensity: 0.5,
        brightness: 0.9,
        particleSharpness: 0.3,
        hueShift: 40, // warm yellow-green
      },
      easing: 'ease-in-out',
    },
    {
      time: 1.25,
      values: {
        shimmerIntensity: 1,
        bloomIntensity: 1.5,
        brightness: 1.5,
        particleSharpness: 0.8,
      },
    },
    {
      time: 2.5,
      values: {
        shimmerIntensity: 0.3,
        bloomIntensity: 0.5,
        brightness: 0.9,
        particleSharpness: 0.3,
      },
    },
    {
      time: 3.75,
      values: {
        shimmerIntensity: 0.8,
        bloomIntensity: 1.2,
        brightness: 1.3,
        particleSharpness: 0.6,
      },
    },
    {
      time: 5,
      values: {
        shimmerIntensity: 0.3,
        bloomIntensity: 0.5,
        brightness: 0.9,
        particleSharpness: 0.3,
      },
    },
  ],
};

// =============================================================================
// DRAMATIC ANIMATIONS - High-impact sequences
// =============================================================================

export const SUPERNOVA: AnimationPreset = {
  id: 'supernova',
  name: 'Supernova',
  description: 'Massive explosion with blinding flash',
  category: 'dramatic',
  duration: 6,
  keyframes: [
    {
      time: 0,
      values: {
        particleSize: 1,
        brightness: 1,
        enableBloom: true,
        bloomIntensity: 0.5,
        animationMode: 0, // none
        animationIntensity: 0,
        explosionProgress: 0,
        shimmerIntensity: 0.2,
      },
      easing: 'ease-in',
    },
    {
      time: 1,
      values: {
        particleSize: 0.5,
        brightness: 0.5,
        bloomIntensity: 0.3,
        shimmerIntensity: 0.8, // building tension
      },
    },
    {
      time: 1.5,
      values: {
        particleSize: 4,
        brightness: 3,
        bloomIntensity: 3,
        animationMode: 4, // explode
        animationIntensity: 3,
        explosionProgress: 0.8,
        shimmerIntensity: 1,
        hueShift: 30, // orange-white
      },
      easing: 'ease-out',
    },
    {
      time: 3,
      values: {
        particleSize: 2.5,
        brightness: 1.8,
        bloomIntensity: 1.5,
        animationIntensity: 1.5,
        explosionProgress: 1,
        shimmerIntensity: 0.6,
        hueShift: 0,
      },
    },
    {
      time: 6,
      values: {
        particleSize: 1.5,
        brightness: 1,
        bloomIntensity: 0.6,
        animationMode: 1, // float
        animationIntensity: 0.5,
        explosionProgress: 0,
        shimmerIntensity: 0.3,
      },
    },
  ],
};

export const BLACK_HOLE: AnimationPreset = {
  id: 'black-hole',
  name: 'Black Hole',
  description: 'Gravitational collapse into singularity',
  category: 'dramatic',
  duration: 8,
  keyframes: [
    {
      time: 0,
      values: {
        animationMode: 1, // float
        animationIntensity: 1,
        brightness: 1,
        enableBloom: true,
        bloomIntensity: 0.6,
        particleSize: 1.5,
        rotationSpeed: 0.1,
      },
      easing: 'ease-in',
    },
    {
      time: 2,
      values: {
        animationMode: 3, // vortex
        animationIntensity: 1,
        rotationSpeed: 0.2,
        bloomIntensity: 0.8,
      },
    },
    {
      time: 4,
      values: {
        animationMode: 5, // implode
        animationIntensity: 2,
        brightness: 1.5,
        rotationSpeed: 0.4,
        bloomIntensity: 1.5,
        particleSize: 1,
      },
    },
    {
      time: 6,
      values: {
        animationIntensity: 3,
        brightness: 0.3,
        rotationSpeed: 0.5,
        bloomIntensity: 0.3,
        particleSize: 0.3,
      },
    },
    {
      time: 7,
      values: {
        brightness: 0.1,
        particleSize: 0.1,
        bloomIntensity: 0.1,
      },
    },
    {
      time: 8,
      values: {
        animationMode: 4, // explode back out
        animationIntensity: 2,
        brightness: 2,
        bloomIntensity: 2,
        particleSize: 2,
        rotationSpeed: 0.1,
      },
    },
  ],
};

export const ELECTRIC_STORM: AnimationPreset = {
  id: 'electric-storm',
  name: 'Electric Storm',
  description: 'Chaotic energy with lightning flashes',
  category: 'dramatic',
  duration: 6,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        enableNoise: true,
        noiseScale: 2,
        noiseSpeed: 1,
        noiseIntensity: 0.5,
        brightness: 0.8,
        enableBloom: true,
        bloomIntensity: 0.6,
        shimmerIntensity: 0.3,
        hueShift: 200, // blue
        saturation: 1.3,
        animationMode: 6, // noise
        animationIntensity: 0.8,
      },
      easing: 'linear',
    },
    {
      time: 0.8,
      values: {
        brightness: 2.5, // FLASH
        bloomIntensity: 2.5,
        shimmerIntensity: 1,
        noiseIntensity: 1.5,
        particleSharpness: 1,
      },
    },
    {
      time: 1.2,
      values: {
        brightness: 0.8,
        bloomIntensity: 0.6,
        shimmerIntensity: 0.3,
        noiseIntensity: 0.5,
        particleSharpness: 0.5,
      },
    },
    {
      time: 2.5,
      values: {
        brightness: 0.9,
        hueShift: 220,
      },
    },
    {
      time: 3,
      values: {
        brightness: 2.2, // FLASH
        bloomIntensity: 2,
        shimmerIntensity: 0.9,
        noiseIntensity: 1.2,
        particleSharpness: 0.9,
        hueShift: 180, // cyan flash
      },
    },
    {
      time: 3.5,
      values: {
        brightness: 0.8,
        bloomIntensity: 0.6,
        shimmerIntensity: 0.3,
        noiseIntensity: 0.5,
        particleSharpness: 0.5,
        hueShift: 200,
      },
    },
    {
      time: 6,
      values: {
        brightness: 0.8,
        hueShift: 200,
      },
    },
  ],
};

// =============================================================================
// PSYCHEDELIC ANIMATIONS - Mind-bending visuals
// =============================================================================

export const ACID_TRIP: AnimationPreset = {
  id: 'acid-trip',
  name: 'Acid Trip',
  description: 'Rapid color cycling with morphing shapes',
  category: 'psychedelic',
  duration: 8,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        hueShift: 0,
        saturation: 1.8,
        brightness: 1.2,
        enableBloom: true,
        bloomIntensity: 1,
        animationMode: 2, // wave
        animationSpeed: 1.5,
        animationIntensity: 1.2,
        shimmerIntensity: 0.6,
        particleSharpness: 0.3,
      },
      easing: 'linear',
    },
    {
      time: 1,
      values: { hueShift: 45, particleSize: 2, particleSharpness: 0.7 },
    },
    {
      time: 2,
      values: { hueShift: 90, particleSize: 1.2, particleSharpness: 0.2 },
    },
    {
      time: 3,
      values: { hueShift: 135, particleSize: 2.5, particleSharpness: 0.8 },
    },
    {
      time: 4,
      values: { hueShift: 180, particleSize: 1, particleSharpness: 0.3 },
    },
    {
      time: 5,
      values: { hueShift: 225, particleSize: 2.2, particleSharpness: 0.6 },
    },
    {
      time: 6,
      values: { hueShift: 270, particleSize: 1.3, particleSharpness: 0.4 },
    },
    {
      time: 7,
      values: { hueShift: 315, particleSize: 1.8, particleSharpness: 0.5 },
    },
    {
      time: 8,
      values: { hueShift: 360, particleSize: 1.5, particleSharpness: 0.3 },
    },
  ],
};

export const NEON_PULSE: AnimationPreset = {
  id: 'neon-pulse',
  name: 'Neon Pulse',
  description: '80s retro neon with hard pulsing',
  category: 'psychedelic',
  duration: 4,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        brightness: 0.7,
        saturation: 2,
        enableBloom: true,
        bloomIntensity: 0.8,
        particleSharpness: 0.9,
        hueShift: 300, // magenta
        shimmerIntensity: 0.2,
      },
      easing: 'ease-in-out',
    },
    {
      time: 0.5,
      values: {
        brightness: 2,
        bloomIntensity: 2.5,
        shimmerIntensity: 0.8,
      },
    },
    {
      time: 1,
      values: {
        brightness: 0.7,
        bloomIntensity: 0.8,
        hueShift: 180, // cyan
        shimmerIntensity: 0.2,
      },
    },
    {
      time: 1.5,
      values: {
        brightness: 2,
        bloomIntensity: 2.5,
        shimmerIntensity: 0.8,
      },
    },
    {
      time: 2,
      values: {
        brightness: 0.7,
        bloomIntensity: 0.8,
        hueShift: 60, // yellow
        shimmerIntensity: 0.2,
      },
    },
    {
      time: 2.5,
      values: {
        brightness: 2,
        bloomIntensity: 2.5,
        shimmerIntensity: 0.8,
      },
    },
    {
      time: 3,
      values: {
        brightness: 0.7,
        bloomIntensity: 0.8,
        hueShift: 120, // green
        shimmerIntensity: 0.2,
      },
    },
    {
      time: 3.5,
      values: {
        brightness: 2,
        bloomIntensity: 2.5,
        shimmerIntensity: 0.8,
      },
    },
    {
      time: 4,
      values: {
        brightness: 0.7,
        bloomIntensity: 0.8,
        hueShift: 300,
        shimmerIntensity: 0.2,
      },
    },
  ],
};

export const DIMENSIONAL_RIFT: AnimationPreset = {
  id: 'dimensional-rift',
  name: 'Dimensional Rift',
  description: 'Reality-bending vortex with trails',
  category: 'psychedelic',
  duration: 10,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        animationMode: 3, // vortex
        animationSpeed: 0.3,
        animationIntensity: 0.5,
        enableTrails: true,
        trailLength: 0.95,
        enableBloom: true,
        bloomIntensity: 1,
        brightness: 1,
        hueShift: 0,
        rotationSpeed: 0.05,
      },
      easing: 'ease-in-out',
    },
    {
      time: 2.5,
      values: {
        animationSpeed: 1,
        animationIntensity: 1.5,
        trailLength: 0.98,
        bloomIntensity: 1.5,
        brightness: 1.3,
        hueShift: 90,
        rotationSpeed: 0.15,
      },
    },
    {
      time: 5,
      values: {
        animationSpeed: 2,
        animationIntensity: 2,
        trailLength: 0.99,
        bloomIntensity: 2,
        brightness: 1.5,
        hueShift: 180,
        rotationSpeed: 0.3,
      },
    },
    {
      time: 7.5,
      values: {
        animationSpeed: 1,
        animationIntensity: 1.5,
        trailLength: 0.98,
        bloomIntensity: 1.5,
        brightness: 1.3,
        hueShift: 270,
        rotationSpeed: 0.15,
      },
    },
    {
      time: 10,
      values: {
        animationSpeed: 0.3,
        animationIntensity: 0.5,
        trailLength: 0.95,
        bloomIntensity: 1,
        brightness: 1,
        hueShift: 360,
        rotationSpeed: 0.05,
      },
    },
  ],
};

// =============================================================================
// AMBIENT ANIMATIONS - Calm, meditative visuals
// =============================================================================

export const ZEN_FLOAT: AnimationPreset = {
  id: 'zen-float',
  name: 'Zen Float',
  description: 'Peaceful floating with gentle breathing',
  category: 'ambient',
  duration: 12,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        animationMode: 1, // float
        animationSpeed: 0.3,
        animationIntensity: 0.3,
        enableBreathing: true,
        breathingSpeed: 0.3,
        breathingIntensity: 0.4,
        enableBloom: true,
        bloomIntensity: 0.4,
        brightness: 0.9,
        saturation: 0.8,
        shimmerIntensity: 0.1,
        particleSharpness: 0.3,
      },
      easing: 'ease-in-out',
    },
    {
      time: 6,
      values: {
        breathingIntensity: 0.6,
        bloomIntensity: 0.6,
        brightness: 1.1,
        shimmerIntensity: 0.3,
      },
    },
    {
      time: 12,
      values: {
        breathingIntensity: 0.4,
        bloomIntensity: 0.4,
        brightness: 0.9,
        shimmerIntensity: 0.1,
      },
    },
  ],
};

export const OCEAN_DEEP: AnimationPreset = {
  id: 'ocean-deep',
  name: 'Ocean Deep',
  description: 'Underwater waves in deep blue',
  category: 'ambient',
  duration: 10,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        animationMode: 2, // wave
        animationSpeed: 0.4,
        animationIntensity: 0.6,
        hueShift: 200, // deep blue
        saturation: 1.2,
        brightness: 0.7,
        enableBloom: true,
        bloomIntensity: 0.5,
        shimmerIntensity: 0.2,
        particleSharpness: 0.2,
      },
      easing: 'ease-in-out',
    },
    {
      time: 5,
      values: {
        animationIntensity: 0.9,
        hueShift: 180, // cyan
        brightness: 0.9,
        bloomIntensity: 0.8,
        shimmerIntensity: 0.4,
      },
    },
    {
      time: 10,
      values: {
        animationIntensity: 0.6,
        hueShift: 200,
        brightness: 0.7,
        bloomIntensity: 0.5,
        shimmerIntensity: 0.2,
      },
    },
  ],
};

export const GOLDEN_HOUR: AnimationPreset = {
  id: 'golden-hour',
  name: 'Golden Hour',
  description: 'Warm sunset glow with soft shimmer',
  category: 'ambient',
  duration: 15,
  loop: true,
  keyframes: [
    {
      time: 0,
      values: {
        hueShift: 30, // warm orange
        saturation: 1.3,
        brightness: 1,
        enableBloom: true,
        bloomIntensity: 0.7,
        shimmerIntensity: 0.3,
        enableBreathing: true,
        breathingSpeed: 0.2,
        breathingIntensity: 0.3,
        particleSharpness: 0.4,
        animationMode: 1,
        animationSpeed: 0.2,
      },
      easing: 'ease-in-out',
    },
    {
      time: 5,
      values: {
        hueShift: 15, // more red
        brightness: 1.2,
        bloomIntensity: 0.9,
        shimmerIntensity: 0.5,
      },
    },
    {
      time: 10,
      values: {
        hueShift: 45, // more yellow
        brightness: 1.1,
        bloomIntensity: 0.8,
        shimmerIntensity: 0.4,
      },
    },
    {
      time: 15,
      values: {
        hueShift: 30,
        brightness: 1,
        bloomIntensity: 0.7,
        shimmerIntensity: 0.3,
      },
    },
  ],
};

// =============================================================================
// EXPORT ALL PRESETS
// =============================================================================

export const ALL_PRESETS: AnimationPreset[] = [
  // Intro
  EPIC_REVEAL,
  QUANTUM_BIRTH,
  STARDUST_AWAKEN,
  // Loop
  COSMIC_BREATH,
  AURORA_DANCE,
  HYPNOTIC_SPIRAL,
  FIREFLY_SWARM,
  // Dramatic
  SUPERNOVA,
  BLACK_HOLE,
  ELECTRIC_STORM,
  // Psychedelic
  ACID_TRIP,
  NEON_PULSE,
  DIMENSIONAL_RIFT,
  // Ambient
  ZEN_FLOAT,
  OCEAN_DEEP,
  GOLDEN_HOUR,
];

// Group presets by category
export const PRESETS_BY_CATEGORY = {
  intro: ALL_PRESETS.filter((p) => p.category === 'intro'),
  loop: ALL_PRESETS.filter((p) => p.category === 'loop'),
  dramatic: ALL_PRESETS.filter((p) => p.category === 'dramatic'),
  psychedelic: ALL_PRESETS.filter((p) => p.category === 'psychedelic'),
  ambient: ALL_PRESETS.filter((p) => p.category === 'ambient'),
};

// Get preset by ID
export function getPresetById(id: string): AnimationPreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

// Get all animated keys from a preset (keys that appear in ANY keyframe)
export function getAnimatedKeys(preset: AnimationPreset): Set<keyof AnimationValues> {
  const keys = new Set<keyof AnimationValues>();
  for (const kf of preset.keyframes) {
    for (const key of Object.keys(kf.values) as (keyof AnimationValues)[]) {
      keys.add(key);
    }
  }
  return keys;
}

// Apply preset to animation values - INTERPOLATE between keyframes
// Returns ONLY the values that are animated in this preset (Partial)
export function applyPresetAtTime(
  preset: AnimationPreset,
  time: number,
  baseValues: AnimationValues = DEFAULT_ANIMATION_VALUES
): Partial<AnimationValues> {
  const keyframes = preset.keyframes;

  // Handle looping
  let effectiveTime = time;
  if (preset.loop && time > preset.duration) {
    effectiveTime = time % preset.duration;
  }

  // Get all keys that are animated in this preset
  const animatedKeys = getAnimatedKeys(preset);

  // Handle time before first keyframe - return only animated values
  if (effectiveTime <= keyframes[0].time) {
    const result: Partial<AnimationValues> = {};
    animatedKeys.forEach((key) => {
      const val = keyframes[0].values[key];
      if (val !== undefined) {
        (result as Record<string, unknown>)[key] = val;
      } else {
        (result as Record<string, unknown>)[key] = baseValues[key];
      }
    });
    return result;
  }

  // Handle time after last keyframe
  if (effectiveTime >= keyframes[keyframes.length - 1].time) {
    const result: Partial<AnimationValues> = {};
    animatedKeys.forEach((key) => {
      const val = keyframes[keyframes.length - 1].values[key];
      if (val !== undefined) {
        (result as Record<string, unknown>)[key] = val;
      } else {
        // Find last keyframe that has this value
        for (let i = keyframes.length - 1; i >= 0; i--) {
          if (keyframes[i].values[key] !== undefined) {
            (result as Record<string, unknown>)[key] = keyframes[i].values[key];
            break;
          }
        }
        if (result[key] === undefined) {
          (result as Record<string, unknown>)[key] = baseValues[key];
        }
      }
    });
    return result;
  }

  // Find surrounding keyframes
  let startKF = keyframes[0];
  let endKF = keyframes[1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (effectiveTime >= keyframes[i].time && effectiveTime <= keyframes[i + 1].time) {
      startKF = keyframes[i];
      endKF = keyframes[i + 1];
      break;
    }
  }

  // Calculate interpolation factor
  const duration = endKF.time - startKF.time;
  const elapsed = effectiveTime - startKF.time;
  let t = duration > 0 ? elapsed / duration : 0;

  // Apply easing
  t = applyEasing(t, startKF.easing || 'linear');

  // Interpolate ONLY animated values
  const result: Partial<AnimationValues> = {};

  animatedKeys.forEach((key) => {
    // Find the most recent value for this key from start keyframe or earlier
    let startVal: number | boolean | undefined;
    for (let i = keyframes.indexOf(startKF); i >= 0; i--) {
      if (keyframes[i].values[key] !== undefined) {
        startVal = keyframes[i].values[key];
        break;
      }
    }
    if (startVal === undefined) startVal = baseValues[key];

    // Find the value at end keyframe or use start value
    const endVal = endKF.values[key] !== undefined ? endKF.values[key] : startVal;

    if (typeof startVal === 'number' && typeof endVal === 'number') {
      // Interpolate numeric values
      (result as Record<string, number>)[key] = startVal + (endVal - startVal) * t;
    } else if (typeof startVal === 'boolean') {
      // For booleans, use the start value until we pass 50%
      (result as Record<string, boolean>)[key] = t < 0.5 ? startVal : (endVal as boolean);
    }
  });

  return result;
}

// Easing functions
function applyEasing(
  t: number,
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'
): number {
  switch (easing) {
    case 'ease-in':
      return t * t * t;
    case 'ease-out':
      return 1 - Math.pow(1 - t, 3);
    case 'ease-in-out':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'bounce':
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    case 'elastic':
      if (t === 0 || t === 1) return t;
      return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
    case 'linear':
    default:
      return t;
  }
}

export default ALL_PRESETS;
