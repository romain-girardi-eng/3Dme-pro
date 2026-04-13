/**
 * Animation Studio Type Definitions
 */

// Animatable property ranges and metadata
export interface AnimatableProp {
  name: string;
  label: string;
  group: 'transform' | 'animation' | 'visual' | 'effects' | 'camera';
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
}

// All animatable properties
export const ANIMATABLE_PROPS: AnimatableProp[] = [
  // Transform
  { name: 'rotationX', label: 'Rotation X', group: 'transform', min: -Math.PI, max: Math.PI, step: 0.01, default: 0, unit: 'rad' },
  { name: 'rotationY', label: 'Rotation Y', group: 'transform', min: -Math.PI, max: Math.PI, step: 0.01, default: 0, unit: 'rad' },
  { name: 'rotationZ', label: 'Rotation Z', group: 'transform', min: -Math.PI, max: Math.PI, step: 0.01, default: 0, unit: 'rad' },
  { name: 'scale', label: 'Scale', group: 'transform', min: 0.1, max: 5, step: 0.1, default: 1 },

  // Animation
  { name: 'animationMode', label: 'Animation Mode', group: 'animation', min: 0, max: 7, step: 1, default: 0 },
  { name: 'animationSpeed', label: 'Speed', group: 'animation', min: 0, max: 3, step: 0.1, default: 1 },
  { name: 'animationIntensity', label: 'Intensity', group: 'animation', min: 0, max: 2, step: 0.1, default: 1 },

  // Visual
  { name: 'brightness', label: 'Brightness', group: 'visual', min: 0, max: 2, step: 0.05, default: 1 },
  { name: 'saturation', label: 'Saturation', group: 'visual', min: 0, max: 2, step: 0.05, default: 1 },
  { name: 'hueShift', label: 'Hue Shift', group: 'visual', min: 0, max: 360, step: 1, default: 0, unit: 'deg' },
  { name: 'particleSharpness', label: 'Sharpness', group: 'visual', min: 0, max: 1, step: 0.05, default: 0.5 },

  // Effects
  { name: 'bloomIntensity', label: 'Bloom', group: 'effects', min: 0, max: 2, step: 0.1, default: 0.6 },
  { name: 'breathingIntensity', label: 'Breathing', group: 'effects', min: 0, max: 2, step: 0.1, default: 0.5 },
  { name: 'shimmerIntensity', label: 'Shimmer', group: 'effects', min: 0, max: 1, step: 0.05, default: 0.3 },

  // Physics (GPGPU)
  { name: 'friction', label: 'Friction', group: 'effects', min: 0.9, max: 0.999, step: 0.001, default: 0.98 },
  { name: 'returnForce', label: 'Return Force', group: 'effects', min: 0, max: 0.1, step: 0.005, default: 0.01 },
  { name: 'gravity', label: 'Gravity', group: 'effects', min: -1, max: 1, step: 0.05, default: 0 },
  { name: 'turbulence', label: 'Turbulence', group: 'effects', min: 0, max: 1, step: 0.05, default: 0 },

  // Camera
  { name: 'cameraX', label: 'Camera X', group: 'camera', min: -500, max: 500, step: 1, default: 0 },
  { name: 'cameraY', label: 'Camera Y', group: 'camera', min: -500, max: 500, step: 1, default: 0 },
  { name: 'cameraZ', label: 'Camera Z', group: 'camera', min: 10, max: 1000, step: 1, default: 150 },
  { name: 'cameraFOV', label: 'FOV', group: 'camera', min: 20, max: 120, step: 1, default: 60, unit: 'deg' },
];

// Animation values (runtime state)
export interface AnimationValues {
  // Transform
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  // Animation
  animationMode: number;
  animationSpeed: number;
  animationIntensity: number;
  // Visual
  brightness: number;
  saturation: number;
  hueShift: number;
  particleSharpness: number;
  // Effects
  bloomIntensity: number;
  breathingIntensity: number;
  shimmerIntensity: number;
  // Physics (GPGPU)
  friction: number;
  returnForce: number;
  gravity: number;
  turbulence: number;
  // Camera
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  cameraFOV: number;
}

// Default values
export const DEFAULT_ANIMATION_VALUES: AnimationValues = {
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  scale: 1,
  animationMode: 0,
  animationSpeed: 1,
  animationIntensity: 1,
  brightness: 1,
  saturation: 1,
  hueShift: 0,
  particleSharpness: 0.5,
  bloomIntensity: 0.6,
  breathingIntensity: 0.5,
  shimmerIntensity: 0.3,
  friction: 0.98,
  returnForce: 0.01,
  gravity: 0,
  turbulence: 0,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 150,
  cameraFOV: 60,
};

// Playback state
export interface PlaybackState {
  isPlaying: boolean;
  position: number; // Current time in seconds
  duration: number; // Total duration in seconds
}

// Export options
export interface ExportOptions {
  format: 'mp4' | 'webm' | 'gif';
  resolution: '720p' | '1080p' | '4k';
  fps: 30 | 60;
  duration: number;
  quality: 'draft' | 'production';
}

// Keyframe data for visualization
export interface Keyframe {
  id: string;
  property: string;
  time: number;
  value: number;
  easing?: string;
}

// Animation preset
export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'intro' | 'loop' | 'dramatic' | 'camera';
  duration: number;
  keyframes: Record<string, Array<{ time: number; value: number; easing?: string }>>;
}
