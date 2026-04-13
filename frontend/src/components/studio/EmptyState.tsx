import { useSceneStore } from '@/stores/sceneStore';
import { PromptBar } from './PromptBar';
import { GenerationProgress } from './GenerationProgress';

const PRESETS = [
  'Crystal jellyfish in deep space',
  'Neon cyberpunk samurai',
  'Obsidian ice dragon',
  'Bioluminescent forest',
  'Lava skull, glowing eyes',
  'Origami gold phoenix',
];

export const EmptyState = () => {
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);
  const variants = useSceneStore((s) => s.generation.variants);
  const status = useSceneStore((s) => s.generation.status);

  if (glbUrl) return null;

  const showProgress = status !== 'idle' || variants.length > 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
      <div className="pointer-events-auto w-full max-w-xl space-y-5">
        <header className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Create a 3D scene</h1>
          <p className="text-xs text-white/50">Type a prompt, drop an image, or pick a preset.</p>
        </header>
        <PromptBar size="lg" />
        {showProgress && (
          <div className="flex justify-center">
            <GenerationProgress />
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              className="rounded-full border border-border-subtle bg-surface-1/80 backdrop-blur-sm px-3 py-1 text-xs text-white/70 hover:border-border hover:bg-surface-2 hover:text-white transition-colors duration-fast"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
