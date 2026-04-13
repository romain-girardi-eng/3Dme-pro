/**
 * MorphingParticles.tsx
 *
 * Advanced morphing particle system for 3Dme.
 * Transitions between various 3D shapes with stunning visual effects.
 */

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { SHAPE_NAMES } from './MorphingParticles.types';
import type { MorphingParticlesConfig } from './MorphingParticles.types';
export type { ShapeName, MorphingParticlesConfig } from './MorphingParticles.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const defaultConfig: Required<MorphingParticlesConfig> = {
  particleCount: 50000,
  morphDuration: 6,
  rotationSpeed: 0.15,
  particleSize: 1.5,

  // Lines disabled by default
  enableLines: false,
  lineOpacity: 0.15,
  connectionDistance: 20,

  colorScheme: 'rainbow',
  customColors: { primary: '#8b5cf6', secondary: '#06b6d4', accent: '#f59e0b' },
  selectedShape: null,

  enableBloom: false,
  bloomIntensity: 0.5,
  enableTrails: false,
  trailLength: 0.3,
  enableDepthOfField: false,

  enableZoom: true,
  enableHover: false,
  enableKeyboard: true,

  enableBreathing: true,
  breathingSpeed: 0.3,
  enableStaggeredMorph: false,
  staggerDirection: 'radial',
};

// Color schemes (renamed for standalone app)
const colorSchemes: Record<string, { primary: THREE.Color; secondary: THREE.Color; accent: THREE.Color }> = {
  neon: {
    primary: new THREE.Color(0xff00ff),
    secondary: new THREE.Color(0x00ffff),
    accent: new THREE.Color(0xffff00),
  },
  sunset: {
    primary: new THREE.Color(0xff6b6b),
    secondary: new THREE.Color(0xfeca57),
    accent: new THREE.Color(0xff9ff3),
  },
  ocean: {
    primary: new THREE.Color(0x667eea),
    secondary: new THREE.Color(0x48c6ef),
    accent: new THREE.Color(0x06d6a0),
  },
  forest: {
    primary: new THREE.Color(0x2d6a4f),
    secondary: new THREE.Color(0x74c69d),
    accent: new THREE.Color(0xd4a574),
  },
  rainbow: {
    primary: new THREE.Color(0xff1493),
    secondary: new THREE.Color(0x00ffff),
    accent: new THREE.Color(0x7fff00),
  },
  custom: {
    primary: new THREE.Color(0x8b5cf6),
    secondary: new THREE.Color(0x06b6d4),
    accent: new THREE.Color(0xf59e0b),
  },
};

const rainbowPalette = [
  new THREE.Color(0xff1493),
  new THREE.Color(0xff6b6b),
  new THREE.Color(0xffa500),
  new THREE.Color(0xffd700),
  new THREE.Color(0x7fff00),
  new THREE.Color(0x00ff7f),
  new THREE.Color(0x00ffff),
  new THREE.Color(0x00bfff),
  new THREE.Color(0x8a2be2),
  new THREE.Color(0xff00ff),
  new THREE.Color(0xffffff),
];

// ============================================================================
// SHAPE GENERATORS
// ============================================================================

type ShapeData = { pos: THREE.Vector3; normal: THREE.Vector3 };
type ShapeGenerator = (index: number, total: number) => ShapeData;

const SCALE = 0.8;

/** Sphere - Classic spherical distribution */
const generateSphere: ShapeGenerator = (index, total) => {
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  const radius = 60 * SCALE;

  const pos = new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );

  const normal = pos.clone().normalize();
  return { pos, normal };
};

/** Cube - Geometric cube with particles on surfaces */
const generateCube: ShapeGenerator = (index, total) => {
  const size = 80 * SCALE;
  const halfSize = size / 2;
  const particlesPerFace = Math.floor(total / 6);
  const face = Math.floor(index / particlesPerFace) % 6;
  const localIndex = index % particlesPerFace;

  const gridSize = Math.ceil(Math.sqrt(particlesPerFace));
  const row = Math.floor(localIndex / gridSize);
  const col = localIndex % gridSize;
  const u = (col / gridSize - 0.5) * size;
  const v = (row / gridSize - 0.5) * size;

  let pos = new THREE.Vector3();
  let normal = new THREE.Vector3();

  switch (face) {
    case 0: pos.set(u, v, halfSize); normal.set(0, 0, 1); break;
    case 1: pos.set(u, v, -halfSize); normal.set(0, 0, -1); break;
    case 2: pos.set(halfSize, u, v); normal.set(1, 0, 0); break;
    case 3: pos.set(-halfSize, u, v); normal.set(-1, 0, 0); break;
    case 4: pos.set(u, halfSize, v); normal.set(0, 1, 0); break;
    case 5: pos.set(u, -halfSize, v); normal.set(0, -1, 0); break;
  }

  pos.x += (Math.random() - 0.5) * 3;
  pos.y += (Math.random() - 0.5) * 3;
  pos.z += (Math.random() - 0.5) * 3;

  return { pos, normal };
};

/** Torus - Donut shape */
const generateTorus: ShapeGenerator = (index, total) => {
  const majorRadius = 50 * SCALE;
  const minorRadius = 20 * SCALE;

  const u = (index / total) * Math.PI * 2 * 12;
  const v = (index * 2.399963229728653) % (Math.PI * 2);

  const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
  const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
  const z = minorRadius * Math.sin(v);

  const pos = new THREE.Vector3(x, z, y);
  const normal = new THREE.Vector3(
    Math.cos(v) * Math.cos(u),
    Math.sin(v),
    Math.cos(v) * Math.sin(u)
  ).normalize();

  return { pos, normal };
};

/** Heart - 3D heart shape */
const generateHeart: ShapeGenerator = (index, total) => {
  const t = index / total;
  const phi = Math.acos(1 - 2 * t);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;

  const scale = 55 * SCALE;
  let x = Math.sin(phi) * Math.cos(theta);
  let y = Math.cos(phi);
  let z = Math.sin(phi) * Math.sin(theta);

  // Heart transformation
  const heartX = x * Math.pow(Math.abs(z), 0.3) * 1.2;
  const heartY = y + 0.3 * Math.abs(x);
  const heartZ = z;

  // Apply cardioid shape
  const r = 1 - Math.sin(Math.atan2(heartY, Math.sqrt(heartX * heartX + heartZ * heartZ)));

  const pos = new THREE.Vector3(
    heartX * scale * r,
    heartY * scale * 0.9,
    heartZ * scale * r
  );

  const normal = pos.clone().normalize();
  return { pos, normal };
};

/** Star - 3D five-pointed star */
const generateStar: ShapeGenerator = (index, total) => {
  const numPoints = 5;
  const outerRadius = 60 * SCALE;
  const innerRadius = 25 * SCALE;
  const depth = 20 * SCALE;

  const t = index / total;
  const angle = t * Math.PI * 2 * numPoints;
  const pointIndex = Math.floor(angle / (Math.PI * 2 / numPoints));
  const localAngle = angle % (Math.PI * 2 / numPoints);

  // Alternate between outer and inner radius
  const isOuter = localAngle < Math.PI / numPoints;
  const radius = isOuter
    ? outerRadius * (1 - (localAngle / (Math.PI / numPoints)) * 0.5)
    : innerRadius + (outerRadius - innerRadius) * ((localAngle - Math.PI / numPoints) / (Math.PI / numPoints));

  const starAngle = (pointIndex + 0.5) * (Math.PI * 2 / numPoints) + localAngle;
  const z = (Math.random() - 0.5) * depth;

  const pos = new THREE.Vector3(
    Math.cos(starAngle) * radius,
    Math.sin(starAngle) * radius,
    z
  );

  const normal = new THREE.Vector3(Math.cos(starAngle), Math.sin(starAngle), 0).normalize();
  return { pos, normal };
};

/** DNA Helix - Double helix structure */
const generateDNAHelix: ShapeGenerator = (index, total) => {
  const helixHeight = 120 * SCALE;
  const helixRadius = 25 * SCALE;
  const turns = 3;

  const t = index / total;
  const angle = t * Math.PI * 2 * turns;
  const y = (t - 0.5) * helixHeight;

  // Two strands
  const strand = index % 2;
  const strandOffset = strand * Math.PI;

  // Main strand position
  const x = Math.cos(angle + strandOffset) * helixRadius;
  const z = Math.sin(angle + strandOffset) * helixRadius;

  // Add connecting bars between strands
  const isBar = (index % 20) < 3;
  let pos: THREE.Vector3;

  if (isBar) {
    const barT = (index % 20) / 3;
    const x1 = Math.cos(angle) * helixRadius;
    const z1 = Math.sin(angle) * helixRadius;
    const x2 = Math.cos(angle + Math.PI) * helixRadius;
    const z2 = Math.sin(angle + Math.PI) * helixRadius;
    pos = new THREE.Vector3(
      x1 + (x2 - x1) * barT,
      y,
      z1 + (z2 - z1) * barT
    );
  } else {
    pos = new THREE.Vector3(x, y, z);
  }

  const normal = new THREE.Vector3(x, 0, z).normalize();
  return { pos, normal };
};

/** Wave - Sine wave surface */
const generateWave: ShapeGenerator = (index, total) => {
  const gridSize = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  const width = 100 * SCALE;
  const depth = 100 * SCALE;
  const amplitude = 20 * SCALE;

  const x = (col / gridSize - 0.5) * width;
  const z = (row / gridSize - 0.5) * depth;
  const y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * amplitude;

  const pos = new THREE.Vector3(x, y, z);

  // Calculate normal from wave gradient
  const dx = Math.cos(x * 0.08) * 0.08 * amplitude;
  const dz = -Math.sin(z * 0.08) * 0.08 * amplitude;
  const normal = new THREE.Vector3(-dx, 1, -dz).normalize();

  return { pos, normal };
};

/** Galaxy - Spiral galaxy shape */
const generateGalaxy: ShapeGenerator = (index, total) => {
  const numArms = 4;
  const armIndex = index % numArms;
  const indexInArm = Math.floor(index / numArms);
  const particlesPerArm = Math.floor(total / numArms);

  const t = indexInArm / particlesPerArm;
  const baseAngle = (armIndex / numArms) * Math.PI * 2;
  const spiralAngle = baseAngle + t * Math.PI * 3;
  const radius = t * 80 * SCALE;

  // Add spread perpendicular to arm
  const spread = (Math.random() - 0.5) * 15 * SCALE * (1 - t * 0.5);
  const verticalSpread = (Math.random() - 0.5) * 5 * SCALE * (1 - t);

  const x = Math.cos(spiralAngle) * radius + Math.cos(spiralAngle + Math.PI/2) * spread;
  const z = Math.sin(spiralAngle) * radius + Math.sin(spiralAngle + Math.PI/2) * spread;
  const y = verticalSpread;

  // Center bulge
  if (t < 0.15) {
    const bulgeT = t / 0.15;
    const bulgeRadius = (1 - bulgeT) * 15 * SCALE;
    const phi = Math.acos(1 - 2 * (indexInArm % 100) / 100);
    const theta = (indexInArm * 2.399) % (Math.PI * 2);
    return {
      pos: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * bulgeRadius,
        Math.cos(phi) * bulgeRadius * 0.5,
        Math.sin(phi) * Math.sin(theta) * bulgeRadius
      ),
      normal: new THREE.Vector3(0, 1, 0)
    };
  }

  const pos = new THREE.Vector3(x, y, z);
  const normal = new THREE.Vector3(0, 1, 0);

  return { pos, normal };
};

const shapes: ShapeGenerator[] = [
  generateSphere,
  generateCube,
  generateTorus,
  generateHeart,
  generateStar,
  generateDNAHelix,
  generateWave,
  generateGalaxy,
];

// ============================================================================
// COMPONENT
// ============================================================================

interface MorphingParticlesProps extends MorphingParticlesConfig {
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingParticles(props: MorphingParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const config = { ...defaultConfig, ...props };

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
      setTimeout(() => initScene(), 100);
      return;
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 200;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    const effectivePixelRatio = Math.min(window.devicePixelRatio, 3);
    renderer.setPixelRatio(effectivePixelRatio);
    renderer.setClearColor(0x0a0a0f, 1);
    container.appendChild(renderer.domElement);

    // Mouse controls
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let userRotationY = 0;
    let userRotationX = 0;
    let velocityY = 0;
    let velocityX = 0;
    let autoRotationPaused = false;
    let autoRotationResumeTimeout: ReturnType<typeof setTimeout> | null = null;
    const friction = 0.95;
    const sensitivity = 0.005;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
        velocityY = 0;
        velocityX = 0;
        autoRotationPaused = true;
        if (autoRotationResumeTimeout) clearTimeout(autoRotationResumeTimeout);
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        velocityY = deltaX * sensitivity;
        velocityX = deltaY * sensitivity;
        userRotationY += velocityY;
        userRotationX += velocityX;
        // No rotation limits - full 360 degree freedom
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = 'grab';
        autoRotationResumeTimeout = setTimeout(() => {
          autoRotationPaused = false;
        }, 3000);
      }
    };

    const onMouseLeave = () => {
      if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = 'grab';
        autoRotationResumeTimeout = setTimeout(() => {
          autoRotationPaused = false;
        }, 3000);
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseLeave);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    let bloomPass: UnrealBloomPass | null = null;
    if (config.enableBloom) {
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        config.bloomIntensity * 0.8,
        0.3,
        0.9
      );
      composer.addPass(bloomPass);
    }

    // Background stars
    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starTwinkleOffsets = new Float32Array(starCount);
    const starTwinkleSpeeds = new Float32Array(starCount);

    const starColorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xe8f4ff),
      new THREE.Color(0xaaddff),
      new THREE.Color(0x88bbff),
      new THREE.Color(0xffd4a3),
    ];

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 1500;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      starPositions[i * 3 + 2] = -200 - Math.random() * 600;

      const color = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;

      const sizeT = Math.pow(Math.random(), 2);
      starSizes[i] = 0.5 + sizeT * 2.5;
      starTwinkleOffsets[i] = Math.random() * Math.PI * 2;
      starTwinkleSpeeds[i] = 0.5 + Math.random() * 2;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(starTwinkleOffsets, 1));
    starGeometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(starTwinkleSpeeds, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float twinkleOffset;
        attribute float twinkleSpeed;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          float twinkle = sin(uTime * twinkleSpeed + twinkleOffset) * 0.5 + 0.5;
          float animatedSize = size * (0.6 + twinkle * 0.8);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = animatedSize * uPixelRatio * (300.0 / -mvPosition.z);
          gl_PointSize = max(1.0, gl_PointSize);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float core = smoothstep(0.8, 0.0, dist);
          float glow = smoothstep(1.0, 0.3, dist) * 0.5;
          float alpha = core + glow;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Zoom controls
    let zoomLevel = 200;
    const minZoom = 80;
    const maxZoom = 400;

    const onWheel = (e: WheelEvent) => {
      if (!config.enableZoom) return;
      e.preventDefault();
      const zoomSpeed = 0.1;
      zoomLevel += e.deltaY * zoomSpeed;
      zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel));
      camera.position.z = zoomLevel;
    };

    if (config.enableZoom) {
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    }

    // Keyboard controls
    let isPaused = false;
    let keyRotationY = 0;
    let keyRotationX = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!config.enableKeyboard) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPaused = !isPaused;
          break;
        case 'ArrowLeft': keyRotationY -= 0.1; break;
        case 'ArrowRight': keyRotationY += 0.1; break;
        case 'ArrowUp': keyRotationX -= 0.05; break;
        case 'ArrowDown': keyRotationX += 0.05; break;
        case 'r':
        case 'R':
          userRotationY = 0;
          userRotationX = 0;
          keyRotationY = 0;
          keyRotationX = 0;
          zoomLevel = 200;
          camera.position.z = zoomLevel;
          break;
      }
    };

    if (config.enableKeyboard) {
      window.addEventListener('keydown', onKeyDown);
    }

    // Get colors - use custom colors if provided and colorScheme is 'custom'
    let colors = colorSchemes[config.colorScheme];
    if (config.colorScheme === 'custom' && config.customColors) {
      colors = {
        primary: new THREE.Color(config.customColors.primary),
        secondary: new THREE.Color(config.customColors.secondary),
        accent: new THREE.Color(config.customColors.accent),
      };
    }

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(config.particleCount * 3);
    const targetPositions = new Float32Array(config.particleCount * 3);
    const startPositions = new Float32Array(config.particleCount * 3);
    const particleColors = new Float32Array(config.particleCount * 3);
    const sizes = new Float32Array(config.particleCount);

    const initialShapeIndex = config.selectedShape
      ? SHAPE_NAMES.indexOf(config.selectedShape)
      : 0;

    // Initialize particles
    for (let i = 0; i < config.particleCount; i++) {
      const data = shapes[initialShapeIndex >= 0 ? initialShapeIndex : 0](i, config.particleCount);
      const i3 = i * 3;

      positions[i3] = data.pos.x;
      positions[i3 + 1] = data.pos.y;
      positions[i3 + 2] = data.pos.z;

      targetPositions[i3] = data.pos.x;
      targetPositions[i3 + 1] = data.pos.y;
      targetPositions[i3 + 2] = data.pos.z;

      startPositions[i3] = data.pos.x;
      startPositions[i3 + 1] = data.pos.y;
      startPositions[i3 + 2] = data.pos.z;

      // Colors
      let color: THREE.Color;
      if (config.colorScheme === 'rainbow') {
        color = rainbowPalette[i % rainbowPalette.length].clone();
        const variation = (Math.random() - 0.5) * 0.2;
        color.offsetHSL(variation, 0, 0);
      } else {
        const colorMix = (data.pos.y + 80) / 160;
        color = colors.primary.clone().lerp(colors.secondary, Math.max(0, Math.min(1, colorMix)));
        if (Math.random() < 0.1) {
          color.lerp(colors.accent, 0.5);
        }
      }

      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;

      sizes[i] = config.particleSize * (0.5 + Math.random() * 0.5);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const startPositionAttr = new THREE.BufferAttribute(new Float32Array(startPositions), 3);
    const targetPositionAttr = new THREE.BufferAttribute(new Float32Array(targetPositions), 3);
    const staggerAttr = new THREE.BufferAttribute(new Float32Array(config.particleCount), 1);

    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3;
      const dist = Math.sqrt(
        targetPositions[i3] ** 2 + targetPositions[i3 + 1] ** 2 + targetPositions[i3 + 2] ** 2
      );
      staggerAttr.array[i] = dist / 150;
    }

    geometry.setAttribute('aStartPosition', startPositionAttr);
    geometry.setAttribute('aTargetPosition', targetPositionAttr);
    geometry.setAttribute('aStagger', staggerAttr);

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: renderer.getPixelRatio() },
        uTime: { value: 0 },
        uMorphProgress: { value: 1.0 },
        uEnableStagger: { value: config.enableStaggeredMorph ? 1.0 : 0.0 },
        uBreathing: { value: config.enableBreathing ? 1.0 : 0.0 },
        uBreathingSpeed: { value: config.breathingSpeed },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute vec3 aStartPosition;
        attribute vec3 aTargetPosition;
        attribute float aStagger;

        varying vec3 vColor;
        varying float vRandom;

        uniform float pixelRatio;
        uniform float uTime;
        uniform float uMorphProgress;
        uniform float uEnableStagger;
        uniform float uBreathing;
        uniform float uBreathingSpeed;

        float easeInOutCubic(float t) {
          return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
        }

        void main() {
          float staggeredProgress = uMorphProgress;
          if (uEnableStagger > 0.5) {
            staggeredProgress = clamp((uMorphProgress - aStagger * 0.5) * 2.0, 0.0, 1.0);
          }
          float easedProgress = easeInOutCubic(staggeredProgress);
          vec3 morphedPosition = mix(aStartPosition, aTargetPosition, easedProgress);

          // Breathing
          if (uBreathing > 0.5) {
            float dist = length(morphedPosition);
            float breathe = 1.0 + sin(uTime * uBreathingSpeed * 2.0 + dist * 0.02) * 0.05;
            morphedPosition *= breathe;
          }

          vRandom = fract(sin(dot(aStartPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
          vColor = color;

          vec4 mvPosition = modelViewMatrix * vec4(morphedPosition, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float shimmer = 0.8 + 0.3 * sin(uTime * 1.0 + vRandom * 20.0);
          gl_PointSize = size * shimmer * pixelRatio * (350.0 / -mvPosition.z);
          gl_PointSize = max(1.5, gl_PointSize);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vRandom;
        uniform float uTime;

        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);

          float sharpCore = 1.0 - smoothstep(0.0, 0.3, dist);
          float innerRing = 1.0 - smoothstep(0.3, 0.6, dist);
          float outerGlow = 1.0 - smoothstep(0.5, 1.0, dist);

          float intensity = sharpCore * 1.2 + innerRing * 0.5 + outerGlow * 0.15;
          if (intensity < 0.02) discard;

          float twinkle = sin(uTime * 0.5 + vRandom * 15.0) * 0.5 + 0.5;
          float brightness = 0.6 + twinkle * 0.2;

          vec3 finalColor = vColor * brightness;
          float alpha = min(1.0, intensity);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Connection lines
    const lineGeometry = new THREE.BufferGeometry();
    const maxLines = 15000;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: config.lineOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    // Only add lines if enabled
    if (config.enableLines) {
      scene.add(lines);
    }

    // Animation
    let currentShapeIndex = initialShapeIndex >= 0 ? initialShapeIndex : 0;
    let morphProgress = 1;
    let lastMorphTime = 0;
    let time = 0;

    const easeInOutCubicCPU = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const updateLines = (currentTime: number, currentMorphProgress: number) => {
      const startAttr = geometry.getAttribute('aStartPosition') as THREE.BufferAttribute;
      const targetAttr = geometry.getAttribute('aTargetPosition') as THREE.BufferAttribute;
      const staggerAttrGPU = geometry.getAttribute('aStagger') as THREE.BufferAttribute;
      const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
      const linePositionAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      const lineColorAttr = lineGeometry.getAttribute('color') as THREE.BufferAttribute;

      const maxDist = config.connectionDistance;
      const maxDistSq = maxDist * maxDist;
      const sampleRate = Math.max(1, Math.floor(config.particleCount / 1200));

      const sampledPositions: THREE.Vector3[] = [];
      const sampledIndices: number[] = [];

      for (let i = 0; i < config.particleCount; i += sampleRate) {
        const i3 = i * 3;
        let staggeredProgress = currentMorphProgress;
        if (config.enableStaggeredMorph) {
          const stagger = staggerAttrGPU.array[i];
          staggeredProgress = Math.max(0, Math.min(1, (currentMorphProgress - stagger * 0.5) * 2));
        }
        const easedProgress = easeInOutCubicCPU(staggeredProgress);

        let x = startAttr.array[i3] + (targetAttr.array[i3] - startAttr.array[i3]) * easedProgress;
        let y = startAttr.array[i3 + 1] + (targetAttr.array[i3 + 1] - startAttr.array[i3 + 1]) * easedProgress;
        let z = startAttr.array[i3 + 2] + (targetAttr.array[i3 + 2] - startAttr.array[i3 + 2]) * easedProgress;

        if (config.enableBreathing) {
          const dist = Math.sqrt(x * x + y * y + z * z);
          const breathe = 1.0 + Math.sin(currentTime * config.breathingSpeed * 2.0 + dist * 0.02) * 0.05;
          x *= breathe;
          y *= breathe;
          z *= breathe;
        }

        sampledPositions.push(new THREE.Vector3(x, y, z));
        sampledIndices.push(i);
      }

      let lineIndex = 0;
      for (let i = 0; i < sampledPositions.length && lineIndex < maxLines; i++) {
        const pi = sampledPositions[i];
        for (let j = i + 1; j < sampledPositions.length && lineIndex < maxLines; j++) {
          const pj = sampledPositions[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dz = pi.z - pj.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < maxDistSq) {
            const li = lineIndex * 6;
            const origI = sampledIndices[i];
            const origJ = sampledIndices[j];

            linePositionAttr.array[li] = pi.x;
            linePositionAttr.array[li + 1] = pi.y;
            linePositionAttr.array[li + 2] = pi.z;
            linePositionAttr.array[li + 3] = pj.x;
            linePositionAttr.array[li + 4] = pj.y;
            linePositionAttr.array[li + 5] = pj.z;

            const opacity = 1 - Math.sqrt(distSq) / maxDist;
            lineColorAttr.array[li] = colorAttr.array[origI * 3] * opacity;
            lineColorAttr.array[li + 1] = colorAttr.array[origI * 3 + 1] * opacity;
            lineColorAttr.array[li + 2] = colorAttr.array[origI * 3 + 2] * opacity;
            lineColorAttr.array[li + 3] = colorAttr.array[origJ * 3] * opacity;
            lineColorAttr.array[li + 4] = colorAttr.array[origJ * 3 + 1] * opacity;
            lineColorAttr.array[li + 5] = colorAttr.array[origJ * 3 + 2] * opacity;

            lineIndex++;
          }
        }
      }

      for (let i = lineIndex * 6; i < Math.min(lineIndex * 6 + 600, maxLines * 6); i++) {
        linePositionAttr.array[i] = 0;
        lineColorAttr.array[i] = 0;
      }

      linePositionAttr.needsUpdate = true;
      lineColorAttr.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);
    };

    const animate = () => {
      time += 0.016;

      // Shape transition
      const shouldAutoCycle = config.selectedShape === null;

      if (morphProgress >= 1 && morphProgress < 1.01) {
        lastMorphTime = time;
        morphProgress = 1.01;
      }

      if (shouldAutoCycle && time - lastMorphTime > config.morphDuration && morphProgress >= 1) {
        morphProgress = 0;
        particleMaterial.uniforms.uMorphProgress.value = 0;

        const startAttr = geometry.getAttribute('aStartPosition') as THREE.BufferAttribute;
        const targetAttr = geometry.getAttribute('aTargetPosition') as THREE.BufferAttribute;
        const staggerAttrGPU = geometry.getAttribute('aStagger') as THREE.BufferAttribute;
        const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;

        currentShapeIndex = (currentShapeIndex + 1) % shapes.length;

        for (let i = 0; i < config.particleCount; i++) {
          const i3 = i * 3;

          startAttr.array[i3] = targetAttr.array[i3];
          startAttr.array[i3 + 1] = targetAttr.array[i3 + 1];
          startAttr.array[i3 + 2] = targetAttr.array[i3 + 2];

          startPositions[i3] = targetPositions[i3];
          startPositions[i3 + 1] = targetPositions[i3 + 1];
          startPositions[i3 + 2] = targetPositions[i3 + 2];

          const data = shapes[currentShapeIndex](i, config.particleCount);

          targetAttr.array[i3] = data.pos.x;
          targetAttr.array[i3 + 1] = data.pos.y;
          targetAttr.array[i3 + 2] = data.pos.z;

          targetPositions[i3] = data.pos.x;
          targetPositions[i3 + 1] = data.pos.y;
          targetPositions[i3 + 2] = data.pos.z;

          const x = startAttr.array[i3], y = startAttr.array[i3 + 1], z = startAttr.array[i3 + 2];
          if (config.staggerDirection === 'radial') {
            staggerAttrGPU.array[i] = Math.sqrt(x * x + y * y + z * z) / 150;
          } else if (config.staggerDirection === 'horizontal') {
            staggerAttrGPU.array[i] = (x + 100) / 200;
          } else if (config.staggerDirection === 'vertical') {
            staggerAttrGPU.array[i] = (y + 100) / 200;
          }

          // Update colors
          let color: THREE.Color;
          if (config.colorScheme === 'rainbow') {
            color = rainbowPalette[i % rainbowPalette.length].clone();
            color.offsetHSL((Math.random() - 0.5) * 0.2, 0, 0);
          } else {
            const colorMix = (data.pos.y + 80) / 160;
            color = colors.primary.clone().lerp(colors.secondary, Math.max(0, Math.min(1, colorMix)));
            if (Math.random() < 0.1) color.lerp(colors.accent, 0.5);
          }
          colorAttr.array[i3] = color.r;
          colorAttr.array[i3 + 1] = color.g;
          colorAttr.array[i3 + 2] = color.b;
        }

        startAttr.needsUpdate = true;
        targetAttr.needsUpdate = true;
        staggerAttrGPU.needsUpdate = true;
        colorAttr.needsUpdate = true;
      }

      if (morphProgress < 1) {
        morphProgress = Math.min(1, morphProgress + 0.004);
        particleMaterial.uniforms.uMorphProgress.value = morphProgress;
      }

      // Only update lines if enabled
      if (config.enableLines) {
        updateLines(time, morphProgress);
      }

      // Update uniforms
      particleMaterial.uniforms.uTime.value = time;
      starMaterial.uniforms.uTime.value = time;

      // Apply momentum
      if (!isDragging) {
        if (Math.abs(velocityY) > 0.0001 || Math.abs(velocityX) > 0.0001) {
          userRotationY += velocityY;
          userRotationX += velocityX;
          // No rotation limits - full 360 degree freedom
          velocityY *= friction;
          velocityX *= friction;
        }

        if (!autoRotationPaused && !isPaused && Math.abs(velocityY) < 0.001) {
          userRotationY += config.rotationSpeed * 0.01;
        }
      }

      userRotationY += keyRotationY;
      userRotationX += keyRotationX;
      keyRotationY *= 0.9;
      keyRotationX *= 0.9;
      // No rotation limits - full 360 degree freedom

      particles.rotation.y = userRotationY;
      particles.rotation.x = userRotationX;
      lines.rotation.y = particles.rotation.y;
      lines.rotation.x = particles.rotation.x;

      // Render
      if (config.enableBloom) {
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
      if (bloomPass) {
        bloomPass.resolution.set(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (autoRotationResumeTimeout) {
        clearTimeout(autoRotationResumeTimeout);
      }
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
      if (config.enableZoom) {
        renderer.domElement.removeEventListener('wheel', onWheel);
      }
      if (config.enableKeyboard) {
        window.removeEventListener('keydown', onKeyDown);
      }
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [config]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  return (
    <div
      ref={containerRef}
      className={props.className}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        ...props.style,
      }}
    />
  );
}

export default MorphingParticles;
