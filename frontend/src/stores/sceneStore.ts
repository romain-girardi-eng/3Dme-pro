import { create } from 'zustand';
import { temporal } from 'zundo';
import type { SceneState, SceneActions } from './sceneStore.types';
import { encodeState, decodeState } from '@/lib/urlHash';

export const DEFAULT_SCENE_STATE: SceneState = {
  generation: {
    prompt: '',
    enhancedPrompt: null,
    enhancerEnabled: true,
    imageModel: 'flux-2-turbo',
    tier: 'fast',
    loraStyle: 'none',
    variants: [],
    selectedVariantIdx: null,
    glbUrl: null,
    splatUrl: null,
    status: 'idle',
    error: null,
    costUsd: 0,
  },
  scene: {
    mode: 'particles',
    particles: {
      count: 500000,
      size: 2,
      shape: 'mesh',
      colorMode: 'image',
      solidColor: '#8b5cf6',
    },
    material: {
      exposure: 1,
      splatScale: 1,
      opacityCutoff: 0.02,
      emissive: 0,
      fresnel: 0.3,
      brightness: 1,
      saturation: 1,
      hueShift: 0,
      rotationSpeed: 0.2,
    },
    physics: {
      mouseGravity: 0.5,
      mouseRadius: 1.5,
      turbulence: 0.2,
      attractor: 'none',
    },
    post: {
      bloom: 0.4,
      dof: false,
      chromaticAberration: 0.02,
      vignette: 0.25,
    },
    audio: {
      enabled: false,
      source: 'mic',
      sensitivity: 0.5,
      bassToColor: true,
      midToTurbulence: true,
      trebleToBurst: false,
    },
  },
  audioLevels: { bass: 0, mid: 0, treble: 0 },
};

export const useSceneStore = create<SceneState & SceneActions>()(
  temporal((set, get) => ({
    ...DEFAULT_SCENE_STATE,

    setPrompt: (prompt) =>
      set((s) => ({ generation: { ...s.generation, prompt } })),
    setEnhancedPrompt: (enhancedPrompt) =>
      set((s) => ({ generation: { ...s.generation, enhancedPrompt } })),
    toggleEnhancer: () =>
      set((s) => ({
        generation: { ...s.generation, enhancerEnabled: !s.generation.enhancerEnabled },
      })),
    setImageModel: (imageModel) =>
      set((s) => ({ generation: { ...s.generation, imageModel } })),
    setTier: (tier) =>
      set((s) => ({ generation: { ...s.generation, tier } })),
    setLoraStyle: (loraStyle) =>
      set((s) => ({ generation: { ...s.generation, loraStyle } })),
    setVariants: (variants) =>
      set((s) => ({ generation: { ...s.generation, variants } })),
    selectVariant: (selectedVariantIdx) =>
      set((s) => ({ generation: { ...s.generation, selectedVariantIdx } })),
    setAssets: ({ glbUrl, splatUrl }) =>
      set((s) => ({
        generation: {
          ...s.generation,
          glbUrl: glbUrl ?? s.generation.glbUrl,
          splatUrl: splatUrl ?? s.generation.splatUrl,
        },
      })),
    setStatus: (status, error = null) =>
      set((s) => ({ generation: { ...s.generation, status, error } })),
    setCost: (costUsd) =>
      set((s) => ({ generation: { ...s.generation, costUsd } })),

    setMode: (mode) =>
      set((s) => ({ scene: { ...s.scene, mode } })),
    updateParticles: (patch) =>
      set((s) => ({ scene: { ...s.scene, particles: { ...s.scene.particles, ...patch } } })),
    updateMaterial: (patch) =>
      set((s) => ({ scene: { ...s.scene, material: { ...s.scene.material, ...patch } } })),
    updatePhysics: (patch) =>
      set((s) => ({ scene: { ...s.scene, physics: { ...s.scene.physics, ...patch } } })),
    updatePost: (patch) =>
      set((s) => ({ scene: { ...s.scene, post: { ...s.scene.post, ...patch } } })),
    updateAudio: (patch) =>
      set((s) => ({ scene: { ...s.scene, audio: { ...s.scene.audio, ...patch } } })),
    setAudioLevels: (audioLevels) => set({ audioLevels }),

    resetScene: () => set(DEFAULT_SCENE_STATE),

    toHash: () => {
      const { generation, scene } = get();
      return encodeState({ generation, scene });
    },
    hydrateFromHash: (hash) => {
      const decoded = decodeState<Pick<SceneState, 'generation' | 'scene'>>(hash);
      if (!decoded || !decoded.generation || !decoded.scene) return false;
      set({ generation: decoded.generation, scene: decoded.scene });
      return true;
    },
  }))
);
