/**
 * GLBMeshViewer.tsx
 *
 * 3D mesh viewer for GLB files with ANIMATION SUPPORT.
 * Supports embedded animations via Three.js AnimationMixer.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface AnimationClipInfo {
  name: string;
  duration: number;
}

export interface GLBMeshViewerProps {
  glbUrl: string;
  backgroundColor?: string;
  onAnimationsLoaded?: (animations: AnimationClipInfo[]) => void;
  autoPlayAnimation?: boolean;
  selectedAnimation?: string;
  animationSpeed?: number;
  isPlaying?: boolean;
}

export interface GLBMeshViewerRef {
  playAnimation: (name: string) => void;
  pauseAnimation: () => void;
  stopAnimation: () => void;
  setAnimationTime: (time: number) => void;
  getAnimationTime: () => number;
  getAnimationDuration: () => number;
}

export const GLBMeshViewer = forwardRef<GLBMeshViewerRef, GLBMeshViewerProps>(({
  glbUrl,
  backgroundColor = '#0a0a0f',
  onAnimationsLoaded,
  autoPlayAnimation = true,
  selectedAnimation,
  animationSpeed = 1,
  isPlaying = true,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Expose animation controls via ref
  useImperativeHandle(ref, () => ({
    playAnimation: (name: string) => {
      const action = actionsRef.current.get(name);
      if (action && mixerRef.current) {
        // Fade out current, fade in new
        if (currentActionRef.current && currentActionRef.current !== action) {
          currentActionRef.current.fadeOut(0.3);
        }
        action.reset().fadeIn(0.3).play();
        currentActionRef.current = action;
      }
    },
    pauseAnimation: () => {
      if (currentActionRef.current) {
        currentActionRef.current.paused = true;
      }
    },
    stopAnimation: () => {
      if (currentActionRef.current) {
        currentActionRef.current.stop();
      }
    },
    setAnimationTime: (time: number) => {
      if (mixerRef.current) {
        mixerRef.current.setTime(time);
      }
    },
    getAnimationTime: () => {
      if (currentActionRef.current) {
        return currentActionRef.current.time;
      }
      return 0;
    },
    getAnimationDuration: () => {
      if (currentActionRef.current) {
        return currentActionRef.current.getClip().duration;
      }
      return 0;
    },
  }));

  useEffect(() => {
    if (!containerRef.current || !glbUrl) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clean up existing renderer
    if (rendererRef.current) {
      rendererRef.current.forceContextLoss();
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    // Reset animation state
    mixerRef.current = null;
    actionsRef.current.clear();
    currentActionRef.current = null;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 100;
    controls.target.set(0, 0.5, 0); // Look at chest height for characters

    // Lighting for characters
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 10, 7);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    // Rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x9966ff, 0.4);
    rimLight.position.set(0, 2, -5);
    scene.add(rimLight);

    // Load GLB with animations
    const loader = new GLTFLoader();
    loader.load(
      glbUrl,
      (gltf) => {
        const model = gltf.scene;

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;

        model.position.x = -center.x * scale;
        model.position.y = -box.min.y * scale; // Stand on ground
        model.position.z = -center.z * scale;
        model.scale.setScalar(scale);

        // Enable shadows
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);

        // Setup animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          // Create actions for all animations
          const animationInfos: AnimationClipInfo[] = [];
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actionsRef.current.set(clip.name, action);
            animationInfos.push({
              name: clip.name,
              duration: clip.duration,
            });
          });

          // Report animations to parent
          onAnimationsLoaded?.(animationInfos);

          // Auto-play first animation
          if (autoPlayAnimation && gltf.animations.length > 0) {
            const firstClip = selectedAnimation || gltf.animations[0].name;
            const action = actionsRef.current.get(firstClip);
            if (action) {
              action.play();
              currentActionRef.current = action;
            }
          }
        } else {
          onAnimationsLoaded?.([]);
        }

        // Position camera
        camera.position.set(0, 1, 3);
        controls.update();
      },
      undefined,
      (error) => {
        console.error('Error loading GLB:', error);
      }
    );

    // Animation loop with mixer update
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();

      // Update animation mixer
      if (mixerRef.current && isPlaying) {
        mixerRef.current.update(delta * animationSpeed);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      controls.dispose();
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();
      renderer.dispose();
      rendererRef.current = null;
      mixerRef.current = null;
      actionsRef.current.clear();
    };
  }, [glbUrl, backgroundColor, autoPlayAnimation, onAnimationsLoaded]);

  // Handle animation speed changes
  useEffect(() => {
    if (currentActionRef.current) {
      currentActionRef.current.timeScale = animationSpeed;
    }
  }, [animationSpeed]);

  // Handle play/pause
  useEffect(() => {
    if (currentActionRef.current) {
      currentActionRef.current.paused = !isPlaying;
    }
  }, [isPlaying]);

  // Handle animation selection changes
  useEffect(() => {
    if (selectedAnimation && actionsRef.current.has(selectedAnimation)) {
      const action = actionsRef.current.get(selectedAnimation)!;
      if (currentActionRef.current && currentActionRef.current !== action) {
        currentActionRef.current.fadeOut(0.3);
      }
      action.reset().fadeIn(0.3).play();
      currentActionRef.current = action;
    }
  }, [selectedAnimation]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
});

GLBMeshViewer.displayName = 'GLBMeshViewer';
