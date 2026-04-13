import { create } from 'zustand';
import { temporal } from 'zundo';
import type { SceneState, SceneActions, HistoryItem } from './sceneStore.types';
import { encodeState, decodeState } from '@/lib/urlHash';

const HISTORY_KEY = '3dme:history:v1';
const HISTORY_MAX = 20;

const loadHistory = (): HistoryItem[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryItem[]).slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
};

const saveHistory = (items: HistoryItem[]): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_MAX)));
  } catch {
    /* quota exceeded — skip */
  }
};

export const DEFAULT_SCENE_STATE: SceneState = {
  generation: {
    prompt: '',
    enhancedPrompt: null,
    enhancerEnabled: false,
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
    look: {
      quality: 'medium',
      fallbackShape: 'galaxy',
      particleSize: 1.4,
      colorMode: 'original',
      brightness: 0.85,
      saturation: 1,
      hueShift: 0,
      shimmer: 0,
      bloom: 0.15,
      trails: 0,
      customColor: '#8b5cf6',
    },
    motion: {
      mode: 'float',
      speed: 0.5,
      turbulence: 0.1,
      shapeMemory: 0.8,
      rotationSpeed: 0.15,
    },
    mouse: {
      enabled: true,
      force: 0.15,
      radius: 14,
      mode: 'repel',
      handTracking: false,
      handPinch: 0,
    },
    audio: {
      enabled: false,
      source: 'mic',
      sensitivity: 0.5,
    },
  },
  audioLevels: { bass: 0, mid: 0, treble: 0 },
  history: [],
};

export const useSceneStore = create<SceneState & SceneActions>()(
  temporal((set, get) => ({
    ...DEFAULT_SCENE_STATE,
    history: loadHistory(),

    setPrompt: (prompt) => set((s) => ({ generation: { ...s.generation, prompt } })),
    setEnhancedPrompt: (enhancedPrompt) =>
      set((s) => ({ generation: { ...s.generation, enhancedPrompt } })),
    toggleEnhancer: () =>
      set((s) => ({
        generation: { ...s.generation, enhancerEnabled: !s.generation.enhancerEnabled },
      })),
    setImageModel: (imageModel) =>
      set((s) => ({ generation: { ...s.generation, imageModel } })),
    setTier: (tier) => set((s) => ({ generation: { ...s.generation, tier } })),
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
    setCost: (costUsd) => set((s) => ({ generation: { ...s.generation, costUsd } })),

    setMode: (mode) => set((s) => ({ scene: { ...s.scene, mode } })),
    updateLook: (patch) =>
      set((s) => ({ scene: { ...s.scene, look: { ...s.scene.look, ...patch } } })),
    updateMotion: (patch) =>
      set((s) => ({ scene: { ...s.scene, motion: { ...s.scene.motion, ...patch } } })),
    updateMouse: (patch) =>
      set((s) => ({ scene: { ...s.scene, mouse: { ...s.scene.mouse, ...patch } } })),
    updateAudio: (patch) =>
      set((s) => ({ scene: { ...s.scene, audio: { ...s.scene.audio, ...patch } } })),
    setAudioLevels: (audioLevels) => set({ audioLevels }),

    pushHistory: (item) => {
      const next = [item, ...get().history.filter((h) => h.id !== item.id)].slice(0, HISTORY_MAX);
      saveHistory(next);
      set({ history: next });
    },
    loadHistoryItem: (id) => {
      const item = get().history.find((h) => h.id === id);
      if (!item) return;
      set((s) => ({
        generation: {
          ...s.generation,
          prompt: item.prompt,
          tier: item.tier,
          glbUrl: item.glbUrl,
          splatUrl: item.splatUrl,
          variants: item.thumbnailUrl ? [{ url: item.thumbnailUrl, seed: 0 }] : [],
          selectedVariantIdx: item.thumbnailUrl ? 0 : null,
          status: item.glbUrl ? 'ready' : 'idle',
          error: null,
        },
      }));
    },
    removeHistoryItem: (id) => {
      const next = get().history.filter((h) => h.id !== id);
      saveHistory(next);
      set({ history: next });
    },

    resetScene: () => set({ ...DEFAULT_SCENE_STATE, history: get().history }),

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
  })),
);
