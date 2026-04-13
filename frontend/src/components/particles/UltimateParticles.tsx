/**
 * UltimateParticles.tsx - The Definitive Three.js Particle System
 *
 * Combines GPGPU physics with rich visual controls:
 * - GPU-computed position/velocity (1M+ particles @ 60fps)
 * - 12 animation modes (8 classic + 4 strange attractors)
 * - 10 color modes with full visual controls
 * - Region painting with per-region effects
 * - Trails, bloom, mouse interaction
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PointCloudData } from '../../utils/glbToPointCloud';

// ============================================================================
// TYPES
// ============================================================================

export type AnimationMode = 'none' | 'float' | 'wave' | 'vortex' | 'explode' | 'implode' | 'turbulence' | 'magnetic' | 'thomas' | 'lorenz' | 'aizawa' | 'halvorsen';
export type ColorMode = 'original' | 'rainbow' | 'ocean' | 'sunset' | 'neon' | 'fire' | 'matrix' | 'velocity' | 'position' | 'custom';
export type ForceMode = 'repel' | 'attract' | 'orbit' | 'vortex';
export type ShapeType = 'sphere' | 'cube' | 'torus' | 'heart' | 'star' | 'dna' | 'wave' | 'galaxy' | 'nebula' | 'butterfly' | 'aurora' | 'skull' | 'phoenix' | 'rose' | 'custom';

export interface RegionConfig {
  color: [number, number, number];
  animation: number; // 0=none, 1=fire, 2=pulse, 3=electric, 4=rainbow
  intensity: number;
  bloom: number;
}

export interface UltimateParticlesProps {
  // Source
  pointCloud?: PointCloudData | null;
  shape?: ShapeType;
  textureSize?: number; // 512, 1024, 2048 - determines particle count (textureSize²)

  // Animation & Physics
  animationMode?: AnimationMode;
  animationSpeed?: number;
  animationIntensity?: number;
  friction?: number;
  returnForce?: number;
  gravity?: number;
  turbulence?: number;

  // Mouse
  enableMouse?: boolean;
  mouseForce?: number;
  mouseRadius?: number;
  forceMode?: ForceMode;

  // Visual
  particleSize?: number;
  particleSharpness?: number;
  colorMode?: ColorMode;
  brightness?: number;
  saturation?: number;
  hueShift?: number;
  customColor?: string;
  shimmerIntensity?: number;
  rotationSpeed?: number;

  // Effects
  enableBloom?: boolean;
  bloomIntensity?: number;
  enableTrails?: boolean;
  trailLength?: number;
  backgroundColor?: string;

  // Region painting
  paintingMode?: boolean;
  selectedRegion?: number;
  brushRadius?: number;
  regionConfigs?: RegionConfig[];
  onRegionPainted?: (counts: number[]) => void;

  // Explosion control (for explode/implode modes)
  explosionProgress?: number;

  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// SHAPE GENERATORS
// ============================================================================

// Milky Way Galaxy Generator - Stunning spiral galaxy with visible arms
const generateMilkyWay = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Galaxy parameters - optimized for visual impact
  const GALAXY_RADIUS = 65;
  const BULGE_RADIUS = 10;
  const NUM_ARMS = 2;                 // 2 main arms = clearer spiral (like M51)
  const SPIRAL_TIGHTNESS = 0.5;       // Tighter spiral = more wraps
  const ARM_WIDTH = 0.25;             // Narrower arms = more defined

  // Distribution: 20% bulge, 75% disk/arms, 5% scattered
  const bulgeCount = Math.floor(count * 0.20);
  const armCount = Math.floor(count * 0.75);
  const scatterCount = count - bulgeCount - armCount;

  let idx = 0;

  // === CENTRAL BULGE - Bright golden core ===
  for (let i = 0; i < bulgeCount; i++) {
    // Concentrated toward center with Gaussian falloff
    const r = BULGE_RADIUS * Math.sqrt(-Math.log(Math.random() + 0.001)) * 0.5;
    const theta = Math.random() * Math.PI * 2;

    // Face-on galaxy: X-Z is the disk plane, Y is vertical (thin)
    positions[idx * 3] = r * Math.cos(theta);
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 4 * Math.exp(-r / 5); // Very thin
    positions[idx * 3 + 2] = r * Math.sin(theta);

    // Brilliant golden-white core
    const brightness = 0.9 + Math.random() * 0.1;
    const coreGlow = Math.exp(-r / 6);
    colors[idx * 3] = brightness;
    colors[idx * 3 + 1] = brightness * (0.85 + coreGlow * 0.15);
    colors[idx * 3 + 2] = brightness * (0.5 + coreGlow * 0.3);
    idx++;
  }

  // === SPIRAL ARMS - The main visual feature ===
  for (let i = 0; i < armCount; i++) {
    // Pick which arm (0 or 1)
    const armIndex = i % NUM_ARMS;
    const armPhase = (armIndex / NUM_ARMS) * Math.PI * 2;

    // Distance from center - use sqrt for even distribution
    const t = Math.random();
    const r = BULGE_RADIUS * 0.8 + (GALAXY_RADIUS - BULGE_RADIUS) * Math.sqrt(t);

    // Logarithmic spiral: angle increases with ln(radius)
    const spiralAngle = armPhase + SPIRAL_TIGHTNESS * Math.log(r / BULGE_RADIUS + 1) * 3;

    // Gaussian spread perpendicular to arm (narrower = more defined)
    const spread = ARM_WIDTH * (1 + r / GALAXY_RADIUS * 0.5);
    const perpOffset = spread * (Math.random() + Math.random() + Math.random() - 1.5) * 0.7;

    const angle = spiralAngle + perpOffset;

    // Position in face-on orientation (X-Z plane)
    positions[idx * 3] = r * Math.cos(angle);
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 2 * (1 + r / GALAXY_RADIUS); // Thin disk
    positions[idx * 3 + 2] = r * Math.sin(angle);

    // Color based on arm position
    const inArmCore = Math.abs(perpOffset) < spread * 0.3;

    if (inArmCore) {
      // Arm core: bright blue-white star-forming regions
      const starType = Math.random();
      if (starType < 0.4) {
        // Hot blue O/B stars
        colors[idx * 3] = 0.7 + Math.random() * 0.2;
        colors[idx * 3 + 1] = 0.85 + Math.random() * 0.15;
        colors[idx * 3 + 2] = 1.0;
      } else if (starType < 0.6) {
        // Pink H-II regions (nebulae)
        colors[idx * 3] = 1.0;
        colors[idx * 3 + 1] = 0.4 + Math.random() * 0.2;
        colors[idx * 3 + 2] = 0.7 + Math.random() * 0.2;
      } else {
        // Bright white stars
        const w = 0.9 + Math.random() * 0.1;
        colors[idx * 3] = w;
        colors[idx * 3 + 1] = w;
        colors[idx * 3 + 2] = w;
      }
    } else {
      // Arm edges and inter-arm: older yellow/orange stars
      const dimmer = 0.6 + Math.random() * 0.3;
      colors[idx * 3] = dimmer * (0.9 + Math.random() * 0.1);
      colors[idx * 3 + 1] = dimmer * (0.75 + Math.random() * 0.15);
      colors[idx * 3 + 2] = dimmer * (0.4 + Math.random() * 0.2);
    }
    idx++;
  }

  // === SCATTERED DISK STARS - Fill between arms ===
  for (let i = 0; i < scatterCount; i++) {
    const r = Math.random() * GALAXY_RADIUS;
    const angle = Math.random() * Math.PI * 2;

    positions[idx * 3] = r * Math.cos(angle);
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 3;
    positions[idx * 3 + 2] = r * Math.sin(angle);

    // Dim yellow-orange (old disk population)
    const dim = 0.3 + Math.random() * 0.3;
    colors[idx * 3] = dim * 0.95;
    colors[idx * 3 + 1] = dim * 0.7;
    colors[idx * 3 + 2] = dim * 0.4;
    idx++;
  }

  return { positions, colors };
};

// Ultra-Realistic Sun Generator - Extreme detail at all zoom levels
const generateStar3D = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Sun parameters - multi-scale detail
  const CORE_RADIUS = 30;
  const CHROMOSPHERE = 34;
  const CORONA_OUTER = 90;

  // Noise function for turbulence
  const noise3D = (x: number, y: number, z: number, freq: number): number => {
    const n = Math.sin(x * freq) * Math.cos(y * freq * 1.3) * Math.sin(z * freq * 0.9);
    return n * 0.5 + 0.5;
  };

  // Fractal noise for multi-scale detail
  const fractalNoise = (x: number, y: number, z: number): number => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    for (let i = 0; i < 4; i++) {
      value += noise3D(x, y, z, frequency * 0.5) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  };

  // Distribution: 50% photosphere detail, 15% granulation, 10% chromosphere, 15% corona, 10% flares/loops
  const photoCount = Math.floor(count * 0.50);
  const granCount = Math.floor(count * 0.15);
  const chromoCount = Math.floor(count * 0.10);
  const coronaCount = Math.floor(count * 0.15);
  const flareCount = count - photoCount - granCount - chromoCount - coronaCount;

  let idx = 0;

  // === PHOTOSPHERE BASE - Dense surface layer ===
  for (let i = 0; i < photoCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    // Multi-scale surface turbulence
    const x0 = Math.sin(phi) * Math.cos(theta);
    const y0 = Math.sin(phi) * Math.sin(theta);
    const z0 = Math.cos(phi);

    // Large-scale convection + small-scale granulation
    const turbulence = fractalNoise(x0 * 30, y0 * 30, z0 * 30) * 0.03;
    const microTurbulence = noise3D(x0 * 100, y0 * 100, z0 * 100, 1) * 0.01;

    const r = CORE_RADIUS * (0.98 + turbulence + microTurbulence);

    positions[idx * 3] = r * x0;
    positions[idx * 3 + 1] = r * y0;
    positions[idx * 3 + 2] = r * z0;

    // Color varies with surface features
    const featureNoise = fractalNoise(x0 * 20, y0 * 20, z0 * 20);

    // Sunspots (dark), faculae (bright), normal surface
    if (featureNoise < 0.15) {
      // Sunspot - dark with umbra/penumbra gradient
      const umbra = featureNoise < 0.08;
      if (umbra) {
        colors[idx * 3] = 0.25 + Math.random() * 0.1;
        colors[idx * 3 + 1] = 0.1 + Math.random() * 0.05;
        colors[idx * 3 + 2] = 0.02;
      } else {
        // Penumbra - lighter
        colors[idx * 3] = 0.5 + Math.random() * 0.15;
        colors[idx * 3 + 1] = 0.25 + Math.random() * 0.1;
        colors[idx * 3 + 2] = 0.05;
      }
    } else if (featureNoise > 0.85) {
      // Faculae - bright hot spots
      colors[idx * 3] = 1.0;
      colors[idx * 3 + 1] = 1.0;
      colors[idx * 3 + 2] = 0.9 + Math.random() * 0.1;
    } else {
      // Normal photosphere with temperature variation
      const temp = 0.85 + featureNoise * 0.15;
      colors[idx * 3] = 1.0;
      colors[idx * 3 + 1] = temp * 0.92;
      colors[idx * 3 + 2] = temp * 0.65;
    }
    idx++;
  }

  // === GRANULATION CELLS - Convection patterns visible when zoomed ===
  for (let i = 0; i < granCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x0 = Math.sin(phi) * Math.cos(theta);
    const y0 = Math.sin(phi) * Math.sin(theta);
    const z0 = Math.cos(phi);

    // Granulation: cells with bright centers and dark edges
    const cellPhase = noise3D(x0 * 60, y0 * 60, z0 * 60, 1);
    const isEdge = cellPhase < 0.3 || cellPhase > 0.7;

    // Cells rise slightly above surface
    const cellHeight = isEdge ? 0 : 0.02 + Math.random() * 0.01;
    const r = CORE_RADIUS * (1.0 + cellHeight);

    // Add micro-turbulence within cells
    const microOffset = 0.3 * Math.random();
    positions[idx * 3] = r * x0 + (Math.random() - 0.5) * microOffset;
    positions[idx * 3 + 1] = r * y0 + (Math.random() - 0.5) * microOffset;
    positions[idx * 3 + 2] = r * z0 + (Math.random() - 0.5) * microOffset;

    if (isEdge) {
      // Intergranular lanes - darker, cooler
      colors[idx * 3] = 0.85 + Math.random() * 0.1;
      colors[idx * 3 + 1] = 0.7 + Math.random() * 0.1;
      colors[idx * 3 + 2] = 0.4 + Math.random() * 0.1;
    } else {
      // Granule centers - hotter, brighter, rising plasma
      colors[idx * 3] = 1.0;
      colors[idx * 3 + 1] = 0.95 + Math.random() * 0.05;
      colors[idx * 3 + 2] = 0.75 + Math.random() * 0.1;
    }
    idx++;
  }

  // === CHROMOSPHERE - Spicule forest + plages ===
  for (let i = 0; i < chromoCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x0 = Math.sin(phi) * Math.cos(theta);
    const y0 = Math.sin(phi) * Math.sin(theta);
    const z0 = Math.cos(phi);

    // Spicules - jets of plasma shooting up
    const isSpicule = Math.random() < 0.4;

    if (isSpicule) {
      // Spicule jet - extends outward
      const spiculeHeight = 2 + Math.random() * 4;
      const spiculeT = Math.random(); // Position along spicule
      const r = CORE_RADIUS + spiculeHeight * spiculeT;

      // Slight wobble
      const wobble = 0.3 * (1 - spiculeT);
      positions[idx * 3] = r * x0 + (Math.random() - 0.5) * wobble;
      positions[idx * 3 + 1] = r * y0 + (Math.random() - 0.5) * wobble;
      positions[idx * 3 + 2] = r * z0 + (Math.random() - 0.5) * wobble;

      // Spicules are red/orange, dimmer at top
      const fade = 1 - spiculeT * 0.5;
      colors[idx * 3] = fade * 1.0;
      colors[idx * 3 + 1] = fade * 0.35;
      colors[idx * 3 + 2] = fade * 0.15;
    } else {
      // Chromosphere base layer
      const r = CORE_RADIUS + Math.random() * 2;
      positions[idx * 3] = r * x0;
      positions[idx * 3 + 1] = r * y0;
      positions[idx * 3 + 2] = r * z0;

      // Deep red H-alpha
      colors[idx * 3] = 1.0;
      colors[idx * 3 + 1] = 0.25 + Math.random() * 0.15;
      colors[idx * 3 + 2] = 0.1;
    }
    idx++;
  }

  // === CORONA - Streamers, loops, and plasma ===
  for (let i = 0; i < coronaCount; i++) {
    const coronaType = Math.random();

    if (coronaType < 0.4) {
      // Coronal loops - magnetic arches
      const loopTheta = Math.random() * Math.PI * 2;
      const loopPhi = Math.PI / 2 + (Math.random() - 0.5) * 1.2; // Near equator

      const loopHeight = 10 + Math.random() * 25;
      const loopSpan = 0.3 + Math.random() * 0.4;
      const t = Math.random(); // Position along loop

      // Arch shape
      const archAngle = t * Math.PI;
      const archHeight = Math.sin(archAngle) * loopHeight;
      const archOffset = (t - 0.5) * loopSpan;

      const baseX = CORE_RADIUS * Math.sin(loopPhi) * Math.cos(loopTheta);
      const baseY = CORE_RADIUS * Math.sin(loopPhi) * Math.sin(loopTheta);
      const baseZ = CORE_RADIUS * Math.cos(loopPhi);

      const outX = Math.sin(loopPhi) * Math.cos(loopTheta);
      const outY = Math.sin(loopPhi) * Math.sin(loopTheta);
      const outZ = Math.cos(loopPhi);

      const tangentX = -Math.sin(loopTheta);
      const tangentY = Math.cos(loopTheta);

      positions[idx * 3] = baseX + outX * archHeight + tangentX * archOffset * CORE_RADIUS;
      positions[idx * 3 + 1] = baseY + outY * archHeight + tangentY * archOffset * CORE_RADIUS;
      positions[idx * 3 + 2] = baseZ + outZ * archHeight;

      // Loops glow hot - white to orange
      const loopBright = 0.6 + Math.sin(archAngle) * 0.4;
      colors[idx * 3] = loopBright;
      colors[idx * 3 + 1] = loopBright * 0.85;
      colors[idx * 3 + 2] = loopBright * 0.6;
    } else if (coronaType < 0.7) {
      // Streamers - extended rays
      const streamerAngle = Math.floor(Math.random() * 8) * (Math.PI / 4) + (Math.random() - 0.5) * 0.3;
      const streamerPhi = Math.PI / 2 + (Math.random() - 0.5) * 0.8;

      const dist = CHROMOSPHERE + Math.pow(Math.random(), 0.4) * (CORONA_OUTER - CHROMOSPHERE);

      const x = dist * Math.sin(streamerPhi) * Math.cos(streamerAngle);
      const y = dist * Math.sin(streamerPhi) * Math.sin(streamerAngle);
      const z = dist * Math.cos(streamerPhi);

      // Add streamer width
      const width = 2 + (dist / CORONA_OUTER) * 5;
      positions[idx * 3] = x + (Math.random() - 0.5) * width;
      positions[idx * 3 + 1] = y + (Math.random() - 0.5) * width;
      positions[idx * 3 + 2] = z + (Math.random() - 0.5) * width * 0.5;

      // Streamers fade with distance
      const fade = Math.exp(-(dist - CHROMOSPHERE) / 40);
      colors[idx * 3] = fade * 0.95;
      colors[idx * 3 + 1] = fade * 0.9;
      colors[idx * 3 + 2] = fade * 0.8;
    } else {
      // Diffuse corona
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = CHROMOSPHERE + Math.pow(Math.random(), 0.6) * (CORONA_OUTER - CHROMOSPHERE) * 0.7;

      positions[idx * 3] = dist * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = dist * Math.cos(phi);

      const fade = Math.exp(-(dist - CHROMOSPHERE) / 35) * 0.5;
      colors[idx * 3] = fade * 0.9;
      colors[idx * 3 + 1] = fade * 0.85;
      colors[idx * 3 + 2] = fade * 0.75;
    }
    idx++;
  }

  // === SOLAR FLARES, PROMINENCES & CMEs ===
  const NUM_MAJOR_FLARES = 5;
  const NUM_MINOR_FLARES = 12;
  const majorFlareParticles = Math.floor(flareCount * 0.6 / NUM_MAJOR_FLARES);
  const minorFlareParticles = Math.floor(flareCount * 0.4 / NUM_MINOR_FLARES);

  // Major flares - huge eruptions
  for (let f = 0; f < NUM_MAJOR_FLARES; f++) {
    const flareTheta = Math.random() * Math.PI * 2;
    const flarePhi = Math.PI / 2 + (Math.random() - 0.5) * 1.5;

    const flareHeight = 30 + Math.random() * 50;
    const flareWidth = 8 + Math.random() * 12;

    const baseX = CORE_RADIUS * Math.sin(flarePhi) * Math.cos(flareTheta);
    const baseY = CORE_RADIUS * Math.sin(flarePhi) * Math.sin(flareTheta);
    const baseZ = CORE_RADIUS * Math.cos(flarePhi);

    const dirX = Math.sin(flarePhi) * Math.cos(flareTheta);
    const dirY = Math.sin(flarePhi) * Math.sin(flareTheta);
    const dirZ = Math.cos(flarePhi);

    for (let i = 0; i < majorFlareParticles && idx < count; i++) {
      const t = Math.pow(Math.random(), 0.7);
      const angle = Math.random() * Math.PI * 2;

      // Twisted rope structure
      const twist = t * 3;
      const ropeR = flareWidth * (1 - t * 0.5) * (0.3 + Math.random() * 0.7);

      const height = t * flareHeight;
      const offX = Math.cos(angle + twist) * ropeR;
      const offY = Math.sin(angle + twist) * ropeR;

      // Turbulent motion
      const turb = 2 * (1 - t);
      positions[idx * 3] = baseX + dirX * height + offX + (Math.random() - 0.5) * turb;
      positions[idx * 3 + 1] = baseY + dirY * height + offY + (Math.random() - 0.5) * turb;
      positions[idx * 3 + 2] = baseZ + dirZ * height + (Math.random() - 0.5) * turb;

      // Hot orange-red plasma
      const intensity = 0.8 + (1 - t) * 0.2;
      colors[idx * 3] = intensity;
      colors[idx * 3 + 1] = intensity * (0.3 + t * 0.25);
      colors[idx * 3 + 2] = intensity * (0.05 + t * 0.15);
      idx++;
    }
  }

  // Minor flares - smaller surface eruptions
  for (let f = 0; f < NUM_MINOR_FLARES; f++) {
    const flareTheta = Math.random() * Math.PI * 2;
    const flarePhi = Math.acos(2 * Math.random() - 1);

    const flareHeight = 5 + Math.random() * 15;

    const baseX = CORE_RADIUS * Math.sin(flarePhi) * Math.cos(flareTheta);
    const baseY = CORE_RADIUS * Math.sin(flarePhi) * Math.sin(flareTheta);
    const baseZ = CORE_RADIUS * Math.cos(flarePhi);

    const dirX = Math.sin(flarePhi) * Math.cos(flareTheta);
    const dirY = Math.sin(flarePhi) * Math.sin(flareTheta);
    const dirZ = Math.cos(flarePhi);

    for (let i = 0; i < minorFlareParticles && idx < count; i++) {
      const t = Math.random();
      const spread = 2 * (1 - t * 0.7);

      positions[idx * 3] = baseX + dirX * t * flareHeight + (Math.random() - 0.5) * spread;
      positions[idx * 3 + 1] = baseY + dirY * t * flareHeight + (Math.random() - 0.5) * spread;
      positions[idx * 3 + 2] = baseZ + dirZ * t * flareHeight + (Math.random() - 0.5) * spread;

      const intensity = 0.7 + (1 - t) * 0.3;
      colors[idx * 3] = intensity;
      colors[idx * 3 + 1] = intensity * 0.4;
      colors[idx * 3 + 2] = intensity * 0.1;
      idx++;
    }
  }

  return { positions, colors };
};

// Simple 3D noise function for organic effects
const noise3D = (x: number, y: number, z: number): number => {
  const n = Math.sin(x * 1.2) * Math.cos(y * 0.9) * Math.sin(z * 1.1);
  return n * 0.5 + 0.5;
};

// Nebula Generator - Dreamy volumetric cloud with colored lights (Red Stapler technique)
const generateNebula = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Volumetric cloud distribution - inspired by proven nebula effects
  const RADIUS = 60;

  for (let i = 0; i < count; i++) {
    // Layered cloud distribution - denser toward center
    const layer = Math.floor(Math.random() * 5);
    const layerRadius = RADIUS * (0.3 + layer * 0.15);

    // Organic noise-based positioning
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const baseR = layerRadius * (0.5 + Math.random() * 0.5);

    let x = baseR * Math.sin(phi) * Math.cos(theta);
    let y = baseR * Math.sin(phi) * Math.sin(theta) * 0.6; // Flatten
    let z = baseR * Math.cos(phi);

    // Add turbulent displacement for cloud-like appearance
    const turbScale = 0.02;
    const turbulence = noise3D(x * turbScale, y * turbScale, z * turbScale);
    const displacement = 15 * turbulence;
    x += (Math.random() - 0.5) * displacement;
    y += (Math.random() - 0.5) * displacement;
    z += (Math.random() - 0.5) * displacement;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Multi-colored lighting: orange, red, blue (proven color scheme)
    const dist = Math.sqrt(x * x + y * y + z * z);
    const normalizedDist = dist / RADIUS;

    // Simulate three colored point lights at different positions
    const orangeLight = Math.max(0, 1 - Math.sqrt((x - 30) ** 2 + (y - 10) ** 2 + z ** 2) / 50);
    const redLight = Math.max(0, 1 - Math.sqrt((x + 20) ** 2 + y ** 2 + (z - 20) ** 2) / 45);
    const blueLight = Math.max(0, 1 - Math.sqrt(x ** 2 + (y + 15) ** 2 + (z + 25) ** 2) / 55);

    // Blend lights with base luminosity
    const baseBright = 0.3 + (1 - normalizedDist) * 0.4;
    colors[i * 3] = Math.min(1, baseBright + orangeLight * 0.8 + redLight * 0.85);
    colors[i * 3 + 1] = Math.min(1, baseBright * 0.7 + orangeLight * 0.4 + blueLight * 0.3);
    colors[i * 3 + 2] = Math.min(1, baseBright * 0.5 + blueLight * 0.85 + redLight * 0.3);
  }

  return { positions, colors };
};

// Butterfly Generator - Lorenz attractor with dreamy golden glow (Codrops technique)
const generateButterfly = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Lorenz attractor - mathematically elegant chaos
  const sigma = 10, rho = 28, beta = 8 / 3;
  const dt = 0.003;
  const scale = 2.2;

  // More trajectories = smoother density
  const trajectories = 80;
  const pointsPerTrajectory = Math.floor(count / trajectories);

  let idx = 0;

  for (let t = 0; t < trajectories; t++) {
    let x = (Math.random() - 0.5) * 4;
    let y = (Math.random() - 0.5) * 4;
    let z = 20 + Math.random() * 10;

    // Settle into attractor
    for (let s = 0; s < 200; s++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
    }

    for (let i = 0; i < pointsPerTrajectory && idx < count; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;

      // Store velocity magnitude for color intensity
      const velocity = Math.sqrt(dx * dx + dy * dy + dz * dz);

      x += dx * dt; y += dy * dt; z += dz * dt;

      positions[idx * 3] = x * scale;
      positions[idx * 3 + 1] = (z - 25) * scale;
      positions[idx * 3 + 2] = y * scale;

      // Dreamy amber-gold glow that brightens with velocity (Codrops technique)
      // Base color: warm golden (0.808, 0.647, 0.239)
      const velocityFactor = Math.min(1, velocity * 0.01);
      const brightness = 0.4 + velocityFactor * 0.6;

      colors[idx * 3] = brightness * 0.85;     // R - warm
      colors[idx * 3 + 1] = brightness * 0.65; // G - golden
      colors[idx * 3 + 2] = brightness * 0.25; // B - minimal for warmth
      idx++;
    }
  }

  // Fill remaining
  while (idx < count) {
    positions[idx * 3] = (Math.random() - 0.5) * 3;
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 3;
    colors[idx * 3] = 0.4; colors[idx * 3 + 1] = 0.3; colors[idx * 3 + 2] = 0.1;
    idx++;
  }

  return { positions, colors };
};

// Aurora - Real aurora physics: vertical rays, altitude-based colors, ethereal glow
// Based on actual aurora borealis structure: curtain ribbons with vertical striations
const generateAurora = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Aurora dimensions (wide curtain with tall vertical rays)
  const WIDTH = 150;
  const HEIGHT = 100;
  const DEPTH = 25;
  const NUM_RAYS = 60; // Vertical striations (rays of light)
  const NUM_CURTAINS = 3;

  for (let i = 0; i < count; i++) {
    // Assign to curtain and ray
    const curtain = i % NUM_CURTAINS;
    const ray = Math.floor((i / NUM_CURTAINS) % NUM_RAYS);

    // X position: discrete rays with slight spread
    const rayX = (ray / NUM_RAYS - 0.5) * WIDTH;
    const raySpread = (Math.random() - 0.5) * 3; // Slight horizontal spread within ray
    const x = rayX + raySpread;

    // Y position: exponential concentration at bottom (aurora base is brightest)
    // Use power function to cluster particles at the luminous bottom edge
    const yRandom = Math.random();
    const yProgress = Math.pow(yRandom, 0.3); // Heavy concentration at bottom
    const y = (yProgress - 0.3) * HEIGHT; // Offset to center vertically

    // Curtain wave physics - sinusoidal waves travel along the curtain
    const wavePhase = curtain * 2.1 + rayX * 0.03; // Phase offset per curtain and position
    const primaryWave = Math.sin(wavePhase) * 8;
    const secondaryWave = Math.sin(wavePhase * 2.3 + 1.0) * 4;
    const wave = primaryWave + secondaryWave;

    // Z depth: curtain layers + wave undulation
    const curtainZ = (curtain / NUM_CURTAINS - 0.5) * DEPTH;
    const z = curtainZ + wave * (0.4 + yProgress * 0.6);

    // Add ethereal diffusion at edges (particles spread more at top)
    const diffusion = yProgress * 2;
    const diffuseX = (Math.random() - 0.5) * diffusion;
    const diffuseZ = (Math.random() - 0.5) * diffusion;

    positions[i * 3] = x + diffuseX;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z + diffuseZ;

    // Color based on altitude (real aurora physics)
    // Bottom (100km): Bright green (oxygen emission 557.7nm)
    // Middle: Cyan/teal transition
    // Top (200km+): Deep purple/red (nitrogen emission)
    const altitude = yProgress; // 0 = bottom (brightest), 1 = top (diffuse)

    // Brightness: brightest at bottom, fading toward top
    const baseBrightness = 1.0 - altitude * 0.6;
    // Add slight pulsation variation per ray
    const rayPulse = 0.9 + Math.sin(ray * 0.5) * 0.1;
    const brightness = baseBrightness * rayPulse;

    let r: number, g: number, b: number;

    if (altitude < 0.35) {
      // Bottom zone: Vivid green (oxygen emission)
      r = 0.1;
      g = 1.0;
      b = 0.25;
    } else if (altitude < 0.55) {
      // Lower-middle: Green to cyan transition
      const t = (altitude - 0.35) / 0.2;
      r = 0.1 + t * 0.1;
      g = 1.0 - t * 0.15;
      b = 0.25 + t * 0.45;
    } else if (altitude < 0.75) {
      // Upper-middle: Cyan to blue-purple
      const t = (altitude - 0.55) / 0.2;
      r = 0.2 + t * 0.4;
      g = 0.85 - t * 0.35;
      b = 0.7 + t * 0.2;
    } else {
      // Top zone: Deep purple/magenta (nitrogen emission)
      const t = (altitude - 0.75) / 0.25;
      r = 0.6 + t * 0.3;
      g = 0.5 - t * 0.3;
      b = 0.9 + t * 0.1;
    }

    // Apply brightness with slight color boost at bottom
    colors[i * 3] = r * brightness;
    colors[i * 3 + 1] = g * brightness * 1.1; // Green slightly boosted
    colors[i * 3 + 2] = b * brightness;
  }

  return { positions, colors };
};

// Skull renamed to "Starburst" - Fireworks explosion effect (proven stunning)
const generateSkull = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Multiple burst points for fireworks effect
  const NUM_BURSTS = 7;
  const particlesPerBurst = Math.floor(count / NUM_BURSTS);

  let idx = 0;

  for (let burst = 0; burst < NUM_BURSTS; burst++) {
    // Each burst has a center position
    const burstX = (Math.random() - 0.5) * 60;
    const burstY = (Math.random() - 0.5) * 60;
    const burstZ = (Math.random() - 0.5) * 40;
    const burstRadius = 20 + Math.random() * 25;

    // Color theme for this burst (cycling through stunning colors)
    const hue = (burst / NUM_BURSTS + Math.random() * 0.1) % 1;

    for (let i = 0; i < particlesPerBurst && idx < count; i++) {
      // Spherical explosion pattern with trailing effect
      const t = i / particlesPerBurst;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Particles spread outward, denser at edges (inverse distribution)
      const r = burstRadius * Math.pow(t, 0.3);

      // Slight gravity droop for realism
      const droop = t * t * 15;

      positions[idx * 3] = burstX + r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = burstY + r * Math.cos(phi) - droop;
      positions[idx * 3 + 2] = burstZ + r * Math.sin(phi) * Math.sin(theta);

      // Brightness fades toward edges, creating glowing core
      const brightness = 1 - t * 0.6;

      // HSV to RGB for vibrant firework colors
      const h = hue, s = 0.8, v = brightness;
      const hi = Math.floor(h * 6) % 6;
      const f = h * 6 - Math.floor(h * 6);
      const p = v * (1 - s), q = v * (1 - f * s), tt = v * (1 - (1 - f) * s);

      let r_c = 0, g = 0, b = 0;
      if (hi === 0) { r_c = v; g = tt; b = p; }
      else if (hi === 1) { r_c = q; g = v; b = p; }
      else if (hi === 2) { r_c = p; g = v; b = tt; }
      else if (hi === 3) { r_c = p; g = q; b = v; }
      else if (hi === 4) { r_c = tt; g = p; b = v; }
      else { r_c = v; g = p; b = q; }

      colors[idx * 3] = r_c;
      colors[idx * 3 + 1] = g;
      colors[idx * 3 + 2] = b;
      idx++;
    }
  }

  // Fill remaining with sparkles
  while (idx < count) {
    positions[idx * 3] = (Math.random() - 0.5) * 100;
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 100;
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 60;
    const spark = 0.3 + Math.random() * 0.4;
    colors[idx * 3] = spark; colors[idx * 3 + 1] = spark; colors[idx * 3 + 2] = spark * 0.8;
    idx++;
  }

  return { positions, colors };
};

// Phoenix renamed to "Helix" - Elegant double helix spiral (mathematically beautiful)
const generatePhoenix = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const HEIGHT = 100;
  const RADIUS = 25;
  const TURNS = 4;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const strand = i % 2; // Two intertwined strands

    // Helix equations
    const angle = t * Math.PI * 2 * TURNS + strand * Math.PI; // Offset by 180° for double helix
    const y = (t - 0.5) * HEIGHT;

    // Slight radius variation for organic feel
    const radiusVariation = RADIUS * (1 + 0.1 * Math.sin(t * 20));

    let x = Math.cos(angle) * radiusVariation;
    let z = Math.sin(angle) * radiusVariation;

    // Add connecting "rungs" between strands (like DNA base pairs)
    if (Math.random() < 0.15) {
      const rungPos = Math.random();
      x *= rungPos;
      z *= rungPos;
    }

    // Slight noise for organic feel
    x += (Math.random() - 0.5) * 2;
    z += (Math.random() - 0.5) * 2;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Gradient colors along the helix - cyan to magenta
    const brightness = 0.7 + 0.3 * Math.sin(t * Math.PI * 8);

    if (strand === 0) {
      // Strand 1: Cyan to blue
      colors[i * 3] = brightness * 0.2;
      colors[i * 3 + 1] = brightness * 0.8;
      colors[i * 3 + 2] = brightness * 1.0;
    } else {
      // Strand 2: Magenta to pink
      colors[i * 3] = brightness * 1.0;
      colors[i * 3 + 1] = brightness * 0.3;
      colors[i * 3 + 2] = brightness * 0.8;
    }
  }

  return { positions, colors };
};

// Rose renamed to "Flower" - Sunflower phyllotaxis (golden angle spiral - proven beautiful)
const generateRose = (count: number): { positions: Float32Array; colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Golden angle phyllotaxis - the mathematical pattern found in sunflowers
  const GOLDEN_ANGLE = 2.39996322972865; // 137.5 degrees in radians
  const RADIUS = 50;

  for (let i = 0; i < count; i++) {
    const t = i / count;

    // Phyllotaxis: each particle at golden angle from previous
    const angle = i * GOLDEN_ANGLE;

    // Fermat spiral: radius increases with sqrt of index
    const r = RADIUS * Math.sqrt(i / count);

    // Create dome shape by curving up at edges
    const dome = Math.pow(1 - t, 0.5) * 30;

    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = dome - 15; // Center the flower

    // Slight z-offset for depth
    const depthOffset = Math.sin(angle * 3) * 3 * t;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y + depthOffset;
    positions[i * 3 + 2] = z;

    // Sunflower colors: golden center fading to orange petals
    const brightness = 0.6 + 0.4 * (1 - t); // Brighter at center

    if (t < 0.3) {
      // Center seeds - dark brown/gold
      colors[i * 3] = brightness * 0.6;
      colors[i * 3 + 1] = brightness * 0.4;
      colors[i * 3 + 2] = brightness * 0.1;
    } else if (t < 0.5) {
      // Inner petals - bright yellow
      colors[i * 3] = brightness * 1.0;
      colors[i * 3 + 1] = brightness * 0.85;
      colors[i * 3 + 2] = brightness * 0.2;
    } else {
      // Outer petals - orange gradient
      const orangeT = (t - 0.5) / 0.5;
      colors[i * 3] = brightness * 1.0;
      colors[i * 3 + 1] = brightness * (0.7 - orangeT * 0.4);
      colors[i * 3 + 2] = brightness * (0.1 + orangeT * 0.1);
    }
  }

  return { positions, colors };
};

const generateShape = (type: ShapeType, count: number): { positions: Float32Array; colors: Float32Array } => {
  // Special generators for complex shapes
  if (type === 'galaxy') {
    return generateMilkyWay(count);
  }
  if (type === 'star') {
    return generateStar3D(count);
  }
  if (type === 'nebula') {
    return generateNebula(count);
  }
  if (type === 'butterfly') {
    return generateButterfly(count);
  }
  if (type === 'aurora') {
    return generateAurora(count);
  }
  if (type === 'skull') {
    return generateSkull(count);
  }
  if (type === 'phoenix') {
    return generatePhoenix(count);
  }
  if (type === 'rose') {
    return generateRose(count);
  }

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const t = i / count;

    switch (type) {
      case 'sphere': {
        const phi = Math.acos(1 - 2 * (i + 0.5) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = 50 * (0.9 + Math.random() * 0.2);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.cos(phi);
        z = r * Math.sin(phi) * Math.sin(theta);
        break;
      }
      case 'cube': {
        const face = Math.floor(Math.random() * 6);
        const u = (Math.random() - 0.5) * 60, v = (Math.random() - 0.5) * 60;
        if (face === 0) { x = 30; y = u; z = v; }
        else if (face === 1) { x = -30; y = u; z = v; }
        else if (face === 2) { x = u; y = 30; z = v; }
        else if (face === 3) { x = u; y = -30; z = v; }
        else if (face === 4) { x = u; y = v; z = 30; }
        else { x = u; y = v; z = -30; }
        break;
      }
      case 'torus': {
        const u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 2;
        x = (40 + 15 * Math.cos(v)) * Math.cos(u);
        y = (40 + 15 * Math.cos(v)) * Math.sin(u);
        z = 15 * Math.sin(v);
        break;
      }
      case 'heart': {
        const ht = Math.random() * Math.PI * 2;
        x = 16 * Math.pow(Math.sin(ht), 3) * 3;
        y = (13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht)) * 3;
        z = (Math.random() - 0.5) * 18;
        break;
      }
      case 'dna': {
        const dt = (i / count) * Math.PI * 6;
        y = (i / count - 0.5) * 100;
        const strand = Math.random() > 0.5 ? 1 : -1;
        x = Math.cos(dt + strand * Math.PI) * 25 + (Math.random() - 0.5) * 5;
        z = Math.sin(dt + strand * Math.PI) * 25 + (Math.random() - 0.5) * 5;
        break;
      }
      case 'wave': {
        x = (Math.random() - 0.5) * 80; z = (Math.random() - 0.5) * 80;
        y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 20;
        break;
      }
      default:
        x = (Math.random() - 0.5) * 100;
        y = (Math.random() - 0.5) * 100;
        z = (Math.random() - 0.5) * 100;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Rainbow gradient colors for basic shapes
    colors[i * 3] = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
    colors[i * 3 + 1] = Math.sin(t * Math.PI * 2 + 2.094) * 0.5 + 0.5;
    colors[i * 3 + 2] = Math.sin(t * Math.PI * 2 + 4.189) * 0.5 + 0.5;
  }

  return { positions, colors };
};

// ============================================================================
// GPGPU SHADERS
// ============================================================================

const velocityShader = `
uniform float uTime, uDeltaTime, uFriction, uAnimationIntensity, uAnimationSpeed;
uniform float uGravity, uTurbulence, uMouseForce, uMouseRadius, uMouseEnabled;
uniform float uExplosionProgress;
uniform int uAnimationMode, uForceMode;
uniform vec3 uMousePosition;
uniform sampler2D textureOriginalPosition;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - 0.5;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec4 j = p - 49.0 * floor(p * (1.0/49.0));
  vec4 x_ = floor(j * (1.0/7.0));
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * (2.0/7.0) + (0.5/7.0) - 1.0;
  vec4 y = y_ * (2.0/7.0) + (0.5/7.0) - 1.0;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 curlNoise(vec3 p) {
  float e = 0.1;
  return normalize(vec3(
    snoise(p + vec3(0,e,0)) - snoise(p - vec3(0,e,0)) - snoise(p + vec3(0,0,e)) + snoise(p - vec3(0,0,e)),
    snoise(p + vec3(0,0,e)) - snoise(p - vec3(0,0,e)) - snoise(p + vec3(e,0,0)) + snoise(p - vec3(e,0,0)),
    snoise(p + vec3(e,0,0)) - snoise(p - vec3(e,0,0)) - snoise(p + vec3(0,e,0)) + snoise(p - vec3(0,e,0))
  ));
}

// Strange attractors
vec3 thomasAttractor(vec3 p) {
  float b = 0.208186;
  return vec3((-b * p.x + sin(p.y)), (-b * p.y + sin(p.z)), (-b * p.z + sin(p.x))) * 0.1;
}
vec3 lorenzAttractor(vec3 p) {
  return vec3(10.0 * (p.y - p.x), p.x * (28.0 - p.z) - p.y, p.x * p.y - 2.666 * p.z) * 0.005;
}
vec3 aizawaAttractor(vec3 p) {
  float a=0.95, b=0.7, c=0.6, d=3.5, e=0.25, f=0.1;
  return vec3(
    (p.z - b) * p.x - d * p.y,
    d * p.x + (p.z - b) * p.y,
    c + a * p.z - p.z*p.z*p.z/3.0 - (p.x*p.x + p.y*p.y) * (1.0 + e * p.z) + f * p.z * p.x*p.x*p.x
  ) * 0.01;
}
vec3 halvorsenAttractor(vec3 p) {
  float a = 1.89;
  return vec3(
    -a * p.x - 4.0 * p.y - 4.0 * p.z - p.y * p.y,
    -a * p.y - 4.0 * p.z - 4.0 * p.x - p.z * p.z,
    -a * p.z - 4.0 * p.x - 4.0 * p.y - p.x * p.x
  ) * 0.005;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  vec4 origData = texture2D(textureOriginalPosition, uv);
  vec3 origPos = origData.xyz;
  float dist = length(origPos);

  vel *= uFriction;
  vec3 force = vec3(0.0);
  float t = uTime * uAnimationSpeed;
  float seed = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);

  // Animation modes: 0=none,1=float,2=wave,3=vortex,4=explode,5=implode,6=turbulence,7=magnetic,8=thomas,9=lorenz,10=aizawa,11=halvorsen
  if (uAnimationMode == 1) { // Float
    force.y += sin(t + seed * 6.28) * 0.02;
    force.x += sin(t * 0.7 + seed * 3.14) * 0.01;
  } else if (uAnimationMode == 2) { // Wave
    force += normalize(origPos + 0.001) * sin(dist * 0.05 - t * 2.0) * 0.05;
  } else if (uAnimationMode == 3) { // Vortex
    float angle = t * 0.5 + dist * 0.02;
    force.x += -pos.z * sin(angle) * 0.02;
    force.z += pos.x * sin(angle) * 0.02;
    force.y += sin(t + dist * 0.03) * 0.02;
  } else if (uAnimationMode == 4) { // Explode
    vec3 dir = normalize(origPos + 0.001);
    force += dir * uExplosionProgress * 2.0 + dir * seed * uExplosionProgress;
  } else if (uAnimationMode == 5) { // Implode
    vec3 toCenter = -normalize(origPos + 0.001);
    force += toCenter * uExplosionProgress * 1.5;
  } else if (uAnimationMode == 6) { // Turbulence
    force += curlNoise(pos * 0.02 + t * 0.5) * 0.15;
  } else if (uAnimationMode == 7) { // Magnetic
    float pole = sin(origPos.y * 0.02 + t);
    force.x += pole * 0.05 * sign(origPos.x);
    force.z += pole * 0.05 * sign(origPos.z);
  } else if (uAnimationMode == 8) { // Thomas
    force += thomasAttractor(pos * 0.02 + t * 0.1);
  } else if (uAnimationMode == 9) { // Lorenz
    force += lorenzAttractor(pos * 0.002);
  } else if (uAnimationMode == 10) { // Aizawa
    force += aizawaAttractor(pos * 0.01);
  } else if (uAnimationMode == 11) { // Halvorsen
    force += halvorsenAttractor(pos * 0.006);
  }

  vel += force * uAnimationIntensity;
  vel.y -= uGravity * 0.01;
  vel += curlNoise(pos * 0.02 + t * 0.3) * uTurbulence * 0.1;

  // Mouse interaction - Physics-based force models
  if (uMouseEnabled > 0.5) {
    vec3 toMouse = uMousePosition - pos;
    float mouseDist = length(toMouse);

    if (mouseDist > 0.01) {
      vec3 dir = normalize(toMouse);

      // Inverse square law with soft core (prevents infinite force at center)
      // Based on real gravitational physics: F = G * m1 * m2 / r²
      float softening = uMouseRadius * 0.15; // Soft core radius
      float invSquare = 1.0 / (mouseDist * mouseDist + softening * softening);

      // Smooth falloff at extended range (3x radius for gradual effect)
      float extendedRadius = uMouseRadius * 3.0;
      float falloff = smoothstep(extendedRadius, 0.0, mouseDist);

      // Combined strength: inverse square law * smooth falloff * user force
      float strength = uMouseForce * invSquare * falloff * uMouseRadius * 0.5;

      // Damping near center to prevent excessive velocities
      float centerDamping = smoothstep(0.0, softening * 2.0, mouseDist);
      strength *= centerDamping;

      if (uForceMode == 0) {
        // REPEL - Push away with inverse square falloff
        vel -= dir * strength;
      } else if (uForceMode == 1) {
        // ATTRACT - Gravity well (realistic gravitational attraction)
        vel += dir * strength;
        // Add slight damping as particles approach center
        if (mouseDist < uMouseRadius) {
          vel *= 0.98;
        }
      } else if (uForceMode == 2) {
        // ORBIT - Stable circular orbit around cursor
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 tangent = normalize(cross(dir, up));
        // Orbital velocity + slight inward pull for stability
        float orbitalStrength = strength * 1.5;
        float inwardPull = strength * 0.2 * (1.0 - mouseDist / uMouseRadius);
        vel += tangent * orbitalStrength;
        vel += dir * inwardPull;
      } else {
        // VORTEX - Spiral inward with rotation (like water drain)
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 tangent = normalize(cross(dir, up));
        // Tangential (spinning) component increases as particles get closer
        float spinFactor = smoothstep(uMouseRadius * 2.0, 0.0, mouseDist);
        float tangentialStrength = strength * (1.0 + spinFactor * 2.0);
        // Inward pull (the "drain" effect)
        float inwardStrength = strength * 0.5;
        vel += tangent * tangentialStrength;
        vel += dir * inwardStrength;
      }
    }
  }

  float maxVel = 3.0;
  if (length(vel) > maxVel) vel = normalize(vel) * maxVel;

  gl_FragColor = vec4(vel, 1.0);
}
`;

const positionShader = `
uniform float uDeltaTime, uReturnForce;
uniform sampler2D textureOriginalPosition;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  vec3 origPos = texture2D(textureOriginalPosition, uv).xyz;

  pos += vel * uDeltaTime * 60.0;

  vec3 toOrigin = origPos - pos;
  float dist = length(toOrigin);
  if (dist > 0.1) {
    pos += normalize(toOrigin) * uReturnForce * uDeltaTime * 60.0 * min(dist * 0.1, 1.0);
  }

  gl_FragColor = vec4(pos, 1.0);
}
`;

// ============================================================================
// RENDER SHADERS
// ============================================================================

const renderVertexShader = `
attribute float particleIndex;
attribute vec3 originalColor;
attribute float region;

uniform sampler2D texturePosition, textureVelocity;
uniform float uTextureSize, uParticleSize, uPixelRatio, uTime, uShimmer;
uniform int uColorMode;

varying vec3 vColor;
varying float vVelMag, vRegion, vRandom;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float u = (mod(particleIndex, uTextureSize) + 0.5) / uTextureSize;
  float v = (floor(particleIndex / uTextureSize) + 0.5) / uTextureSize;
  vec2 texUV = vec2(u, v);

  vec3 pos = texture2D(texturePosition, texUV).xyz;
  vec3 vel = texture2D(textureVelocity, texUV).xyz;
  float velMag = length(vel);

  vVelMag = velMag;
  vRegion = region;
  vRandom = fract(sin(particleIndex * 12.9898) * 43758.5453);

  float t = particleIndex / (uTextureSize * uTextureSize);

  // Color modes: 0=original,1=rainbow,2=ocean,3=sunset,4=neon,5=fire,6=matrix,7=velocity,8=position,9=custom
  if (uColorMode == 0) vColor = originalColor;
  else if (uColorMode == 1) vColor = hsv2rgb(vec3(fract(t + uTime * 0.05), 0.9, 1.0));
  else if (uColorMode == 2) vColor = vec3(0.1 + t * 0.2, 0.3 + t * 0.4, 0.6 + t * 0.4);
  else if (uColorMode == 3) vColor = vec3(0.95, 0.3 + t * 0.5, 0.1 + t * 0.2);
  else if (uColorMode == 4) {
    float phase = fract(t * 3.0);
    vColor = phase < 0.33 ? vec3(1,0,1) : phase < 0.66 ? vec3(0,1,1) : vec3(1,1,0);
  }
  else if (uColorMode == 5) vColor = vec3(0.95, 0.2 + t * 0.6, 0.05);
  else if (uColorMode == 6) vColor = vec3(0.05, 0.6 + t * 0.4, 0.1);
  else if (uColorMode == 7) {
    float vt = clamp(velMag * 2.0, 0.0, 1.0);
    vColor = mix(vec3(0.2, 0.5, 1.0), vec3(1.0, 0.3, 0.1), vt);
    vColor = mix(vColor, vec3(1.0, 1.0, 0.5), pow(vt, 3.0));
  }
  else if (uColorMode == 8) vColor = hsv2rgb(vec3(fract(pos.x * 0.01 + pos.y * 0.01 + uTime * 0.1), 0.8, 1.0));
  else vColor = originalColor;

  vColor *= 1.0 + velMag * 0.5;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  float shimmer = 1.0 - uShimmer + uShimmer * (0.5 + 0.5 * sin(uTime * 2.0 + vRandom * 10.0));
  gl_PointSize = uParticleSize * (1.0 + velMag * 0.3) * shimmer * uPixelRatio * (200.0 / max(-mvPos.z, 1.0));
  gl_PointSize = clamp(gl_PointSize, 1.5, 64.0);
}
`;

const renderFragmentShader = `
varying vec3 vColor;
varying float vVelMag, vRegion, vRandom;

uniform float uTime, uSharpness, uBrightness, uSaturation, uHueShift, uGlowIntensity;
uniform vec3 uRegion1Color, uRegion2Color, uRegion3Color, uRegion4Color;
uniform float uRegion1Anim, uRegion2Anim, uRegion3Anim, uRegion4Anim;
uniform float uRegion1Int, uRegion2Int, uRegion3Int, uRegion4Int;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 fireEffect(vec3 c, float t, float r, float i) {
  float flicker = sin(t * 10.0 + r * 20.0) * 0.5 + 0.5;
  vec3 fire = mix(vec3(1,0.3,0), vec3(1,0.8,0.2), flicker);
  return mix(c, fire, i) * (1.0 + flicker * 0.5);
}

vec3 pulseEffect(vec3 c, vec3 rc, float t, float r, float i) {
  float pulse = sin(t * 3.0 + r * 6.28) * 0.5 + 0.5;
  return mix(c, rc, i) * (1.0 + pulse * i * 0.8);
}

vec3 electricEffect(vec3 c, float t, float r, float i) {
  float spark = step(0.95, fract(sin(t * 50.0 + r * 100.0) * 43758.5453));
  vec3 elec = mix(vec3(0.2,0.5,1), vec3(0.9,0.95,1), spark);
  return mix(c, elec, i) * (1.0 + spark * 2.0);
}

vec3 rainbowEffect(vec3 c, float t, float r, float i) {
  return mix(c, hsv2rgb(vec3(fract(t * 0.2 + r), 0.9, 1.0)), i);
}

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float dist = length(uv);

  float sharp = uSharpness * 0.8;
  float core = 1.0 - smoothstep(0.0, mix(0.35, 0.15, sharp), dist);
  float inner = 1.0 - smoothstep(mix(0.2, 0.1, sharp), mix(0.7, 0.25, sharp), dist);
  float outer = 1.0 - smoothstep(mix(0.5, 0.2, sharp), mix(1.0, 0.3, sharp), dist);

  float intensity = core * mix(1.5, 2.0, sharp) + inner * mix(0.4, 0.1, sharp) * uGlowIntensity + outer * mix(0.15, 0.0, sharp) * uGlowIntensity;
  if (dist > 1.0) discard;

  vec3 color = vColor;

  // Apply HSV adjustments
  vec3 hsv = rgb2hsv(color);
  hsv.x = fract(hsv.x + uHueShift);
  hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.0);
  color = hsv2rgb(hsv) * uBrightness;

  // Region effects
  if (vRegion > 0.5 && vRegion < 1.5) {
    if (uRegion1Anim > 0.5 && uRegion1Anim < 1.5) color = fireEffect(color, uTime, vRandom, uRegion1Int);
    else if (uRegion1Anim > 1.5 && uRegion1Anim < 2.5) color = pulseEffect(color, uRegion1Color, uTime, vRandom, uRegion1Int);
    else if (uRegion1Anim > 2.5 && uRegion1Anim < 3.5) color = electricEffect(color, uTime, vRandom, uRegion1Int);
    else if (uRegion1Anim > 3.5) color = rainbowEffect(color, uTime, vRandom, uRegion1Int);
  } else if (vRegion > 1.5 && vRegion < 2.5) {
    if (uRegion2Anim > 0.5 && uRegion2Anim < 1.5) color = fireEffect(color, uTime, vRandom, uRegion2Int);
    else if (uRegion2Anim > 1.5 && uRegion2Anim < 2.5) color = pulseEffect(color, uRegion2Color, uTime, vRandom, uRegion2Int);
    else if (uRegion2Anim > 2.5 && uRegion2Anim < 3.5) color = electricEffect(color, uTime, vRandom, uRegion2Int);
    else if (uRegion2Anim > 3.5) color = rainbowEffect(color, uTime, vRandom, uRegion2Int);
  } else if (vRegion > 2.5 && vRegion < 3.5) {
    if (uRegion3Anim > 0.5 && uRegion3Anim < 1.5) color = fireEffect(color, uTime, vRandom, uRegion3Int);
    else if (uRegion3Anim > 1.5 && uRegion3Anim < 2.5) color = pulseEffect(color, uRegion3Color, uTime, vRandom, uRegion3Int);
    else if (uRegion3Anim > 2.5 && uRegion3Anim < 3.5) color = electricEffect(color, uTime, vRandom, uRegion3Int);
    else if (uRegion3Anim > 3.5) color = rainbowEffect(color, uTime, vRandom, uRegion3Int);
  } else if (vRegion > 3.5) {
    if (uRegion4Anim > 0.5 && uRegion4Anim < 1.5) color = fireEffect(color, uTime, vRandom, uRegion4Int);
    else if (uRegion4Anim > 1.5 && uRegion4Anim < 2.5) color = pulseEffect(color, uRegion4Color, uTime, vRandom, uRegion4Int);
    else if (uRegion4Anim > 2.5 && uRegion4Anim < 3.5) color = electricEffect(color, uTime, vRandom, uRegion4Int);
    else if (uRegion4Anim > 3.5) color = rainbowEffect(color, uTime, vRandom, uRegion4Int);
  }

  color *= 1.0 + vVelMag * uGlowIntensity * 0.5;

  gl_FragColor = vec4(color, max(intensity, 0.1));
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

const ANIM_MAP: Record<AnimationMode, number> = { none: 0, float: 1, wave: 2, vortex: 3, explode: 4, implode: 5, turbulence: 6, magnetic: 7, thomas: 8, lorenz: 9, aizawa: 10, halvorsen: 11 };
const COLOR_MAP: Record<ColorMode, number> = { original: 0, rainbow: 1, ocean: 2, sunset: 3, neon: 4, fire: 5, matrix: 6, velocity: 7, position: 8, custom: 9 };
const FORCE_MAP: Record<ForceMode, number> = { repel: 0, attract: 1, orbit: 2, vortex: 3 };

// Check if WebGL is available
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

export function UltimateParticles({
  pointCloud, shape = 'sphere', textureSize = 512,
  animationMode = 'none', animationSpeed = 1, animationIntensity = 1,
  friction = 0.98, returnForce = 0.01, gravity = 0, turbulence = 0,
  enableMouse = true, mouseForce = 0.5, mouseRadius = 50, forceMode = 'repel',
  particleSize = 2, particleSharpness = 0.5, colorMode = 'rainbow',
  brightness = 1, saturation = 1, hueShift = 0, customColor: _customColor, shimmerIntensity = 0.3,
  rotationSpeed = 0.1, enableBloom = true, bloomIntensity = 0.6,
  enableTrails = false, trailLength = 0.85, backgroundColor = '#0a0a0f',
  paintingMode = false, selectedRegion = 1, brushRadius = 5, regionConfigs,
  onRegionPainted, explosionProgress = 0, className, style,
}: UltimateParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef(new THREE.Vector3());
  const refs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    material: THREE.ShaderMaterial | null;
    composer: EffectComposer | null;
    bloomPass: UnrealBloomPass | null;
    afterimagePass: AfterimagePass | null;
    geometry: THREE.BufferGeometry | null;
    particles: THREE.Points | null;
    gpuCompute: GPUComputationRenderer | null;
    posVar: any; velVar: any;
    controls: OrbitControls | null;
  }>({ renderer: null, material: null, composer: null, bloomPass: null, afterimagePass: null, geometry: null, particles: null, gpuCompute: null, posVar: null, velVar: null, controls: null });

  // Dynamic refs for painting
  const paintingRef = useRef(paintingMode);
  const regionRef = useRef(selectedRegion);
  const brushRef = useRef(brushRadius);
  const callbackRef = useRef(onRegionPainted);

  useEffect(() => {
    paintingRef.current = paintingMode;
    regionRef.current = selectedRegion;
    brushRef.current = brushRadius;
    callbackRef.current = onRegionPainted;
  }, [paintingMode, selectedRegion, brushRadius, onRegionPainted]);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    // Check WebGL availability first
    if (!isWebGLAvailable()) {
      setWebglError('WebGL is not available in your browser. Please try:\n• Updating your browser\n• Enabling hardware acceleration\n• Using Chrome, Firefox, or Safari');
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    if (width === 0 || height === 0) { setTimeout(initScene, 100); return; }

    // Cleanup
    if (refs.current.renderer) {
      try {
        refs.current.renderer.forceContextLoss();
        refs.current.renderer.dispose();
      } catch (e) {
        console.warn('Error during renderer cleanup:', e);
      }
    }

    // Data source
    const actualTexSize = textureSize;
    const totalParticles = actualTexSize * actualTexSize;
    let positions: Float32Array, colors: Float32Array;

    if (pointCloud?.positions?.length) {
      const pcCount = Math.min(pointCloud.count, totalParticles);
      positions = new Float32Array(totalParticles * 3);
      colors = new Float32Array(totalParticles * 3);
      for (let i = 0; i < totalParticles; i++) {
        const src = (i % pcCount) * 3;
        positions[i * 3] = pointCloud.positions[src];
        positions[i * 3 + 1] = pointCloud.positions[src + 1];
        positions[i * 3 + 2] = pointCloud.positions[src + 2];
        colors[i * 3] = pointCloud.colors?.[src] ?? 1;
        colors[i * 3 + 1] = pointCloud.colors?.[src + 1] ?? 1;
        colors[i * 3 + 2] = pointCloud.colors?.[src + 2] ?? 1;
      }
    } else {
      const shapeData = generateShape(shape, totalParticles);
      positions = shapeData.positions;
      colors = shapeData.colors;
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50000);
    camera.position.z = 150;

    // Create renderer with error handling
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      setWebglError('Failed to initialize 3D graphics. Your browser may not support WebGL, or hardware acceleration may be disabled.\n\nTry enabling hardware acceleration in your browser settings.');
      return;
    }

    // Verify the renderer has a valid context
    if (!renderer.getContext()) {
      console.error('WebGL context is null after renderer creation');
      setWebglError('WebGL context could not be created. Please check your browser settings and graphics drivers.');
      renderer.dispose();
      return;
    }

    refs.current.renderer = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Handle WebGL context loss gracefully
    const onContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost - will attempt to restore');
      cancelAnimationFrame(animationRef.current);
    };
    const onContextRestored = () => {
      console.log('WebGL context restored - reinitializing');
      initScene();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = rotationSpeed * 10;
    controls.minDistance = 0.1;
    controls.maxDistance = 10000;
    refs.current.controls = controls;

    // GPGPU
    const gpuCompute = new GPUComputationRenderer(actualTexSize, actualTexSize, renderer);
    refs.current.gpuCompute = gpuCompute;

    const dtPos = gpuCompute.createTexture();
    const dtVel = gpuCompute.createTexture();
    const posArr = dtPos.image.data as Float32Array;
    const velArr = dtVel.image.data as Float32Array;
    const origPosArr = new Float32Array(totalParticles * 4);
    const regionsArr = new Float32Array(totalParticles);

    for (let i = 0; i < totalParticles; i++) {
      posArr[i * 4] = positions[i * 3];
      posArr[i * 4 + 1] = positions[i * 3 + 1];
      posArr[i * 4 + 2] = positions[i * 3 + 2];
      posArr[i * 4 + 3] = 1;
      origPosArr[i * 4] = positions[i * 3];
      origPosArr[i * 4 + 1] = positions[i * 3 + 1];
      origPosArr[i * 4 + 2] = positions[i * 3 + 2];
      origPosArr[i * 4 + 3] = 0;
      velArr[i * 4] = velArr[i * 4 + 1] = velArr[i * 4 + 2] = 0;
      velArr[i * 4 + 3] = 1;
      regionsArr[i] = 0;
    }

    const origPosTex = new THREE.DataTexture(origPosArr, actualTexSize, actualTexSize, THREE.RGBAFormat, THREE.FloatType);
    origPosTex.needsUpdate = true;

    const posVar = gpuCompute.addVariable('texturePosition', positionShader, dtPos);
    const velVar = gpuCompute.addVariable('textureVelocity', velocityShader, dtVel);
    gpuCompute.setVariableDependencies(posVar, [posVar, velVar]);
    gpuCompute.setVariableDependencies(velVar, [posVar, velVar]);

    posVar.material.uniforms.uDeltaTime = { value: 0.016 };
    posVar.material.uniforms.uReturnForce = { value: returnForce };
    posVar.material.uniforms.textureOriginalPosition = { value: origPosTex };

    velVar.material.uniforms.uTime = { value: 0 };
    velVar.material.uniforms.uDeltaTime = { value: 0.016 };
    velVar.material.uniforms.uFriction = { value: friction };
    velVar.material.uniforms.uAnimationMode = { value: ANIM_MAP[animationMode] };
    velVar.material.uniforms.uAnimationSpeed = { value: animationSpeed };
    velVar.material.uniforms.uAnimationIntensity = { value: animationIntensity };
    velVar.material.uniforms.uGravity = { value: gravity };
    velVar.material.uniforms.uTurbulence = { value: turbulence };
    velVar.material.uniforms.uMousePosition = { value: mouseRef.current };
    velVar.material.uniforms.uMouseForce = { value: mouseForce };
    velVar.material.uniforms.uMouseRadius = { value: mouseRadius };
    velVar.material.uniforms.uForceMode = { value: FORCE_MAP[forceMode] };
    velVar.material.uniforms.uMouseEnabled = { value: enableMouse ? 1 : 0 };
    velVar.material.uniforms.uExplosionProgress = { value: explosionProgress };
    velVar.material.uniforms.textureOriginalPosition = { value: origPosTex };

    refs.current.posVar = posVar;
    refs.current.velVar = velVar;

    const err = gpuCompute.init();
    if (err) { console.error('GPGPU init error:', err); return; }

    // Geometry
    const geometry = new THREE.BufferGeometry();
    const indices = new Float32Array(totalParticles);
    for (let i = 0; i < totalParticles; i++) indices[i] = i;

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('particleIndex', new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute('originalColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('region', new THREE.BufferAttribute(regionsArr, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
    refs.current.geometry = geometry;

    // Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        texturePosition: { value: null },
        textureVelocity: { value: null },
        uTextureSize: { value: actualTexSize },
        uParticleSize: { value: particleSize },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uTime: { value: 0 },
        uShimmer: { value: shimmerIntensity },
        uColorMode: { value: COLOR_MAP[colorMode] },
        uSharpness: { value: particleSharpness },
        uBrightness: { value: brightness },
        uSaturation: { value: saturation },
        uHueShift: { value: hueShift / 360 },
        uGlowIntensity: { value: 1 },
        uRegion1Color: { value: new THREE.Vector3(1, 0.3, 0) },
        uRegion2Color: { value: new THREE.Vector3(0.2, 0.5, 1) },
        uRegion3Color: { value: new THREE.Vector3(0.8, 0.2, 1) },
        uRegion4Color: { value: new THREE.Vector3(1, 1, 1) },
        uRegion1Anim: { value: 1 }, uRegion2Anim: { value: 3 }, uRegion3Anim: { value: 2 }, uRegion4Anim: { value: 4 },
        uRegion1Int: { value: 1 }, uRegion2Int: { value: 1 }, uRegion3Int: { value: 1 }, uRegion4Int: { value: 1 },
      },
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    refs.current.material = material;

    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);
    refs.current.particles = particles;

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    refs.current.composer = composer;

    if (enableBloom) {
      const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), bloomIntensity, 0.4, 0.85);
      composer.addPass(bloom);
      refs.current.bloomPass = bloom;
    }
    if (enableTrails) {
      const afterimage = new AfterimagePass(trailLength);
      composer.addPass(afterimage);
      refs.current.afterimagePass = afterimage;
    }

    // Mouse tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isPainting = false;

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, point);
      if (point) mouseRef.current.copy(point);

      if (isPainting && paintingRef.current) paintAt(point);
    };

    const paintAt = (worldPos: THREE.Vector3) => {
      const regions = geometry.getAttribute('region');
      const pos = geometry.getAttribute('position');
      const brushSq = brushRef.current * brushRef.current;
      let painted = false;
      const temp = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        temp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        if (particles.matrixWorld) temp.applyMatrix4(particles.matrixWorld);
        if (temp.distanceToSquared(worldPos) < brushSq) {
          regions.setX(i, regionRef.current);
          painted = true;
        }
      }
      if (painted) {
        regions.needsUpdate = true;
        if (callbackRef.current) {
          const counts = [0, 0, 0, 0, 0];
          for (let i = 0; i < regions.count; i++) {
            const r = Math.round(regions.getX(i));
            if (r >= 0 && r <= 4) counts[r]++;
          }
          callbackRef.current(counts);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => { if (e.button === 0 && paintingRef.current) { isPainting = true; paintAt(mouseRef.current); } };
    const onMouseUp = () => { isPainting = false; };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);

    // Initial compute
    gpuCompute.compute();
    material.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(posVar).texture;
    material.uniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget(velVar).texture;

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.016;

      velVar.material.uniforms.uTime.value = time;
      velVar.material.uniforms.uMousePosition.value = mouseRef.current;

      gpuCompute.compute();

      material.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(posVar).texture;
      material.uniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget(velVar).texture;
      material.uniforms.uTime.value = time;

      controls.update();
      composer.render();

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      composer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [pointCloud, shape, textureSize, backgroundColor, enableBloom, enableTrails, rotationSpeed]);

  useEffect(() => { const cleanup = initScene(); return cleanup; }, [initScene]);

  // Dynamic updates
  useEffect(() => {
    const { velVar, material, bloomPass, afterimagePass, controls } = refs.current;
    if (velVar) {
      velVar.material.uniforms.uFriction.value = friction;
      velVar.material.uniforms.uAnimationMode.value = ANIM_MAP[animationMode];
      velVar.material.uniforms.uAnimationSpeed.value = animationSpeed;
      velVar.material.uniforms.uAnimationIntensity.value = animationIntensity;
      velVar.material.uniforms.uGravity.value = gravity;
      velVar.material.uniforms.uTurbulence.value = turbulence;
      velVar.material.uniforms.uMouseForce.value = mouseForce;
      velVar.material.uniforms.uMouseRadius.value = mouseRadius;
      velVar.material.uniforms.uForceMode.value = FORCE_MAP[forceMode];
      velVar.material.uniforms.uMouseEnabled.value = enableMouse ? 1 : 0;
      velVar.material.uniforms.uExplosionProgress.value = explosionProgress;
    }
    if (refs.current.posVar) {
      refs.current.posVar.material.uniforms.uReturnForce.value = returnForce;
    }
    if (material) {
      material.uniforms.uParticleSize.value = particleSize;
      material.uniforms.uShimmer.value = shimmerIntensity;
      material.uniforms.uColorMode.value = COLOR_MAP[colorMode];
      material.uniforms.uSharpness.value = particleSharpness;
      material.uniforms.uBrightness.value = brightness;
      material.uniforms.uSaturation.value = saturation;
      material.uniforms.uHueShift.value = hueShift / 360;
    }
    if (bloomPass) bloomPass.strength = bloomIntensity;
    if (afterimagePass) afterimagePass.uniforms['damp'].value = trailLength;
    if (controls) controls.autoRotateSpeed = rotationSpeed * 10;
  }, [friction, animationMode, animationSpeed, animationIntensity, gravity, turbulence,
      mouseForce, mouseRadius, forceMode, enableMouse, explosionProgress, returnForce,
      particleSize, shimmerIntensity, colorMode, particleSharpness, brightness, saturation,
      hueShift, bloomIntensity, trailLength, rotationSpeed]);

  // Region configs
  useEffect(() => {
    const { material } = refs.current;
    if (!material || !regionConfigs) return;
    const u = material.uniforms;
    if (regionConfigs[0]) {
      u.uRegion1Color.value.set(...regionConfigs[0].color);
      u.uRegion1Anim.value = regionConfigs[0].animation;
      u.uRegion1Int.value = regionConfigs[0].intensity;
    }
    if (regionConfigs[1]) {
      u.uRegion2Color.value.set(...regionConfigs[1].color);
      u.uRegion2Anim.value = regionConfigs[1].animation;
      u.uRegion2Int.value = regionConfigs[1].intensity;
    }
    if (regionConfigs[2]) {
      u.uRegion3Color.value.set(...regionConfigs[2].color);
      u.uRegion3Anim.value = regionConfigs[2].animation;
      u.uRegion3Int.value = regionConfigs[2].intensity;
    }
    if (regionConfigs[3]) {
      u.uRegion4Color.value.set(...regionConfigs[3].color);
      u.uRegion4Anim.value = regionConfigs[3].animation;
      u.uRegion4Int.value = regionConfigs[3].intensity;
    }
  }, [regionConfigs]);

  // Show error UI if WebGL is not available
  if (webglError) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#fff',
          padding: '2rem',
          textAlign: 'center',
          ...style
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f97316' }}>
          WebGL Not Available
        </h2>
        <p style={{ maxWidth: '400px', lineHeight: 1.6, whiteSpace: 'pre-line', color: '#94a3b8' }}>
          {webglError}
        </p>
        <button
          onClick={() => {
            setWebglError(null);
            setTimeout(initScene, 100);
          }}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, cursor: paintingMode ? 'crosshair' : 'default', ...style }}
    />
  );
}

export default UltimateParticles;
