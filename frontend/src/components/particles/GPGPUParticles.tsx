/**
 * GPGPUParticles.tsx
 *
 * CUTTING-EDGE GPGPU Particle System for 3Dme (2025)
 *
 * Features:
 * - GPU-computed physics via ping-pong FBO textures
 * - Strange attractors (Thomas, Lorenz, Aizawa)
 * - Curl noise for organic flow
 * - Mouse force field (attract/repel)
 * - Support for 500k+ particles at 60fps
 * - Integration with point cloud data
 *
 * Research sources:
 * - Codrops Dreamy Particles (Dec 2024)
 * - Maxime Heckel TSL & WebGPU Field Guide (Oct 2025)
 * - Wawa Sensei GPGPU Course
 * - Three.js GPUComputationRenderer
 */

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PointCloudData } from '../../utils/glbToPointCloud';

// ============================================================================
// TYPES
// ============================================================================

export type AttractorType = 'none' | 'thomas' | 'lorenz' | 'aizawa' | 'halvorsen' | 'curl';
export type ForceMode = 'repel' | 'attract' | 'orbit' | 'vortex';

export interface GPGPUParticlesProps {
  // Data source
  pointCloud?: PointCloudData | null;
  particleCount?: number; // If no pointCloud, generate this many

  // Physics
  attractorType?: AttractorType;
  attractorStrength?: number;
  attractorScale?: number;
  friction?: number; // Velocity damping (0-1)
  returnForce?: number; // Force to return to original position

  // Mouse interaction
  enableMouse?: boolean;
  mouseForce?: number;
  mouseRadius?: number;
  forceMode?: ForceMode;

  // Visual
  particleSize?: number;
  colorMode?: 'original' | 'velocity' | 'position' | 'rainbow' | 'golden';
  glowIntensity?: number;
  trailLength?: number; // 0 = no trails, 1 = long trails

  // Post-processing
  enableBloom?: boolean;
  bloomStrength?: number;
  backgroundColor?: string;

  // Performance
  simulationSpeed?: number;
  textureSize?: number; // 256, 512, 1024 (particles = textureSize^2)

  // Container
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// GPGPU SIMULATION SHADERS
// ============================================================================

// Position update shader - reads velocity, updates position
// Note: texturePosition and textureVelocity are automatically added by GPUComputationRenderer
const positionShader = `
  uniform float uDeltaTime;
  uniform float uTime;
  uniform float uReturnForce;
  uniform sampler2D textureOriginalPosition;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 posData = texture2D(texturePosition, uv);
    vec3 pos = posData.xyz;
    float life = posData.w;

    vec3 vel = texture2D(textureVelocity, uv).xyz;
    vec3 originalPos = texture2D(textureOriginalPosition, uv).xyz;

    // Update position based on velocity
    pos += vel * uDeltaTime * 60.0;

    // Soft return to original position
    vec3 toOrigin = originalPos - pos;
    float dist = length(toOrigin);
    if (dist > 0.1) {
      pos += normalize(toOrigin) * uReturnForce * uDeltaTime * 60.0 * min(dist * 0.1, 1.0);
    }

    gl_FragColor = vec4(pos, life);
  }
`;

// Velocity update shader - applies forces, attractors, mouse interaction
// Note: texturePosition and textureVelocity are automatically added by GPUComputationRenderer
const velocityShader = `
  uniform float uDeltaTime;
  uniform float uTime;
  uniform float uFriction;
  uniform float uAttractorStrength;
  uniform float uAttractorScale;
  uniform int uAttractorType; // 0=none, 1=thomas, 2=lorenz, 3=aizawa, 4=halvorsen, 5=curl
  uniform vec3 uMousePosition;
  uniform float uMouseForce;
  uniform float uMouseRadius;
  uniform int uForceMode; // 0=repel, 1=attract, 2=orbit, 3=vortex
  uniform float uMouseEnabled;
  uniform sampler2D textureOriginalPosition;

  // Simplex noise for curl
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

  // Curl noise - divergence-free for smooth flow
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

  // Thomas attractor - creates beautiful spiraling orbits
  vec3 thomasAttractor(vec3 pos) {
    float b = 0.208186;
    float dt = 0.1;

    float dx = (-b * pos.x + sin(pos.y)) * dt;
    float dy = (-b * pos.y + sin(pos.z)) * dt;
    float dz = (-b * pos.z + sin(pos.x)) * dt;

    return vec3(dx, dy, dz);
  }

  // Lorenz attractor - chaotic butterfly
  vec3 lorenzAttractor(vec3 pos) {
    float sigma = 10.0;
    float rho = 28.0;
    float beta = 8.0 / 3.0;
    float dt = 0.005;

    float dx = sigma * (pos.y - pos.x) * dt;
    float dy = (pos.x * (rho - pos.z) - pos.y) * dt;
    float dz = (pos.x * pos.y - beta * pos.z) * dt;

    return vec3(dx, dy, dz);
  }

  // Aizawa attractor - creates torus-like shapes
  vec3 aizawaAttractor(vec3 pos) {
    float a = 0.95;
    float b = 0.7;
    float c = 0.6;
    float d = 3.5;
    float e = 0.25;
    float f = 0.1;
    float dt = 0.01;

    float dx = ((pos.z - b) * pos.x - d * pos.y) * dt;
    float dy = (d * pos.x + (pos.z - b) * pos.y) * dt;
    float dz = (c + a * pos.z - pos.z * pos.z * pos.z / 3.0 -
                (pos.x * pos.x + pos.y * pos.y) * (1.0 + e * pos.z) +
                f * pos.z * pos.x * pos.x * pos.x) * dt;

    return vec3(dx, dy, dz);
  }

  // Halvorsen attractor - creates 3D spirals
  vec3 halvorsenAttractor(vec3 pos) {
    float a = 1.89;
    float dt = 0.005;

    float dx = (-a * pos.x - 4.0 * pos.y - 4.0 * pos.z - pos.y * pos.y) * dt;
    float dy = (-a * pos.y - 4.0 * pos.z - 4.0 * pos.x - pos.z * pos.z) * dt;
    float dz = (-a * pos.z - 4.0 * pos.x - 4.0 * pos.y - pos.x * pos.x) * dt;

    return vec3(dx, dy, dz);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 posData = texture2D(texturePosition, uv);
    vec3 pos = posData.xyz;

    vec4 velData = texture2D(textureVelocity, uv);
    vec3 vel = velData.xyz;

    vec3 originalPos = texture2D(textureOriginalPosition, uv).xyz;

    // Apply friction (velocity damping)
    vel *= uFriction;

    // Apply attractor force
    vec3 attractorForce = vec3(0.0);
    vec3 scaledPos = pos * uAttractorScale;

    if (uAttractorType == 1) {
      attractorForce = thomasAttractor(scaledPos + uTime * 0.1);
    } else if (uAttractorType == 2) {
      attractorForce = lorenzAttractor(scaledPos * 0.1);
    } else if (uAttractorType == 3) {
      attractorForce = aizawaAttractor(scaledPos * 0.5);
    } else if (uAttractorType == 4) {
      attractorForce = halvorsenAttractor(scaledPos * 0.3);
    } else if (uAttractorType == 5) {
      // Curl noise
      attractorForce = curlNoise(scaledPos * 0.05 + uTime * 0.2) * 0.5;
    }

    vel += attractorForce * uAttractorStrength;

    // Mouse interaction
    if (uMouseEnabled > 0.5) {
      vec3 toMouse = uMousePosition - pos;
      float dist = length(toMouse);

      if (dist < uMouseRadius && dist > 0.01) {
        float strength = (1.0 - dist / uMouseRadius) * uMouseForce;
        vec3 direction = normalize(toMouse);

        if (uForceMode == 0) {
          // Repel
          vel -= direction * strength;
        } else if (uForceMode == 1) {
          // Attract
          vel += direction * strength;
        } else if (uForceMode == 2) {
          // Orbit - perpendicular force
          vec3 perp = cross(direction, vec3(0.0, 1.0, 0.0));
          if (length(perp) < 0.01) perp = cross(direction, vec3(1.0, 0.0, 0.0));
          vel += normalize(perp) * strength;
        } else if (uForceMode == 3) {
          // Vortex - spiral inward
          vec3 perp = cross(direction, vec3(0.0, 1.0, 0.0));
          if (length(perp) < 0.01) perp = cross(direction, vec3(1.0, 0.0, 0.0));
          vel += normalize(perp) * strength * 0.7;
          vel += direction * strength * 0.3;
        }
      }
    }

    // Clamp velocity to prevent explosion
    float maxVel = 2.0;
    if (length(vel) > maxVel) {
      vel = normalize(vel) * maxVel;
    }

    gl_FragColor = vec4(vel, 1.0);
  }
`;

// ============================================================================
// RENDERING SHADERS
// ============================================================================

const renderVertexShader = `
  attribute float particleIndex;
  attribute vec3 originalColor;

  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;
  uniform float uTextureSize;
  uniform float uParticleSize;
  uniform float uPixelRatio;
  uniform int uColorMode; // 0=original, 1=velocity, 2=position, 3=rainbow, 4=golden
  uniform float uTime;

  varying vec3 vColor;
  varying float vVelocityMag;
  varying float vLife;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    // Calculate UV from particle index - sample texel centers (add 0.5)
    float index = particleIndex;
    float u = (mod(index, uTextureSize) + 0.5) / uTextureSize;
    float v = (floor(index / uTextureSize) + 0.5) / uTextureSize;
    vec2 uv = vec2(u, v);

    // Sample position and velocity from GPGPU textures
    vec4 posData = texture2D(texturePosition, uv);
    vec3 pos = posData.xyz;
    float life = posData.w;

    // Fallback: if position texture not ready, use dummy position attribute
    if (length(pos) < 0.001) {
      pos = position; // Use the geometry's position attribute as fallback
    }

    vec3 vel = texture2D(textureVelocity, uv).xyz;
    float velMag = length(vel);

    vVelocityMag = velMag;
    vLife = life;

    // Color based on mode
    if (uColorMode == 0) {
      // Original colors
      vColor = originalColor;
    } else if (uColorMode == 1) {
      // Velocity-based coloring - cool to hot
      float t = clamp(velMag * 2.0, 0.0, 1.0);
      vColor = mix(vec3(0.2, 0.5, 1.0), vec3(1.0, 0.3, 0.1), t);
      vColor = mix(vColor, vec3(1.0, 1.0, 0.5), pow(t, 3.0));
    } else if (uColorMode == 2) {
      // Position-based rainbow
      float hue = fract(pos.x * 0.01 + pos.y * 0.01 + pos.z * 0.01 + uTime * 0.1);
      vColor = hsv2rgb(vec3(hue, 0.8, 1.0));
    } else if (uColorMode == 3) {
      // Rainbow cycling
      float hue = fract(index / uTextureSize / uTextureSize + uTime * 0.05);
      vColor = hsv2rgb(vec3(hue, 0.9, 1.0));
    } else if (uColorMode == 4) {
      // Golden (dreamy particles style)
      vColor = vec3(0.808, 0.647, 0.239);
      // Add glow based on velocity
      vColor = mix(vColor, vec3(1.0, 0.95, 0.8), velMag * 0.5);
    }

    // Boost color based on velocity
    vColor *= 1.0 + velMag * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size with velocity-based variation - ensure minimum visibility
    float sizeBoost = 1.0 + velMag * 0.3;
    float baseSize = max(uParticleSize, 2.0); // Ensure minimum size
    gl_PointSize = baseSize * sizeBoost * uPixelRatio * (200.0 / max(-mvPosition.z, 1.0));
    gl_PointSize = clamp(gl_PointSize, 2.0, 64.0); // Ensure visible but not too large
  }
`;

const renderFragmentShader = `
  varying vec3 vColor;
  varying float vVelocityMag;
  varying float vLife;

  uniform float uGlowIntensity;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float dist = length(uv);

    // Soft circular particle with glow - ensure visibility
    float core = 1.0 - smoothstep(0.0, 0.4, dist);
    float innerGlow = 1.0 - smoothstep(0.3, 0.7, dist);
    float outerGlow = 1.0 - smoothstep(0.5, 1.0, dist);

    float intensity = core * 1.2 + innerGlow * 0.4 * uGlowIntensity + outerGlow * 0.15 * uGlowIntensity;

    // Lower discard threshold for better visibility
    if (dist > 1.0) discard;

    // Velocity-based glow boost
    float velGlow = 1.0 + vVelocityMag * uGlowIntensity * 0.5;

    // Ensure minimum color brightness
    vec3 finalColor = max(vColor * velGlow, vec3(0.1));

    // Ensure minimum alpha for visibility
    float alpha = max(intensity, 0.2);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

export function GPGPUParticles({
  pointCloud,
  particleCount: _particleCount = 100000, // Reserved for future use
  attractorType = 'thomas',
  attractorStrength = 0.3,
  attractorScale = 0.02,
  friction = 0.98,
  returnForce = 0.01,
  enableMouse = true,
  mouseForce = 0.5,
  mouseRadius = 50,
  forceMode = 'repel',
  particleSize = 2,
  colorMode = 'golden',
  glowIntensity = 1,
  trailLength: _trailLength = 0, // Reserved for trail effects
  enableBloom = true,
  bloomStrength = 0.8,
  backgroundColor = '#0a0a0f',
  simulationSpeed = 1,
  textureSize = 512, // 512^2 = 262,144 particles
  className,
  style,
}: GPGPUParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const gpuComputeRef = useRef<GPUComputationRenderer | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mouseRef = useRef(new THREE.Vector3(0, 0, 0));

  const attractorTypeToNumber = (type: AttractorType): number => {
    const types: Record<AttractorType, number> = {
      none: 0,
      thomas: 1,
      lorenz: 2,
      aizawa: 3,
      halvorsen: 4,
      curl: 5,
    };
    return types[type];
  };

  const forceModeToNumber = (mode: ForceMode): number => {
    const modes: Record<ForceMode, number> = {
      repel: 0,
      attract: 1,
      orbit: 2,
      vortex: 3,
    };
    return modes[mode];
  };

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Get computed dimensions
    const rect = container.getBoundingClientRect();
    const width = rect.width || container.clientWidth || window.innerWidth;
    const height = rect.height || container.clientHeight || window.innerHeight;

    console.log('[GPGPU] Container dimensions:', {
      clientWidth: container.clientWidth,
      clientHeight: container.clientHeight,
      boundingRect: { width: rect.width, height: rect.height },
      finalDimensions: { width, height }
    });

    if (width === 0 || height === 0) {
      console.log('[GPGPU] Dimensions not ready, retrying in 100ms...');
      setTimeout(() => initScene(), 100);
      return;
    }

    // Clean up existing
    if (rendererRef.current) {
      rendererRef.current.forceContextLoss();
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    // Determine actual particle count based on texture size
    const actualTextureSize = textureSize;
    const totalParticles = actualTextureSize * actualTextureSize;

    console.log(`[GPGPU] Initializing with ${totalParticles.toLocaleString()} particles (${actualTextureSize}x${actualTextureSize} texture)`);
    console.log(`[GPGPU] Container size: ${width}x${height}`);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.z = 150;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false, // Ensure background is visible
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(backgroundColor), 1);

    // Append canvas and verify
    container.appendChild(renderer.domElement);
    console.log('[GPGPU] Canvas appended to container:', renderer.domElement.tagName);
    console.log('[GPGPU] Canvas size:', renderer.domElement.width, 'x', renderer.domElement.height);

    // Check WebGL2 support for GPUComputationRenderer
    if (!renderer.capabilities.isWebGL2) {
      console.error('WebGL2 required for GPGPU particles');
      return;
    }

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.minDistance = 10;
    controls.maxDistance = 1000;

    // ========== GPGPU SETUP ==========
    const gpuCompute = new GPUComputationRenderer(actualTextureSize, actualTextureSize, renderer);
    gpuComputeRef.current = gpuCompute;

    // Create initial data textures
    const dtPosition = gpuCompute.createTexture();
    const dtVelocity = gpuCompute.createTexture();
    const dtOriginalPosition = gpuCompute.createTexture();

    // Fill initial positions and colors
    const posArray = dtPosition.image.data as Float32Array;
    const velArray = dtVelocity.image.data as Float32Array;
    const origPosArray = dtOriginalPosition.image.data as Float32Array;
    const colors = new Float32Array(totalParticles * 3);

    // Use point cloud data if available, otherwise generate sphere
    if (pointCloud && pointCloud.positions && pointCloud.positions.length >= 3) {
      const pcCount = Math.min(pointCloud.count, totalParticles);
      console.log(`Using ${pcCount} points from point cloud`);

      for (let i = 0; i < totalParticles; i++) {
        const srcIdx = i % pcCount; // Wrap around if more particles than point cloud

        // Position
        const x = pointCloud.positions[srcIdx * 3];
        const y = pointCloud.positions[srcIdx * 3 + 1];
        const z = pointCloud.positions[srcIdx * 3 + 2];

        posArray[i * 4] = x;
        posArray[i * 4 + 1] = y;
        posArray[i * 4 + 2] = z;
        posArray[i * 4 + 3] = 1.0; // life

        origPosArray[i * 4] = x;
        origPosArray[i * 4 + 1] = y;
        origPosArray[i * 4 + 2] = z;
        origPosArray[i * 4 + 3] = 1.0;

        // Velocity - start with zero
        velArray[i * 4] = 0;
        velArray[i * 4 + 1] = 0;
        velArray[i * 4 + 2] = 0;
        velArray[i * 4 + 3] = 1.0;

        // Color
        if (pointCloud.colors && pointCloud.colors.length > srcIdx * 3) {
          colors[i * 3] = pointCloud.colors[srcIdx * 3];
          colors[i * 3 + 1] = pointCloud.colors[srcIdx * 3 + 1];
          colors[i * 3 + 2] = pointCloud.colors[srcIdx * 3 + 2];
        } else {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 1;
          colors[i * 3 + 2] = 1;
        }
      }
    } else {
      // Generate sphere distribution
      console.log('Generating sphere distribution');
      for (let i = 0; i < totalParticles; i++) {
        // Fibonacci sphere distribution
        const phi = Math.acos(1 - 2 * (i + 0.5) / totalParticles);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const radius = 50 * (0.8 + Math.random() * 0.4);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        posArray[i * 4] = x;
        posArray[i * 4 + 1] = y;
        posArray[i * 4 + 2] = z;
        posArray[i * 4 + 3] = 1.0;

        origPosArray[i * 4] = x;
        origPosArray[i * 4 + 1] = y;
        origPosArray[i * 4 + 2] = z;
        origPosArray[i * 4 + 3] = 1.0;

        velArray[i * 4] = 0;
        velArray[i * 4 + 1] = 0;
        velArray[i * 4 + 2] = 0;
        velArray[i * 4 + 3] = 1.0;

        // Rainbow color
        const t = i / totalParticles;
        colors[i * 3] = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
        colors[i * 3 + 1] = Math.sin(t * Math.PI * 2 + 2.094) * 0.5 + 0.5;
        colors[i * 3 + 2] = Math.sin(t * Math.PI * 2 + 4.189) * 0.5 + 0.5;
      }
    }

    // Debug: verify data textures have valid data
    console.log('[GPGPU] Position data sample (first 4 particles):',
      Array.from(posArray.slice(0, 16)).map((v, i) => `[${i}]=${v.toFixed(2)}`).join(', '));
    console.log('[GPGPU] Velocity data sample:',
      Array.from(velArray.slice(0, 8)).map((v, i) => `[${i}]=${v.toFixed(2)}`).join(', '));

    // Mark textures as needing update
    dtPosition.needsUpdate = true;
    dtVelocity.needsUpdate = true;

    // Create compute variables
    const positionVariable = gpuCompute.addVariable('texturePosition', positionShader, dtPosition);
    const velocityVariable = gpuCompute.addVariable('textureVelocity', velocityShader, dtVelocity);

    // Set dependencies (each reads from both)
    gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);
    gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);

    // Create original position texture (read-only)
    const originalPositionTexture = new THREE.DataTexture(
      origPosArray,
      actualTextureSize,
      actualTextureSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    originalPositionTexture.needsUpdate = true;
    originalPositionTexture.minFilter = THREE.NearestFilter;
    originalPositionTexture.magFilter = THREE.NearestFilter;

    // Position shader uniforms
    positionVariable.material.uniforms.uDeltaTime = { value: 0.016 };
    positionVariable.material.uniforms.uTime = { value: 0 };
    positionVariable.material.uniforms.uReturnForce = { value: returnForce };
    positionVariable.material.uniforms.textureOriginalPosition = { value: originalPositionTexture };

    // Velocity shader uniforms
    velocityVariable.material.uniforms.uDeltaTime = { value: 0.016 };
    velocityVariable.material.uniforms.uTime = { value: 0 };
    velocityVariable.material.uniforms.uFriction = { value: friction };
    velocityVariable.material.uniforms.uAttractorStrength = { value: attractorStrength };
    velocityVariable.material.uniforms.uAttractorScale = { value: attractorScale };
    velocityVariable.material.uniforms.uAttractorType = { value: attractorTypeToNumber(attractorType) };
    velocityVariable.material.uniforms.uMousePosition = { value: mouseRef.current };
    velocityVariable.material.uniforms.uMouseForce = { value: mouseForce };
    velocityVariable.material.uniforms.uMouseRadius = { value: mouseRadius };
    velocityVariable.material.uniforms.uForceMode = { value: forceModeToNumber(forceMode) };
    velocityVariable.material.uniforms.uMouseEnabled = { value: enableMouse ? 1.0 : 0.0 };
    velocityVariable.material.uniforms.textureOriginalPosition = { value: originalPositionTexture };

    // Initialize GPUCompute
    const error = gpuCompute.init();
    if (error !== null) {
      console.error('[GPGPU] GPUComputationRenderer error:', error);
      return;
    }
    console.log('[GPGPU] GPUComputationRenderer initialized successfully');

    // ========== PARTICLE RENDERING ==========
    const geometry = new THREE.BufferGeometry();

    // Particle indices (to sample from textures)
    const indices = new Float32Array(totalParticles);
    // Dummy positions - required by THREE.Points even though we override in shader
    const dummyPositions = new Float32Array(totalParticles * 3);
    for (let i = 0; i < totalParticles; i++) {
      indices[i] = i;
      // Copy initial positions for the dummy attribute
      dummyPositions[i * 3] = posArray[i * 4];
      dummyPositions[i * 3 + 1] = posArray[i * 4 + 1];
      dummyPositions[i * 3 + 2] = posArray[i * 4 + 2];
    }
    // Position attribute is REQUIRED for THREE.Points to render
    geometry.setAttribute('position', new THREE.BufferAttribute(dummyPositions, 3));
    geometry.setAttribute('particleIndex', new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute('originalColor', new THREE.BufferAttribute(colors, 3));

    // Set bounding sphere to prevent culling (particles move dynamically via shader)
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1000);

    // Render material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        texturePosition: { value: null },
        textureVelocity: { value: null },
        uTextureSize: { value: actualTextureSize },
        uParticleSize: { value: particleSize },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uColorMode: { value: colorMode === 'original' ? 0 : colorMode === 'velocity' ? 1 : colorMode === 'position' ? 2 : colorMode === 'rainbow' ? 3 : 4 },
        uTime: { value: 0 },
        uGlowIntensity: { value: glowIntensity },
      },
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false; // Disable frustum culling entirely
    scene.add(particles);
    console.log(`[GPGPU] Created Points mesh with ${totalParticles} vertices`);
    console.log(`[GPGPU] Points visible: ${particles.visible}, frustumCulled: ${particles.frustumCulled}`);
    console.log(`[GPGPU] Geometry attributes:`, Object.keys(geometry.attributes));
    console.log(`[GPGPU] Material transparent: ${material.transparent}, depthWrite: ${material.depthWrite}`);

    // ========== POST-PROCESSING ==========
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    if (enableBloom) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        bloomStrength,
        0.4,
        0.85
      );
      composer.addPass(bloomPass);
    }

    // ========== MOUSE TRACKING ==========
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, point);
      if (point) {
        mouseRef.current.copy(point);
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // ========== INITIALIZE TEXTURES ==========
    // Run one compute pass to initialize the textures before first render
    gpuCompute.compute();
    material.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
    material.uniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
    console.log('[GPGPU] Initial compute pass completed, textures initialized');

    // ========== ANIMATION LOOP ==========
    let time = 0;
    let frameCount = 0;

    const animate = () => {
      const deltaTime = 0.016 * simulationSpeed;
      time += deltaTime;
      frameCount++;

      // Log first frames to confirm animation is running
      if (frameCount === 1) {
        console.log('[GPGPU] Animation loop started');
        console.log('[GPGPU] Camera position:', camera.position.toArray());
        console.log('[GPGPU] Scene children:', scene.children.length);
      }
      if (frameCount === 5) {
        // Log texture state after a few frames
        const posTexture = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
        const texImage = posTexture.image as { width?: number; height?: number } | null;
        console.log('[GPGPU] Position texture after 5 frames:', {
          width: texImage?.width,
          height: texImage?.height,
          format: posTexture.format,
          type: posTexture.type
        });
      }

      // Update GPGPU uniforms
      positionVariable.material.uniforms.uDeltaTime.value = deltaTime;
      positionVariable.material.uniforms.uTime.value = time;

      velocityVariable.material.uniforms.uDeltaTime.value = deltaTime;
      velocityVariable.material.uniforms.uTime.value = time;
      velocityVariable.material.uniforms.uMousePosition.value = mouseRef.current;

      // Run GPU compute
      gpuCompute.compute();

      // Update render material with computed textures
      material.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
      material.uniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
      material.uniforms.uTime.value = time;

      controls.update();
      composer.render();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // ========== RESIZE HANDLER ==========
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // ========== CLEANUP ==========
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);

      controls.dispose();
      geometry.dispose();
      material.dispose();
      composer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.forceContextLoss();
      renderer.dispose();
      rendererRef.current = null;
      gpuComputeRef.current = null;
    };
  }, [
    pointCloud,
    textureSize,
    backgroundColor,
    attractorType,
    attractorStrength,
    attractorScale,
    friction,
    returnForce,
    enableMouse,
    mouseForce,
    mouseRadius,
    forceMode,
    particleSize,
    colorMode,
    glowIntensity,
    enableBloom,
    bloomStrength,
    simulationSpeed,
  ]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

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
        ...style,
      }}
    />
  );
}

export default GPGPUParticles;
