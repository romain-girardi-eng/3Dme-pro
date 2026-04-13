/**
 * Generated3DParticles.tsx
 *
 * Ultimate particle visualization for AI-generated 3D models.
 * Features cutting-edge effects: GPGPU-style physics, curl noise,
 * mouse interaction, explosion, flow fields, trails, and more.
 *
 * Research sources:
 * - GPGPU particle effects (Codrops Dec 2024)
 * - TSL & WebGPU particles (Maxime Heckel)
 * - Three.js Journey particle morphing
 * - Flow field particles & curl noise
 */

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PointCloudData } from '../../utils/glbToPointCloud';

// ============================================================================
// TYPES
// ============================================================================

export type ColorMode = 'original' | 'rainbow' | 'ocean' | 'sunset' | 'neon' | 'monochrome' | 'fire' | 'matrix' | 'custom';
export type AnimationMode = 'none' | 'float' | 'wave' | 'vortex' | 'explode' | 'implode' | 'noise' | 'magnetic';
export type ShapeType = 'sphere' | 'cube' | 'torus' | 'heart' | 'star' | 'dna' | 'wave' | 'galaxy' | 'custom';
export type HoverMode = 'none' | 'glow' | 'pulse' | 'ripple' | 'scatter' | 'attract';

// Region configuration type
export interface RegionConfig {
  color: [number, number, number]; // RGB 0-1
  animation: number; // 0=none, 1=fire, 2=pulse, 3=electric, 4=rainbow
  intensity: number; // 0-2
  bloom: number; // 0-3
}

interface Generated3DParticlesProps {
  // Source - either pointCloud OR shape (if neither, defaults to sphere)
  pointCloud?: PointCloudData | null;
  shape?: ShapeType;
  particleCount?: number;
  // Basic
  particleSize?: number;
  particleSharpness?: number;  // 0 = soft/glow, 1 = sharp/crisp
  rotationSpeed?: number;
  backgroundColor?: string;
  // Colors
  colorMode?: ColorMode;
  colorIntensity?: number;
  brightness?: number;        // NEW: overall brightness multiplier (0-2)
  saturation?: number;        // NEW: color saturation (0-2)
  hueShift?: number;          // NEW: shift all colors (0-360)
  customColor?: string;       // NEW: for custom color mode
  // Effects
  enableBloom?: boolean;
  bloomIntensity?: number;
  enableTrails?: boolean;
  trailLength?: number;
  // Animation
  enableBreathing?: boolean;
  breathingSpeed?: number;
  breathingIntensity?: number;
  shimmerIntensity?: number;
  // Advanced animation
  animationMode?: AnimationMode;
  animationSpeed?: number;
  animationIntensity?: number;
  // Noise displacement
  enableNoise?: boolean;
  noiseScale?: number;
  noiseSpeed?: number;
  noiseIntensity?: number;
  // Mouse/Hover interaction
  enableMouseInteraction?: boolean;
  mouseForce?: number;
  mouseRadius?: number;
  hoverMode?: HoverMode;      // NEW: hover animation effect
  hoverIntensity?: number;    // NEW: how strong the hover effect is
  // Physics
  enablePhysics?: boolean;
  gravity?: number;
  turbulence?: number;
  // Explosion control
  explosionProgress?: number;
  // Morphing (for shapes)
  enableMorphing?: boolean;
  morphTarget?: ShapeType;
  morphProgress?: number;
  // Region painting
  paintingMode?: boolean;       // Enable painting mode
  selectedRegion?: number;      // Region to paint (0-4, 0 = erase)
  brushRadius?: number;         // Brush size in world units
  regionConfigs?: RegionConfig[]; // Custom region configs [region1, region2, region3, region4]
  onRegionPainted?: (regionCounts: number[]) => void; // Callback with count per region
  // Style
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// SHAPE GENERATORS
// ============================================================================

function generateSphere(count: number, radius: number = 50): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.9 + Math.random() * 0.2);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const len = Math.sqrt(x * x + y * y + z * z);
    normals[i * 3] = x / len;
    normals[i * 3 + 1] = y / len;
    normals[i * 3 + 2] = z / len;
  }
  return { positions, normals };
}

function generateCube(count: number, size: number = 60): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const half = size / 2;

  for (let i = 0; i < count; i++) {
    // Random face
    const face = Math.floor(Math.random() * 6);
    let x = 0, y = 0, z = 0, nx = 0, ny = 0, nz = 0;

    const u = (Math.random() - 0.5) * size;
    const v = (Math.random() - 0.5) * size;

    switch (face) {
      case 0: x = half; y = u; z = v; nx = 1; break;
      case 1: x = -half; y = u; z = v; nx = -1; break;
      case 2: x = u; y = half; z = v; ny = 1; break;
      case 3: x = u; y = -half; z = v; ny = -1; break;
      case 4: x = u; y = v; z = half; nz = 1; break;
      case 5: x = u; y = v; z = -half; nz = -1; break;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;
  }
  return { positions, normals };
}

function generateTorus(count: number, majorR: number = 40, minorR: number = 15): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;

    const x = (majorR + minorR * Math.cos(v)) * Math.cos(u);
    const y = (majorR + minorR * Math.cos(v)) * Math.sin(u);
    const z = minorR * Math.sin(v);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Normal for torus
    normals[i * 3] = Math.cos(v) * Math.cos(u);
    normals[i * 3 + 1] = Math.cos(v) * Math.sin(u);
    normals[i * 3 + 2] = Math.sin(v);
  }
  return { positions, normals };
}

function generateHeart(count: number, scale: number = 3): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;

    // Heart parametric equation
    const x = 16 * Math.pow(Math.sin(t), 3) * scale;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
    const z = (Math.random() - 0.5) * 20 * scale * 0.3;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    normals[i * 3] = 0;
    normals[i * 3 + 1] = 0;
    normals[i * 3 + 2] = 1;
  }
  return { positions, normals };
}

function generateStar(count: number, outerR: number = 50, innerR: number = 20): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const points = 5;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const pointIndex = Math.floor(angle / (Math.PI * 2 / (points * 2)));
    const isOuter = pointIndex % 2 === 0;
    const r = (isOuter ? outerR : innerR) * (0.8 + Math.random() * 0.4);

    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = (Math.random() - 0.5) * 15;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    normals[i * 3] = 0;
    normals[i * 3 + 1] = 0;
    normals[i * 3 + 2] = 1;
  }
  return { positions, normals };
}

function generateDNA(count: number, height: number = 100, radius: number = 25): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 6; // Multiple spirals
    const y = (i / count - 0.5) * height;
    const strand = Math.random() > 0.5 ? 1 : -1;

    const x = Math.cos(t + strand * Math.PI) * radius;
    const z = Math.sin(t + strand * Math.PI) * radius;

    positions[i * 3] = x + (Math.random() - 0.5) * 5;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * 5;

    normals[i * 3] = Math.cos(t);
    normals[i * 3 + 1] = 0;
    normals[i * 3 + 2] = Math.sin(t);
  }
  return { positions, normals };
}

function generateWaveShape(count: number, size: number = 80): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * size;
    const z = (Math.random() - 0.5) * size;
    const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 20;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    normals[i * 3] = -Math.cos(x * 0.1) * Math.cos(z * 0.1) * 0.1;
    normals[i * 3 + 1] = 1;
    normals[i * 3 + 2] = Math.sin(x * 0.1) * Math.sin(z * 0.1) * 0.1;
  }
  return { positions, normals };
}

function generateGalaxy(count: number, arms: number = 3, radius: number = 60): { positions: Float32Array; normals: Float32Array } {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const arm = Math.floor(Math.random() * arms);
    const armAngle = (arm / arms) * Math.PI * 2;
    const dist = Math.random() * radius;
    const spin = dist * 0.05;
    const angle = armAngle + spin + (Math.random() - 0.5) * 0.5;

    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const y = (Math.random() - 0.5) * (radius - dist) * 0.2;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    normals[i * 3] = 0;
    normals[i * 3 + 1] = 1;
    normals[i * 3 + 2] = 0;
  }
  return { positions, normals };
}

function generateShapeColors(count: number, colorMode: ColorMode, customColor?: string): Float32Array {
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = i / count;
    let r = 1, g = 1, b = 1;

    switch (colorMode) {
      case 'rainbow': {
        const hue = t;
        const c = 1;
        const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
        const h = Math.floor(hue * 6);
        if (h === 0) { r = c; g = x; b = 0; }
        else if (h === 1) { r = x; g = c; b = 0; }
        else if (h === 2) { r = 0; g = c; b = x; }
        else if (h === 3) { r = 0; g = x; b = c; }
        else if (h === 4) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        break;
      }
      case 'ocean':
        r = 0.1 + t * 0.2;
        g = 0.3 + t * 0.4;
        b = 0.6 + t * 0.4;
        break;
      case 'sunset':
        r = 0.95;
        g = 0.3 + t * 0.5;
        b = 0.1 + t * 0.2;
        break;
      case 'neon': {
        const phase = (t * 3) % 1;
        if (phase < 0.33) { r = 1; g = 0; b = 1; }
        else if (phase < 0.66) { r = 0; g = 1; b = 1; }
        else { r = 1; g = 1; b = 0; }
        break;
      }
      case 'monochrome':
        r = g = b = 0.7 + t * 0.3;
        break;
      case 'fire':
        r = 0.95;
        g = 0.2 + t * 0.6;
        b = 0.05;
        break;
      case 'matrix':
        r = 0.05;
        g = 0.6 + t * 0.4;
        b = 0.1;
        break;
      case 'custom':
        if (customColor) {
          const hex = customColor.replace('#', '');
          r = parseInt(hex.substr(0, 2), 16) / 255;
          g = parseInt(hex.substr(2, 2), 16) / 255;
          b = parseInt(hex.substr(4, 2), 16) / 255;
        }
        break;
      default: // original - white
        r = g = b = 1;
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  return colors;
}

function getShapeData(shape: ShapeType, count: number): { positions: Float32Array; normals: Float32Array } {
  switch (shape) {
    case 'sphere': return generateSphere(count);
    case 'cube': return generateCube(count);
    case 'torus': return generateTorus(count);
    case 'heart': return generateHeart(count);
    case 'star': return generateStar(count);
    case 'dna': return generateDNA(count);
    case 'wave': return generateWaveShape(count);
    case 'galaxy': return generateGalaxy(count);
    default: return generateSphere(count);
  }
}

// ============================================================================
// COLOR PALETTES
// ============================================================================

function applyColorMode(colors: Float32Array, mode: ColorMode, count: number, intensity: number = 1): Float32Array {
  if (mode === 'original') return colors;

  const newColors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = i / count;
    // Add some randomness based on original position
    const rand = (colors[i * 3] + colors[i * 3 + 1] + colors[i * 3 + 2]) / 3;
    let r = 0, g = 0, b = 0;

    switch (mode) {
      case 'rainbow': {
        const hue = (t + rand * 0.3) % 1;
        const s = 0.8 + rand * 0.2;
        const l = 0.5 + rand * 0.2;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
        const m = l - c / 2;
        const h = Math.floor(hue * 6);
        if (h === 0) { r = c; g = x; b = 0; }
        else if (h === 1) { r = x; g = c; b = 0; }
        else if (h === 2) { r = 0; g = c; b = x; }
        else if (h === 3) { r = 0; g = x; b = c; }
        else if (h === 4) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        r += m; g += m; b += m;
        break;
      }
      case 'ocean':
        r = 0.05 + t * 0.15 + rand * 0.1;
        g = 0.2 + t * 0.4 + rand * 0.2;
        b = 0.5 + t * 0.5 + rand * 0.2;
        break;
      case 'sunset':
        r = 0.9 + rand * 0.1;
        g = 0.2 + t * 0.5 + rand * 0.2;
        b = 0.05 + t * 0.3 + rand * 0.15;
        break;
      case 'neon': {
        const neonPhase = (t * 3 + rand) % 1;
        if (neonPhase < 0.33) {
          r = 1; g = 0; b = 1; // Magenta
        } else if (neonPhase < 0.66) {
          r = 0; g = 1; b = 1; // Cyan
        } else {
          r = 1; g = 1; b = 0; // Yellow
        }
        break;
      }
      case 'monochrome':
        r = g = b = 0.6 + t * 0.4 + rand * 0.2;
        break;
      case 'fire':
        r = 0.9 + rand * 0.1;
        g = 0.1 + t * 0.6 + rand * 0.2;
        b = 0.0 + t * 0.1;
        break;
      case 'matrix':
        r = 0.0 + rand * 0.1;
        g = 0.5 + t * 0.5 + rand * 0.3;
        b = 0.0 + rand * 0.1;
        break;
    }

    // Apply intensity
    newColors[i * 3] = r * intensity;
    newColors[i * 3 + 1] = g * intensity;
    newColors[i * 3 + 2] = b * intensity;
  }

  return newColors;
}

// ============================================================================
// SHADERS
// ============================================================================

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute vec3 originalPosition;
  attribute vec3 velocity;
  attribute float randomSeed;
  attribute float region;  // 0 = default, 1-4 = custom regions

  varying vec3 vColor;
  varying float vRandom;
  varying float vDistFromCenter;
  varying float vRegion;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBreathing;
  uniform float uBreathingSpeed;
  uniform float uBreathingIntensity;
  uniform float uShimmerIntensity;
  uniform float uAnimationMode;
  uniform float uAnimationSpeed;
  uniform float uAnimationIntensity;
  uniform float uNoiseEnabled;
  uniform float uNoiseScale;
  uniform float uNoiseSpeed;
  uniform float uNoiseIntensity;
  uniform float uExplosionProgress;
  uniform float uPhysicsEnabled;
  uniform float uGravity;
  uniform float uTurbulence;
  uniform vec3 uMousePosition;
  uniform float uMouseForce;
  uniform float uMouseRadius;
  uniform float uMouseEnabled;

  // Region-specific uniforms (up to 4 custom regions)
  uniform vec3 uRegion1Color;
  uniform float uRegion1Animation;  // 0=none, 1=fire, 2=pulse, 3=electric
  uniform float uRegion1Intensity;
  uniform vec3 uRegion2Color;
  uniform float uRegion2Animation;
  uniform float uRegion2Intensity;
  uniform vec3 uRegion3Color;
  uniform float uRegion3Animation;
  uniform float uRegion3Intensity;
  uniform vec3 uRegion4Color;
  uniform float uRegion4Animation;
  uniform float uRegion4Intensity;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
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

  // Curl noise for fluid-like motion
  vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);

    float n1 = snoise(p + dy) - snoise(p - dy);
    float n2 = snoise(p + dz) - snoise(p - dz);
    float n3 = snoise(p + dx) - snoise(p - dx);
    float n4 = snoise(p + dz) - snoise(p - dz);
    float n5 = snoise(p + dx) - snoise(p - dx);
    float n6 = snoise(p + dy) - snoise(p - dy);

    return normalize(vec3(n1 - n2, n3 - n4, n5 - n6));
  }

  void main() {
    vColor = color;
    vRandom = randomSeed;
    vRegion = region;

    vec3 pos = position;
    float dist = length(originalPosition);
    vDistFromCenter = dist;

    // Animation modes
    // 0: none, 1: float, 2: wave, 3: vortex, 4: explode, 5: implode, 6: noise, 7: magnetic

    if (uAnimationMode > 0.5 && uAnimationMode < 1.5) {
      // Float - gentle up/down motion
      float floatOffset = sin(uTime * uAnimationSpeed + vRandom * 6.28) * uAnimationIntensity * 5.0;
      pos.y += floatOffset;
      pos.x += sin(uTime * uAnimationSpeed * 0.7 + vRandom * 3.14) * uAnimationIntensity * 2.0;
    }
    else if (uAnimationMode > 1.5 && uAnimationMode < 2.5) {
      // Wave - ripple effect from center
      float wave = sin(dist * 0.05 - uTime * uAnimationSpeed * 2.0) * uAnimationIntensity * 8.0;
      pos += normalize(originalPosition) * wave;
    }
    else if (uAnimationMode > 2.5 && uAnimationMode < 3.5) {
      // Vortex - spiral rotation around Y axis
      float angle = uTime * uAnimationSpeed * 0.5 + dist * 0.02;
      float vortexStrength = uAnimationIntensity * 0.3;
      float cosA = cos(angle * vortexStrength);
      float sinA = sin(angle * vortexStrength);
      vec3 rotated = vec3(
        pos.x * cosA - pos.z * sinA,
        pos.y + sin(uTime * uAnimationSpeed + dist * 0.03) * uAnimationIntensity * 3.0,
        pos.x * sinA + pos.z * cosA
      );
      pos = mix(pos, rotated, uAnimationIntensity);
    }
    else if (uAnimationMode > 3.5 && uAnimationMode < 4.5) {
      // Explode - particles fly outward
      vec3 direction = normalize(originalPosition + vec3(0.001));
      float explosionDist = uExplosionProgress * uAnimationIntensity * 100.0;
      float randomOffset = vRandom * 30.0;
      pos = originalPosition + direction * (explosionDist + randomOffset * uExplosionProgress);
      // Add some spiral during explosion
      float spiralAngle = uExplosionProgress * 3.14 * 2.0 * vRandom;
      pos.x += sin(spiralAngle) * uExplosionProgress * 10.0;
      pos.z += cos(spiralAngle) * uExplosionProgress * 10.0;
    }
    else if (uAnimationMode > 4.5 && uAnimationMode < 5.5) {
      // Implode - particles gather to center
      vec3 toCenter = -normalize(originalPosition + vec3(0.001));
      float implodeStrength = uExplosionProgress * uAnimationIntensity * 50.0;
      pos = originalPosition + toCenter * implodeStrength;
    }
    else if (uAnimationMode > 5.5 && uAnimationMode < 6.5) {
      // Noise - curl noise displacement
      vec3 noisePos = originalPosition * 0.02 + uTime * uAnimationSpeed * 0.5;
      vec3 curl = curlNoise(noisePos);
      pos = originalPosition + curl * uAnimationIntensity * 15.0;
    }
    else if (uAnimationMode > 6.5 && uAnimationMode < 7.5) {
      // Magnetic - attract to poles
      float poleStrength = sin(originalPosition.y * 0.02 + uTime * uAnimationSpeed);
      pos.x += poleStrength * uAnimationIntensity * 10.0 * sign(originalPosition.x);
      pos.z += poleStrength * uAnimationIntensity * 10.0 * sign(originalPosition.z);
      pos.y += cos(uTime * uAnimationSpeed * 2.0 + vRandom * 6.28) * uAnimationIntensity * 3.0;
    }

    // Noise displacement (additional layer)
    if (uNoiseEnabled > 0.5) {
      vec3 noiseCoord = pos * uNoiseScale * 0.01 + uTime * uNoiseSpeed * 0.3;
      float noiseX = snoise(noiseCoord);
      float noiseY = snoise(noiseCoord + vec3(100.0));
      float noiseZ = snoise(noiseCoord + vec3(200.0));
      pos += vec3(noiseX, noiseY, noiseZ) * uNoiseIntensity * 10.0;
    }

    // Mouse interaction - repel/attract
    if (uMouseEnabled > 0.5) {
      vec3 toMouse = uMousePosition - pos;
      float mouseDist = length(toMouse);
      if (mouseDist < uMouseRadius && mouseDist > 0.1) {
        vec3 force = normalize(toMouse) * uMouseForce * (1.0 - mouseDist / uMouseRadius);
        pos -= force * 20.0; // Repel (negative force = attract)
      }
    }

    // Breathing effect
    if (uBreathing > 0.5) {
      float breathe = 1.0 + sin(uTime * uBreathingSpeed + dist * 0.02) * uBreathingIntensity * 0.1;
      pos *= breathe;
    }

    // Physics simulation
    if (uPhysicsEnabled > 0.5) {
      pos.y -= uGravity * 0.1;
      vec3 turbulenceOffset = curlNoise(pos * 0.02 + uTime * 0.5) * uTurbulence * 5.0;
      pos += turbulenceOffset;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size with shimmer
    float shimmer = 1.0 - uShimmerIntensity + uShimmerIntensity * (0.5 + 0.5 * sin(uTime * 2.0 + vRandom * 10.0));
    gl_PointSize = size * shimmer * uPixelRatio * (200.0 / -mvPosition.z);
    gl_PointSize = max(1.5, gl_PointSize);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vRandom;
  varying float vDistFromCenter;
  varying float vRegion;

  uniform float uTime;
  uniform float uShimmerIntensity;
  uniform float uBrightness;
  uniform float uSaturation;
  uniform float uHueShift;
  uniform float uHoverMode;
  uniform float uHoverIntensity;
  uniform float uIsHovering;
  uniform float uSharpness;  // 0 = soft/glow, 1 = sharp/crisp

  // Region-specific uniforms
  uniform vec3 uRegion1Color;
  uniform float uRegion1Animation;  // 0=none, 1=fire, 2=pulse, 3=electric, 4=rainbow
  uniform float uRegion1Intensity;
  uniform float uRegion1Bloom;
  uniform vec3 uRegion2Color;
  uniform float uRegion2Animation;
  uniform float uRegion2Intensity;
  uniform float uRegion2Bloom;
  uniform vec3 uRegion3Color;
  uniform float uRegion3Animation;
  uniform float uRegion3Intensity;
  uniform float uRegion3Bloom;
  uniform vec3 uRegion4Color;
  uniform float uRegion4Animation;
  uniform float uRegion4Intensity;
  uniform float uRegion4Bloom;

  // RGB to HSV
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  // HSV to RGB
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // Get region effect parameters
  void getRegionParams(float region, out vec3 regionColor, out float animation, out float intensity, out float bloom) {
    if (region > 0.5 && region < 1.5) {
      regionColor = uRegion1Color;
      animation = uRegion1Animation;
      intensity = uRegion1Intensity;
      bloom = uRegion1Bloom;
    } else if (region > 1.5 && region < 2.5) {
      regionColor = uRegion2Color;
      animation = uRegion2Animation;
      intensity = uRegion2Intensity;
      bloom = uRegion2Bloom;
    } else if (region > 2.5 && region < 3.5) {
      regionColor = uRegion3Color;
      animation = uRegion3Animation;
      intensity = uRegion3Intensity;
      bloom = uRegion3Bloom;
    } else if (region > 3.5 && region < 4.5) {
      regionColor = uRegion4Color;
      animation = uRegion4Animation;
      intensity = uRegion4Intensity;
      bloom = uRegion4Bloom;
    } else {
      regionColor = vec3(1.0);
      animation = 0.0;
      intensity = 1.0;
      bloom = 1.0;
    }
  }

  // Fire effect - flickering orange/red with upward movement
  vec3 fireEffect(vec3 baseColor, float time, float random, float intensity) {
    float flicker = sin(time * 10.0 + random * 20.0) * 0.5 + 0.5;
    float wave = sin(time * 5.0 + random * 10.0) * 0.3 + 0.7;
    vec3 fireColor = mix(
      vec3(1.0, 0.3, 0.0),  // Orange
      vec3(1.0, 0.8, 0.2),  // Yellow-white hot
      flicker * wave
    );
    // Add some ember red at the edges
    fireColor = mix(fireColor, vec3(0.8, 0.1, 0.0), (1.0 - wave) * 0.3);
    return mix(baseColor, fireColor, intensity) * (1.0 + flicker * 0.5);
  }

  // Pulse effect - rhythmic brightness pulsing
  vec3 pulseEffect(vec3 baseColor, vec3 regionColor, float time, float random, float intensity) {
    float pulse = sin(time * 3.0 + random * 6.28) * 0.5 + 0.5;
    vec3 pulsedColor = mix(baseColor, regionColor, intensity);
    return pulsedColor * (1.0 + pulse * intensity * 0.8);
  }

  // Electric effect - crackling with blue-white sparks
  vec3 electricEffect(vec3 baseColor, float time, float random, float intensity) {
    float spark = step(0.95, fract(sin(time * 50.0 + random * 100.0) * 43758.5453));
    float glow = sin(time * 8.0 + random * 15.0) * 0.5 + 0.5;
    vec3 electricColor = mix(
      vec3(0.2, 0.5, 1.0),  // Blue
      vec3(0.9, 0.95, 1.0), // White
      spark + glow * 0.3
    );
    return mix(baseColor, electricColor, intensity) * (1.0 + spark * 2.0);
  }

  // Rainbow cycle effect
  vec3 rainbowEffect(vec3 baseColor, float time, float random, float intensity) {
    float hue = fract(time * 0.2 + random);
    vec3 rainbowColor = hsv2rgb(vec3(hue, 0.9, 1.0));
    return mix(baseColor, rainbowColor, intensity);
  }

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float dist = length(uv);

    // Sharpness-controlled glow (0 = soft/glow, 1 = sharp/crisp)
    // Adjust smoothstep ranges based on sharpness
    float sharpFactor = uSharpness * 0.8;  // Scale down for better control

    // Core: sharper = tighter core
    float coreEnd = mix(0.35, 0.15, sharpFactor);
    float core = 1.0 - smoothstep(0.0, coreEnd, dist);

    // Inner glow: sharper = less inner glow
    float innerStart = mix(0.2, 0.1, sharpFactor);
    float innerEnd = mix(0.7, 0.25, sharpFactor);
    float innerGlow = 1.0 - smoothstep(innerStart, innerEnd, dist);

    // Outer glow: sharper = no outer glow
    float outerStart = mix(0.5, 0.2, sharpFactor);
    float outerEnd = mix(1.0, 0.3, sharpFactor);
    float outerGlow = 1.0 - smoothstep(outerStart, outerEnd, dist);

    // Blend weights based on sharpness
    float coreWeight = mix(1.5, 2.0, sharpFactor);
    float innerWeight = mix(0.4, 0.1, sharpFactor);
    float outerWeight = mix(0.15, 0.0, sharpFactor);

    float intensityBase = core * coreWeight + innerGlow * innerWeight + outerGlow * outerWeight;

    if (intensityBase < 0.05) discard;

    // Twinkle effect
    float twinkle = sin(uTime * 0.8 + vRandom * 20.0) * 0.5 + 0.5;
    float shimmerBrightness = 1.0 - uShimmerIntensity * 0.3 + twinkle * uShimmerIntensity * 0.3;

    vec3 color = vColor;

    // Apply hue shift and saturation
    vec3 hsv = rgb2hsv(color);
    hsv.x = fract(hsv.x + uHueShift);  // Hue shift
    hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.0);  // Saturation
    color = hsv2rgb(hsv);

    // Apply brightness
    vec3 finalColor = color * shimmerBrightness * uBrightness;

    // ========== REGION-SPECIFIC EFFECTS ==========
    if (vRegion > 0.5) {
      vec3 regionColor;
      float regionAnimation, regionIntensity, regionBloom;
      getRegionParams(vRegion, regionColor, regionAnimation, regionIntensity, regionBloom);

      // Apply region animation effect
      // 0=none, 1=fire, 2=pulse, 3=electric, 4=rainbow
      if (regionAnimation > 0.5 && regionAnimation < 1.5) {
        finalColor = fireEffect(finalColor, uTime, vRandom, regionIntensity);
      } else if (regionAnimation > 1.5 && regionAnimation < 2.5) {
        finalColor = pulseEffect(finalColor, regionColor, uTime, vRandom, regionIntensity);
      } else if (regionAnimation > 2.5 && regionAnimation < 3.5) {
        finalColor = electricEffect(finalColor, uTime, vRandom, regionIntensity);
      } else if (regionAnimation > 3.5 && regionAnimation < 4.5) {
        finalColor = rainbowEffect(finalColor, uTime, vRandom, regionIntensity);
      } else {
        // No animation, just apply region color tint
        finalColor = mix(finalColor, regionColor * finalColor, regionIntensity);
      }

      // Apply per-region bloom boost
      intensityBase *= regionBloom;
    }

    // Hover effects
    if (uIsHovering > 0.5) {
      // Glow mode - increase brightness
      if (uHoverMode > 0.5 && uHoverMode < 1.5) {
        finalColor *= 1.0 + uHoverIntensity * 0.5;
      }
      // Pulse mode - pulsing brightness
      else if (uHoverMode > 1.5 && uHoverMode < 2.5) {
        float pulse = sin(uTime * 5.0) * 0.5 + 0.5;
        finalColor *= 1.0 + pulse * uHoverIntensity * 0.5;
      }
      // Ripple mode - wave from center
      else if (uHoverMode > 2.5 && uHoverMode < 3.5) {
        float ripple = sin(vDistFromCenter * 0.1 - uTime * 3.0) * 0.5 + 0.5;
        finalColor *= 1.0 + ripple * uHoverIntensity * 0.3;
      }
    }

    // Add subtle color variation based on distance
    finalColor += vec3(0.1, 0.05, 0.15) * (1.0 - vDistFromCenter / 100.0) * 0.2;

    gl_FragColor = vec4(finalColor, intensityBase);
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

export function Generated3DParticles({
  pointCloud,
  shape = 'sphere',
  particleCount = 50000,
  particleSize = 2,
  particleSharpness = 0.5,
  rotationSpeed = 0.1,
  backgroundColor = '#0a0a0f',
  colorMode = 'rainbow',
  colorIntensity = 1,
  brightness = 1,
  saturation = 1,
  hueShift = 0,
  customColor,
  enableBloom = true,
  bloomIntensity = 0.6,
  enableTrails = false,
  trailLength = 0.85,
  enableBreathing = true,
  breathingSpeed = 0.5,
  breathingIntensity = 0.5,
  shimmerIntensity = 0.3,
  animationMode = 'none',
  animationSpeed = 1,
  animationIntensity = 1,
  enableNoise = false,
  noiseScale = 1,
  noiseSpeed = 0.5,
  noiseIntensity = 0.5,
  enableMouseInteraction = false,
  mouseForce = 1,
  mouseRadius = 50,
  hoverMode = 'none',
  hoverIntensity = 1,
  enablePhysics = false,
  gravity = 0,
  turbulence = 0,
  explosionProgress = 0,
  enableMorphing: _enableMorphing = false,
  morphTarget: _morphTarget,
  morphProgress: _morphProgress = 0,
  // Region painting props
  paintingMode = false,
  selectedRegion = 1,
  brushRadius = 5,
  regionConfigs,
  onRegionPainted,
  className,
  style,
}: Generated3DParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef(new THREE.Vector3(0, 0, 0));
  const isHoveringRef = useRef(false);
  const isPaintingRef = useRef(false);

  // Refs to store Three.js objects for dynamic updates without recreation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const afterimagePassRef = useRef<AfterimagePass | null>(null);
  const rotationSpeedRef = useRef(rotationSpeed);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const paintingModeRef = useRef(paintingMode);
  const selectedRegionRef = useRef(selectedRegion);
  const brushRadiusRef = useRef(brushRadius);
  const onRegionPaintedRef = useRef(onRegionPainted);

  const animationModeToNumber = (mode: AnimationMode): number => {
    const modes: Record<AnimationMode, number> = {
      none: 0,
      float: 1,
      wave: 2,
      vortex: 3,
      explode: 4,
      implode: 5,
      noise: 6,
      magnetic: 7,
    };
    return modes[mode];
  };

  const hoverModeToNumber = (mode: HoverMode): number => {
    const modes: Record<HoverMode, number> = {
      none: 0,
      glow: 1,
      pulse: 2,
      ripple: 3,
      scatter: 4,
      attract: 5,
    };
    return modes[mode];
  };

  // Update refs when props change
  useEffect(() => {
    paintingModeRef.current = paintingMode;
    selectedRegionRef.current = selectedRegion;
    brushRadiusRef.current = brushRadius;
    onRegionPaintedRef.current = onRegionPainted;
  }, [paintingMode, selectedRegion, brushRadius, onRegionPainted]);

  // Paint particles at a given 3D position
  const paintAtPosition = useCallback((worldPosition: THREE.Vector3) => {
    if (!geometryRef.current || !particlesRef.current) return;

    const positions = geometryRef.current.getAttribute('position');
    const regions = geometryRef.current.getAttribute('region');

    if (!positions || !regions) return;

    const brushRadiusSq = brushRadiusRef.current * brushRadiusRef.current;
    let painted = false;

    // Get world matrix to transform particle positions
    const worldMatrix = particlesRef.current.matrixWorld;
    const tempPos = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      tempPos.set(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      // Transform to world coordinates
      tempPos.applyMatrix4(worldMatrix);

      const distSq = tempPos.distanceToSquared(worldPosition);

      if (distSq < brushRadiusSq) {
        regions.setX(i, selectedRegionRef.current);
        painted = true;
      }
    }

    if (painted) {
      regions.needsUpdate = true;

      // Calculate region counts and notify parent
      if (onRegionPaintedRef.current) {
        const counts = [0, 0, 0, 0, 0]; // [region0, region1, region2, region3, region4]
        for (let i = 0; i < regions.count; i++) {
          const r = Math.round(regions.getX(i));
          if (r >= 0 && r <= 4) counts[r]++;
        }
        onRegionPaintedRef.current(counts);
      }
    }
  }, []);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    // Get particle data - either from pointCloud or generate from shape
    let positions: Float32Array;
    let colors: Float32Array;
    let count: number;

    if (pointCloud && pointCloud.positions && pointCloud.positions.length > 0) {
      // Validate pointCloud data
      const validCount = Math.min(pointCloud.count, pointCloud.positions.length / 3);
      if (validCount <= 0) {
        console.warn('Invalid point cloud data, falling back to shape');
        count = particleCount;
        const shapeData = getShapeData(shape, count);
        positions = shapeData.positions;
        colors = generateShapeColors(count, colorMode, customColor);
      } else {
        console.log(`Initializing particles with ${validCount} points from pointCloud`);
        positions = pointCloud.positions.slice(0, validCount * 3);
        colors = applyColorMode(
          pointCloud.colors.slice(0, validCount * 3),
          colorMode,
          validCount,
          colorIntensity
        );
        count = validCount;
      }
    } else {
      // Generate from shape
      count = particleCount;
      const shapeData = getShapeData(shape, count);
      positions = shapeData.positions;
      colors = generateShapeColors(count, colorMode, customColor);
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
      setTimeout(() => initScene(), 100);
      return;
    }

    // Clean up existing resources BEFORE creating new ones
    // This is critical for memory when toggling effects like bloom/trails
    console.log('Cleaning up previous scene resources...');

    // Dispose bloom pass if exists
    if (bloomPassRef.current) {
      bloomPassRef.current.dispose();
      bloomPassRef.current = null;
    }

    // Dispose afterimage pass if exists
    if (afterimagePassRef.current) {
      const afterimage = afterimagePassRef.current as any;
      if (afterimage.textureComp) afterimage.textureComp.dispose();
      if (afterimage.textureOld) afterimage.textureOld.dispose();
      afterimagePassRef.current = null;
    }

    // Dispose composer if exists
    if (composerRef.current) {
      composerRef.current.dispose();
      composerRef.current = null;
    }

    // Dispose material if exists
    if (materialRef.current) {
      materialRef.current.dispose();
      materialRef.current = null;
    }

    // Traverse and dispose scene objects
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const mat = object.material as THREE.Material;
            mat.dispose();
          }
        }
      });
      while (sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
      sceneRef.current = null;
    }

    // Clean up existing renderer
    if (rendererRef.current) {
      rendererRef.current.forceContextLoss();
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    // Scene
    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(backgroundColor);
    scene.background = bgColor;

    // Camera - extended range for infinite zoom
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50000);
    camera.position.z = 150;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    rendererRef.current = renderer; // Set ref immediately to prevent duplicate contexts
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(bgColor, 1);
    container.appendChild(renderer.domElement);

    // Mouse tracking for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Project mouse to 3D space at z=0
      raycaster.setFromCamera(mouse, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, point);
      if (point) {
        mouseRef.current.copy(point);
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // OrbitControls for full camera control
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    // No zoom limits - infinite zoom
    controls.minDistance = 0.1;
    controls.maxDistance = 10000;
    // No polar angle limits - can rotate fully
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    // Auto-rotate when idle
    controls.autoRotate = true;
    controls.autoRotateSpeed = rotationSpeed * 10;

    // Track user interaction to pause auto-rotate
    let autoRotationPaused = false;
    let autoRotationResumeTimeout: ReturnType<typeof setTimeout> | null = null;

    controls.addEventListener('start', () => {
      autoRotationPaused = true;
      controls.autoRotate = false;
      if (autoRotationResumeTimeout) clearTimeout(autoRotationResumeTimeout);
    });

    controls.addEventListener('end', () => {
      autoRotationResumeTimeout = setTimeout(() => {
        autoRotationPaused = false;
        controls.autoRotate = true;
      }, 3000);
    });

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    if (enableBloom) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        bloomIntensity,
        0.4,
        0.85
      );
      composer.addPass(bloomPass);
      bloomPassRef.current = bloomPass;
    }

    if (enableTrails) {
      const afterimagePass = new AfterimagePass(trailLength);
      composer.addPass(afterimagePass);
      afterimagePassRef.current = afterimagePass;
    }

    // Background stars
    const starCount = 1000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 1500;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      starPositions[i * 3 + 2] = -200 - Math.random() * 500;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(starGeometry, starMaterial));

    // Create particle system
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(positions.slice(), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create sizes and random seeds
    // Use variable sizes from pointCloud if available (adaptive density feature)
    const sizes = new Float32Array(count);
    const randomSeeds = new Float32Array(count);
    const velocities = new Float32Array(count * 3);

    // Check if pointCloud has variable sizes
    const hasVariableSizes = pointCloud && pointCloud.sizes && pointCloud.sizes.length === count;

    for (let i = 0; i < count; i++) {
      if (hasVariableSizes) {
        // Use adaptive size from pointCloud (already normalized to multiplier around 1.0)
        // Multiply by particleSize and add slight randomness
        const adaptiveSize = pointCloud!.sizes![i];
        sizes[i] = particleSize * adaptiveSize * (0.9 + Math.random() * 0.2);
      } else {
        // Fallback: random size variation
        sizes[i] = particleSize * (0.5 + Math.random() * 0.5);
      }
      randomSeeds[i] = Math.random();
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }

    if (hasVariableSizes) {
      console.log('Using adaptive particle sizes from point cloud');
    }

    // Region attribute for per-region effects (0 = default, 1-4 = custom regions)
    const regions = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      regions[i] = 0; // All particles start in default region
    }

    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('randomSeed', new THREE.BufferAttribute(randomSeeds, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('region', new THREE.BufferAttribute(regions, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uBreathing: { value: enableBreathing ? 1.0 : 0.0 },
        uBreathingSpeed: { value: breathingSpeed },
        uBreathingIntensity: { value: breathingIntensity },
        uShimmerIntensity: { value: shimmerIntensity },
        uBrightness: { value: brightness },
        uSaturation: { value: saturation },
        uHueShift: { value: hueShift / 360.0 },
        uHoverMode: { value: hoverModeToNumber(hoverMode) },
        uHoverIntensity: { value: hoverIntensity },
        uIsHovering: { value: 0.0 },
        uSharpness: { value: particleSharpness },
        uAnimationMode: { value: animationModeToNumber(animationMode) },
        uAnimationSpeed: { value: animationSpeed },
        uAnimationIntensity: { value: animationIntensity },
        uNoiseEnabled: { value: enableNoise ? 1.0 : 0.0 },
        uNoiseScale: { value: noiseScale },
        uNoiseSpeed: { value: noiseSpeed },
        uNoiseIntensity: { value: noiseIntensity },
        uExplosionProgress: { value: explosionProgress },
        uPhysicsEnabled: { value: enablePhysics ? 1.0 : 0.0 },
        uGravity: { value: gravity },
        uTurbulence: { value: turbulence },
        uMousePosition: { value: mouseRef.current },
        uMouseForce: { value: mouseForce },
        uMouseRadius: { value: mouseRadius },
        uMouseEnabled: { value: enableMouseInteraction ? 1.0 : 0.0 },
        // Region uniforms - can be controlled via props or dynamically
        uRegion1Color: { value: new THREE.Vector3(1.0, 0.3, 0.0) }, // Fire orange
        uRegion1Animation: { value: 1.0 }, // Fire effect
        uRegion1Intensity: { value: 1.0 },
        uRegion1Bloom: { value: 1.5 }, // Extra bloom for fire
        uRegion2Color: { value: new THREE.Vector3(0.2, 0.5, 1.0) }, // Electric blue
        uRegion2Animation: { value: 3.0 }, // Electric effect
        uRegion2Intensity: { value: 1.0 },
        uRegion2Bloom: { value: 1.3 },
        uRegion3Color: { value: new THREE.Vector3(0.8, 0.2, 1.0) }, // Purple pulse
        uRegion3Animation: { value: 2.0 }, // Pulse effect
        uRegion3Intensity: { value: 1.0 },
        uRegion3Bloom: { value: 1.2 },
        uRegion4Color: { value: new THREE.Vector3(1.0, 1.0, 1.0) }, // Rainbow
        uRegion4Animation: { value: 4.0 }, // Rainbow effect
        uRegion4Intensity: { value: 1.0 },
        uRegion4Bloom: { value: 1.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Store refs for dynamic updates
    materialRef.current = material;
    sceneRef.current = scene;
    composerRef.current = composer;
    geometryRef.current = geometry;

    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);

    // Hover detection
    const onMouseEnter = () => {
      isHoveringRef.current = true;
      material.uniforms.uIsHovering.value = 1.0;
    };
    const onMouseLeaveHover = () => {
      isHoveringRef.current = false;
      material.uniforms.uIsHovering.value = 0.0;
    };
    renderer.domElement.addEventListener('mouseenter', onMouseEnter);
    renderer.domElement.addEventListener('mouseleave', onMouseLeaveHover);

    // ========== PAINTING MODE EVENT HANDLERS ==========
    const paintRaycaster = new THREE.Raycaster();
    const paintMouse = new THREE.Vector2();

    const getPaintPosition = (e: MouseEvent): THREE.Vector3 | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      paintMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      paintMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      paintRaycaster.setFromCamera(paintMouse, camera);

      // Intersect with a plane at z=0 (model center)
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectPoint = new THREE.Vector3();
      paintRaycaster.ray.intersectPlane(planeZ, intersectPoint);

      return intersectPoint;
    };

    const onPaintStart = (e: MouseEvent) => {
      if (!paintingModeRef.current) return;
      if (e.button !== 0) return; // Left click only

      isPaintingRef.current = true;
      const pos = getPaintPosition(e);
      if (pos) {
        paintAtPosition(pos);
      }
    };

    const onPaintMove = (e: MouseEvent) => {
      if (!paintingModeRef.current || !isPaintingRef.current) return;

      const pos = getPaintPosition(e);
      if (pos) {
        paintAtPosition(pos);
      }
    };

    const onPaintEnd = () => {
      isPaintingRef.current = false;
    };

    renderer.domElement.addEventListener('mousedown', onPaintStart);
    renderer.domElement.addEventListener('mousemove', onPaintMove);
    renderer.domElement.addEventListener('mouseup', onPaintEnd);
    renderer.domElement.addEventListener('mouseleave', onPaintEnd);

    // Animation
    let time = 0;

    const animate = () => {
      time += 0.016;
      material.uniforms.uTime.value = time;
      material.uniforms.uMousePosition.value = mouseRef.current;
      material.uniforms.uIsHovering.value = isHoveringRef.current ? 1.0 : 0.0;

      // Update OrbitControls (handles damping and auto-rotate)
      controls.update();

      // Update auto-rotate speed from ref
      if (!autoRotationPaused) {
        controls.autoRotateSpeed = rotationSpeedRef.current * 10;
      }

      if (enableBloom || enableTrails) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
      if (bloomPassRef.current) {
        bloomPassRef.current.resolution.set(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup - CRITICAL for memory management
    return () => {
      console.log('Disposing Three.js scene...');

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (autoRotationResumeTimeout) {
        clearTimeout(autoRotationResumeTimeout);
      }

      // Remove event listeners
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseenter', onMouseEnter);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeaveHover);
      window.removeEventListener('resize', handleResize);
      // Remove painting event listeners
      renderer.domElement.removeEventListener('mousedown', onPaintStart);
      renderer.domElement.removeEventListener('mousemove', onPaintMove);
      renderer.domElement.removeEventListener('mouseup', onPaintEnd);
      renderer.domElement.removeEventListener('mouseleave', onPaintEnd);

      // Dispose controls
      controls.dispose();

      // Traverse and dispose ALL scene objects
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => {
                disposeMaterial(mat);
              });
            } else {
              disposeMaterial(object.material);
            }
          }
        }
      });

      // Clear scene
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }

      // Dispose composer and its render targets
      if (bloomPassRef.current) {
        bloomPassRef.current.dispose();
      }
      if (afterimagePassRef.current) {
        // AfterimagePass has internal render targets (use any to access internal props)
        const afterimage = afterimagePassRef.current as any;
        if (afterimage.textureComp) {
          afterimage.textureComp.dispose();
        }
        if (afterimage.textureOld) {
          afterimage.textureOld.dispose();
        }
      }
      composer.dispose();

      // Remove DOM element
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Force release WebGL context
      renderer.forceContextLoss();
      renderer.dispose();

      // Clear refs
      sceneRef.current = null;
      rendererRef.current = null;
      materialRef.current = null;
      composerRef.current = null;
      bloomPassRef.current = null;
      afterimagePassRef.current = null;
      geometryRef.current = null;
      cameraRef.current = null;
      particlesRef.current = null;

      console.log('Scene disposed successfully');
    };

    // Helper to dispose materials and their textures
    function disposeMaterial(material: THREE.Material) {
      material.dispose();
      // Dispose any textures
      for (const key of Object.keys(material)) {
        const value = (material as any)[key];
        if (value && value instanceof THREE.Texture) {
          value.dispose();
        }
      }
    }
  // ONLY structural props that require full scene recreation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointCloud, shape, particleCount, colorMode, customColor, backgroundColor, enableBloom, enableTrails, paintAtPosition]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // Dynamic uniform updates - these don't require scene recreation
  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current;

    // Update all dynamic uniforms
    m.uniforms.uBreathing.value = enableBreathing ? 1.0 : 0.0;
    m.uniforms.uBreathingSpeed.value = breathingSpeed;
    m.uniforms.uBreathingIntensity.value = breathingIntensity;
    m.uniforms.uShimmerIntensity.value = shimmerIntensity;
    m.uniforms.uBrightness.value = brightness;
    m.uniforms.uSaturation.value = saturation;
    m.uniforms.uHueShift.value = hueShift / 360.0;
    m.uniforms.uHoverMode.value = hoverModeToNumber(hoverMode);
    m.uniforms.uHoverIntensity.value = hoverIntensity;
    m.uniforms.uSharpness.value = particleSharpness;
    m.uniforms.uAnimationMode.value = animationModeToNumber(animationMode);
    m.uniforms.uAnimationSpeed.value = animationSpeed;
    m.uniforms.uAnimationIntensity.value = animationIntensity;
    m.uniforms.uNoiseEnabled.value = enableNoise ? 1.0 : 0.0;
    m.uniforms.uNoiseScale.value = noiseScale;
    m.uniforms.uNoiseSpeed.value = noiseSpeed;
    m.uniforms.uNoiseIntensity.value = noiseIntensity;
    m.uniforms.uExplosionProgress.value = explosionProgress;
    m.uniforms.uPhysicsEnabled.value = enablePhysics ? 1.0 : 0.0;
    m.uniforms.uGravity.value = gravity;
    m.uniforms.uTurbulence.value = turbulence;
    m.uniforms.uMouseForce.value = mouseForce;
    m.uniforms.uMouseRadius.value = mouseRadius;
    m.uniforms.uMouseEnabled.value = enableMouseInteraction ? 1.0 : 0.0;
  }, [
    enableBreathing, breathingSpeed, breathingIntensity, shimmerIntensity,
    brightness, saturation, hueShift, hoverMode, hoverIntensity, particleSharpness,
    animationMode, animationSpeed, animationIntensity,
    enableNoise, noiseScale, noiseSpeed, noiseIntensity,
    explosionProgress, enablePhysics, gravity, turbulence,
    mouseForce, mouseRadius, enableMouseInteraction
  ]);

  // Update rotation speed ref
  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  // Update bloom intensity dynamically
  useEffect(() => {
    if (bloomPassRef.current) {
      bloomPassRef.current.strength = bloomIntensity;
    }
  }, [bloomIntensity]);

  // Update trail length dynamically
  useEffect(() => {
    if (afterimagePassRef.current) {
      afterimagePassRef.current.uniforms['damp'].value = trailLength;
    }
  }, [trailLength]);

  // Update region configs dynamically
  useEffect(() => {
    if (!materialRef.current || !regionConfigs) return;
    const m = materialRef.current;

    // Update each region's uniforms (indices 0-3 in array correspond to regions 1-4)
    if (regionConfigs[0]) {
      m.uniforms.uRegion1Color.value.set(...regionConfigs[0].color);
      m.uniforms.uRegion1Animation.value = regionConfigs[0].animation;
      m.uniforms.uRegion1Intensity.value = regionConfigs[0].intensity;
      m.uniforms.uRegion1Bloom.value = regionConfigs[0].bloom;
    }
    if (regionConfigs[1]) {
      m.uniforms.uRegion2Color.value.set(...regionConfigs[1].color);
      m.uniforms.uRegion2Animation.value = regionConfigs[1].animation;
      m.uniforms.uRegion2Intensity.value = regionConfigs[1].intensity;
      m.uniforms.uRegion2Bloom.value = regionConfigs[1].bloom;
    }
    if (regionConfigs[2]) {
      m.uniforms.uRegion3Color.value.set(...regionConfigs[2].color);
      m.uniforms.uRegion3Animation.value = regionConfigs[2].animation;
      m.uniforms.uRegion3Intensity.value = regionConfigs[2].intensity;
      m.uniforms.uRegion3Bloom.value = regionConfigs[2].bloom;
    }
    if (regionConfigs[3]) {
      m.uniforms.uRegion4Color.value.set(...regionConfigs[3].color);
      m.uniforms.uRegion4Animation.value = regionConfigs[3].animation;
      m.uniforms.uRegion4Intensity.value = regionConfigs[3].intensity;
      m.uniforms.uRegion4Bloom.value = regionConfigs[3].bloom;
    }
  }, [regionConfigs]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: paintingMode ? 'crosshair' : 'default',
        ...style,
      }}
    />
  );
}

export default Generated3DParticles;
