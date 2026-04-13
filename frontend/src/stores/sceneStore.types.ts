export type RenderMode = 'particles' | 'mesh' | 'splat';
export type QualityTier = 'fast' | 'balanced' | 'pro';
export type ImageModel = 'flux-2-turbo' | 'flux-2-pro' | 'flux-2-dev';
export type LoraStyle =
  | 'none'
  | 'cyberpunk'
  | 'claymation'
  | 'ink-wash'
  | 'vaporwave'
  | 'studio-photo';

export type AnimationMode =
  | 'none'
  | 'float'
  | 'wave'
  | 'vortex'
  | 'turbulence'
  | 'magnetic'
  | 'lorenz'
  | 'aizawa';

export type ColorMode =
  | 'original'
  | 'rainbow'
  | 'ocean'
  | 'sunset'
  | 'neon'
  | 'fire'
  | 'matrix'
  | 'velocity'
  | 'custom';

export type MouseMode = 'repel' | 'attract' | 'orbit' | 'vortex';
export type Quality = 'low' | 'medium' | 'high';
export type FallbackShape =
  | 'galaxy'
  | 'nebula'
  | 'sphere'
  | 'cube'
  | 'torus'
  | 'heart'
  | 'star'
  | 'dna'
  | 'wave'
  | 'butterfly'
  | 'aurora'
  | 'skull'
  | 'phoenix'
  | 'rose';

export interface GenerationState {
  prompt: string;
  enhancedPrompt: string | null;
  enhancerEnabled: boolean;
  imageModel: ImageModel;
  tier: QualityTier;
  loraStyle: LoraStyle;
  variants: Array<{ url: string; seed: number }>;
  selectedVariantIdx: number | null;
  glbUrl: string | null;
  splatUrl: string | null;
  status: 'idle' | 'enhancing' | 'generating-image' | 'generating-3d' | 'ready' | 'error';
  error: string | null;
  costUsd: number;
}

export interface LookConfig {
  quality: Quality;        // low=512, medium=1024, high=2048 (texture size)
  fallbackShape: FallbackShape; // used when no generated mesh is loaded
  particleSize: number;    // 0.5–6
  colorMode: ColorMode;
  brightness: number;      // 0–2
  saturation: number;      // 0–2
  hueShift: number;        // -180–180
  shimmer: number;         // 0–1
  bloom: number;           // 0–2
  trails: number;          // 0–1
  customColor: string;
}

export interface MotionConfig {
  mode: AnimationMode;
  speed: number;           // 0–3
  turbulence: number;      // 0–1
  shapeMemory: number;     // 0–1 — how strongly particles snap back to source shape (returnForce)
  rotationSpeed: number;   // 0–2
}

export interface MouseConfig {
  enabled: boolean;
  force: number;           // 0–2 (user-chosen base)
  radius: number;          // 0–3
  mode: MouseMode;
  handTracking: boolean;   // use webcam hand landmarks instead of mouse
  handPinch: number;       // runtime 0–1 from hand tracking hook (not persisted-idle)
}

export interface AudioLevels {
  bass: number;
  mid: number;
  treble: number;
}

export interface AudioConfig {
  enabled: boolean;
  source: 'mic' | 'file' | 'demo';
  sensitivity: number;
}

export interface SceneConfig {
  mode: RenderMode;
  look: LookConfig;
  motion: MotionConfig;
  mouse: MouseConfig;
  audio: AudioConfig;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  thumbnailUrl: string | null;
  glbUrl: string | null;
  splatUrl: string | null;
  tier: QualityTier;
  source: 'generated' | 'uploaded';
  createdAt: number;
}

export interface SceneState {
  generation: GenerationState;
  scene: SceneConfig;
  audioLevels: AudioLevels;
  history: HistoryItem[];
}

export interface SceneActions {
  setPrompt: (prompt: string) => void;
  setEnhancedPrompt: (prompt: string | null) => void;
  toggleEnhancer: () => void;
  setImageModel: (m: ImageModel) => void;
  setTier: (t: QualityTier) => void;
  setLoraStyle: (s: LoraStyle) => void;
  setVariants: (v: GenerationState['variants']) => void;
  selectVariant: (idx: number | null) => void;
  setAssets: (p: { glbUrl?: string | null; splatUrl?: string | null }) => void;
  setStatus: (s: GenerationState['status'], error?: string | null) => void;
  setCost: (usd: number) => void;
  setMode: (mode: RenderMode) => void;
  updateLook: (patch: Partial<LookConfig>) => void;
  updateMotion: (patch: Partial<MotionConfig>) => void;
  updateMouse: (patch: Partial<MouseConfig>) => void;
  updateAudio: (patch: Partial<AudioConfig>) => void;
  setAudioLevels: (levels: AudioLevels) => void;
  pushHistory: (item: HistoryItem) => void;
  loadHistoryItem: (id: string) => void;
  removeHistoryItem: (id: string) => void;
  resetScene: () => void;
  hydrateFromHash: (hash: string) => boolean;
  toHash: () => string;
}
