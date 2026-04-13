/**
 * MorphingParticles.types.ts
 *
 * Type definitions and constants for MorphingParticles component.
 * Separated from component file to prevent HMR Fast Refresh issues.
 */

export type ShapeName =
  | 'sphere'
  | 'cube'
  | 'torus'
  | 'heart'
  | 'star'
  | 'dna-helix'
  | 'wave'
  | 'galaxy';

export const SHAPE_NAMES: ShapeName[] = [
  'sphere',
  'cube',
  'torus',
  'heart',
  'star',
  'dna-helix',
  'wave',
  'galaxy',
];

export const SHAPE_LABELS: Record<ShapeName, string> = {
  'sphere': 'Sphere',
  'cube': 'Cube',
  'torus': 'Torus',
  'heart': 'Heart',
  'star': 'Star',
  'dna-helix': 'DNA Helix',
  'wave': 'Wave',
  'galaxy': 'Galaxy',
};

// Renamed color schemes (no more "graphrag")
export type ColorScheme = 'rainbow' | 'neon' | 'sunset' | 'ocean' | 'forest' | 'custom';

export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  'rainbow': 'Rainbow',
  'neon': 'Neon',
  'sunset': 'Sunset',
  'ocean': 'Ocean',
  'forest': 'Forest',
  'custom': 'Generated',
};

// Custom colors extracted from images
export interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface MorphingParticlesConfig {
  particleCount?: number;
  morphDuration?: number;
  rotationSpeed?: number;
  particleSize?: number;

  // Connection lines (optional)
  enableLines?: boolean;
  lineOpacity?: number;
  connectionDistance?: number;

  colorScheme?: ColorScheme;
  customColors?: CustomColors; // Used when colorScheme is 'custom'
  selectedShape?: ShapeName | null;

  // Visual enhancements
  enableBloom?: boolean;
  bloomIntensity?: number;
  enableTrails?: boolean;
  trailLength?: number;
  enableDepthOfField?: boolean;

  // Interactivity
  enableZoom?: boolean;
  enableHover?: boolean;
  enableKeyboard?: boolean;

  // Animation
  enableBreathing?: boolean;
  breathingSpeed?: number;
  enableStaggeredMorph?: boolean;
  staggerDirection?: 'radial' | 'horizontal' | 'vertical';
}
