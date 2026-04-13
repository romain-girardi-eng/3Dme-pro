export type RenderMode = 'splat' | 'particles';
export type QualityTier = 'fast' | 'balanced' | 'pro';
export type ImageModel = 'flux-2-turbo' | 'flux-2-pro' | 'flux-2-dev';
export type LoraStyle =
  | 'none'
  | 'cyberpunk'
  | 'claymation'
  | 'ink-wash'
  | 'vaporwave'
  | 'studio-photo';

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

export interface ParticleConfig {
  count: number;
  size: number;
  shape: 'sphere' | 'galaxy' | 'star' | 'mesh';
  colorMode: 'image' | 'gradient' | 'solid';
  solidColor: string;
}

export interface MaterialConfig {
  exposure: number;
  splatScale: number;
  opacityCutoff: number;
  emissive: number;
  fresnel: number;
  brightness: number;
  saturation: number;
  hueShift: number;
  rotationSpeed: number;
}

export interface PhysicsConfig {
  mouseGravity: number;
  mouseRadius: number;
  turbulence: number;
  attractor: 'none' | 'lorenz' | 'aizawa' | 'chen';
}

export interface PostConfig {
  bloom: number;
  dof: boolean;
  chromaticAberration: number;
  vignette: number;
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
  bassToColor: boolean;
  midToTurbulence: boolean;
  trebleToBurst: boolean;
}

export interface SceneConfig {
  mode: RenderMode;
  particles: ParticleConfig;
  material: MaterialConfig;
  physics: PhysicsConfig;
  post: PostConfig;
  audio: AudioConfig;
}

export interface SceneState {
  generation: GenerationState;
  scene: SceneConfig;
  audioLevels: AudioLevels;
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
  updateParticles: (patch: Partial<ParticleConfig>) => void;
  updateMaterial: (patch: Partial<MaterialConfig>) => void;
  updatePhysics: (patch: Partial<PhysicsConfig>) => void;
  updatePost: (patch: Partial<PostConfig>) => void;
  updateAudio: (patch: Partial<AudioConfig>) => void;
  setAudioLevels: (levels: AudioLevels) => void;
  resetScene: () => void;
  hydrateFromHash: (hash: string) => boolean;
  toHash: () => string;
}
