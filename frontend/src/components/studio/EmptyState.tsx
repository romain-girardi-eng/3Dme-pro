import { useSceneStore } from '@/stores/sceneStore';
import { PromptBar } from './PromptBar';
import { QualityLadder } from './generation/QualityLadder';
import { VariantPicker } from './generation/VariantPicker';
import { GenerationProgress } from './GenerationProgress';

const PRESETS = [
  'A crystalline jellyfish drifting through deep space',
  'Neon cyberpunk samurai in the rain',
  'Ancient ice dragon carved from obsidian',
  'Bioluminescent forest at twilight',
  'Molten lava skull with glowing eyes',
  'Origami phoenix made of gold foil',
];

export const EmptyState = () => {
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const variants = useSceneStore((s) => s.generation.variants);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);

  if (glbUrl) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-6 pointer-events-none">
      <div className="w-full max-w-2xl space-y-6 pointer-events-auto">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-white">Create a 3D scene</h1>
          <p className="text-sm text-white/50">Start with a prompt or drop an image.</p>
        </header>
        <PromptBar />
        <GenerationProgress />
        <QualityLadder />
        {variants.length > 0 && <VariantPicker />}
        {variants.length === 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-white/70 hover:border-border hover:text-white transition-colors duration-fast"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
