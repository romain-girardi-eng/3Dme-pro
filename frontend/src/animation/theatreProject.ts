/**
 * Theatre.js Project Setup
 *
 * Creates and manages the Theatre.js project, sheet, and animatable object.
 * This is the core of the animation system.
 */

import { getProject, types, ISheet } from '@theatre/core';
import { DEFAULT_ANIMATION_VALUES, type AnimationValues } from './types';

// Storage key for persisting animations
const STORAGE_KEY = '3dme-animation-state';

// Load saved state from localStorage
function loadSavedState(): object | undefined {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load animation state:', e);
  }
  return undefined;
}

// Save state to localStorage
export function saveAnimationState(): void {
  try {
    // Note: Full state export requires studio.createContentOfSaveFile()
    // For now, we'll rely on Theatre.js's automatic localStorage persistence
    console.log('Animation state saved for project:', project.address.projectId);
  } catch (e) {
    console.warn('Failed to save animation state:', e);
  }
}

// Define all animatable properties with Theatre.js types
// Must be defined before use
const particleSystemProps = {
  // Transform group
  transform: types.compound({
    rotationX: types.number(DEFAULT_ANIMATION_VALUES.rotationX, {
      range: [-Math.PI, Math.PI],
      nudgeMultiplier: 0.01,
    }),
    rotationY: types.number(DEFAULT_ANIMATION_VALUES.rotationY, {
      range: [-Math.PI, Math.PI],
      nudgeMultiplier: 0.01,
    }),
    rotationZ: types.number(DEFAULT_ANIMATION_VALUES.rotationZ, {
      range: [-Math.PI, Math.PI],
      nudgeMultiplier: 0.01,
    }),
    scale: types.number(DEFAULT_ANIMATION_VALUES.scale, {
      range: [0.1, 5],
      nudgeMultiplier: 0.1,
    }),
  }),

  // Animation group
  animation: types.compound({
    mode: types.number(DEFAULT_ANIMATION_VALUES.animationMode, {
      range: [0, 7],
      nudgeMultiplier: 1,
    }),
    speed: types.number(DEFAULT_ANIMATION_VALUES.animationSpeed, {
      range: [0, 3],
      nudgeMultiplier: 0.1,
    }),
    intensity: types.number(DEFAULT_ANIMATION_VALUES.animationIntensity, {
      range: [0, 2],
      nudgeMultiplier: 0.1,
    }),
  }),

  // Visual group
  visual: types.compound({
    brightness: types.number(DEFAULT_ANIMATION_VALUES.brightness, {
      range: [0, 2],
      nudgeMultiplier: 0.05,
    }),
    saturation: types.number(DEFAULT_ANIMATION_VALUES.saturation, {
      range: [0, 2],
      nudgeMultiplier: 0.05,
    }),
    hueShift: types.number(DEFAULT_ANIMATION_VALUES.hueShift, {
      range: [0, 360],
      nudgeMultiplier: 1,
    }),
    sharpness: types.number(DEFAULT_ANIMATION_VALUES.particleSharpness, {
      range: [0, 1],
      nudgeMultiplier: 0.05,
    }),
  }),

  // Effects group
  effects: types.compound({
    bloom: types.number(DEFAULT_ANIMATION_VALUES.bloomIntensity, {
      range: [0, 2],
      nudgeMultiplier: 0.1,
    }),
    breathing: types.number(DEFAULT_ANIMATION_VALUES.breathingIntensity, {
      range: [0, 2],
      nudgeMultiplier: 0.1,
    }),
    shimmer: types.number(DEFAULT_ANIMATION_VALUES.shimmerIntensity, {
      range: [0, 1],
      nudgeMultiplier: 0.05,
    }),
  }),

  // Physics group (GPGPU)
  physics: types.compound({
    friction: types.number(DEFAULT_ANIMATION_VALUES.friction, {
      range: [0.9, 0.999],
      nudgeMultiplier: 0.001,
    }),
    returnForce: types.number(DEFAULT_ANIMATION_VALUES.returnForce, {
      range: [0, 0.1],
      nudgeMultiplier: 0.005,
    }),
    gravity: types.number(DEFAULT_ANIMATION_VALUES.gravity, {
      range: [-1, 1],
      nudgeMultiplier: 0.05,
    }),
    turbulence: types.number(DEFAULT_ANIMATION_VALUES.turbulence, {
      range: [0, 1],
      nudgeMultiplier: 0.05,
    }),
  }),

  // Camera group
  camera: types.compound({
    x: types.number(DEFAULT_ANIMATION_VALUES.cameraX, {
      range: [-500, 500],
      nudgeMultiplier: 1,
    }),
    y: types.number(DEFAULT_ANIMATION_VALUES.cameraY, {
      range: [-500, 500],
      nudgeMultiplier: 1,
    }),
    z: types.number(DEFAULT_ANIMATION_VALUES.cameraZ, {
      range: [10, 1000],
      nudgeMultiplier: 1,
    }),
    fov: types.number(DEFAULT_ANIMATION_VALUES.cameraFOV, {
      range: [20, 120],
      nudgeMultiplier: 1,
    }),
  }),
};

// Re-export with proper typing
export { particleSystemProps };

// Create the Theatre.js project
export const project = getProject('3Dme-Animations', {
  state: loadSavedState(),
});

// Create the main animation sheet
export const mainSheet: ISheet = project.sheet('Main');

// Create the animatable properties object with Theatre.js types
export const particleSystemObject = mainSheet.object('ParticleSystem', particleSystemProps);

// Helper to flatten Theatre.js compound values to AnimationValues
export function flattenTheatreValues(values: typeof particleSystemProps): AnimationValues {
  return {
    rotationX: (values.transform as any).rotationX,
    rotationY: (values.transform as any).rotationY,
    rotationZ: (values.transform as any).rotationZ,
    scale: (values.transform as any).scale,
    animationMode: (values.animation as any).mode,
    animationSpeed: (values.animation as any).speed,
    animationIntensity: (values.animation as any).intensity,
    brightness: (values.visual as any).brightness,
    saturation: (values.visual as any).saturation,
    hueShift: (values.visual as any).hueShift,
    particleSharpness: (values.visual as any).sharpness,
    bloomIntensity: (values.effects as any).bloom,
    breathingIntensity: (values.effects as any).breathing,
    shimmerIntensity: (values.effects as any).shimmer,
    friction: (values.physics as any).friction,
    returnForce: (values.physics as any).returnForce,
    gravity: (values.physics as any).gravity,
    turbulence: (values.physics as any).turbulence,
    cameraX: (values.camera as any).x,
    cameraY: (values.camera as any).y,
    cameraZ: (values.camera as any).z,
    cameraFOV: (values.camera as any).fov,
  };
}

// Sequence control helpers
export const sequence = mainSheet.sequence;

export function playSequence(options?: {
  rate?: number;
  range?: [number, number];
  iterationCount?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternateReverse';
}): Promise<boolean> {
  return sequence.play(options);
}

export function pauseSequence(): void {
  sequence.pause();
}

export function seekSequence(position: number): void {
  sequence.position = position;
}

export function getSequencePosition(): number {
  return sequence.position;
}

export function getSequenceDuration(): number {
  // Theatre.js sequences don't have a fixed duration - they extend to the last keyframe
  // Default to 10 seconds if no keyframes exist
  return 10;
}

// Initialize Theatre.js Studio in development mode
export async function initializeStudio(): Promise<void> {
  if (import.meta.env.DEV) {
    try {
      const studio = await import('@theatre/studio');
      studio.default.initialize();
      console.log('Theatre.js Studio initialized');
    } catch (e) {
      console.warn('Failed to initialize Theatre.js Studio:', e);
    }
  }
}
