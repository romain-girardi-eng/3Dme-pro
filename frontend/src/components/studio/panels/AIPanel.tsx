import { useSceneStore } from '@/stores/sceneStore';
import { PromptBar } from '../PromptBar';
import { QualityLadder } from '../generation/QualityLadder';
import { VariantPicker } from '../generation/VariantPicker';
import { GenerationProgress } from '../GenerationProgress';

const PRESETS = [
  'Crystal jellyfish in deep space',
  'Neon cyberpunk samurai',
  'Obsidian ice dragon',
  'Bioluminescent forest',
  'Lava skull, glowing eyes',
  'Origami gold phoenix',
];

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="space-y-1.5">
    <h3 className="text-2xs uppercase tracking-[0.18em] text-white/40 font-medium">{label}</h3>
    {children}
  </section>
);

export const AIPanel = () => {
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const enhanced = useSceneStore((s) => s.generation.enhancedPrompt);
  const cost = useSceneStore((s) => s.generation.costUsd);
  const status = useSceneStore((s) => s.generation.status);
  const variants = useSceneStore((s) => s.generation.variants);
  const error = useSceneStore((s) => s.generation.error);

  const showProgress = status !== 'idle' || variants.length > 0;

  return (
    <div className="space-y-5">
      <Section label="Prompt">
        <PromptBar size="sm" />
      </Section>

      <Section label="Presets">
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              className="rounded-full border border-border-subtle bg-surface-2 px-2.5 py-1 text-2xs text-white/65 hover:border-border hover:text-white transition-colors duration-fast"
            >
              {p}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Quality tier">
        <QualityLadder />
      </Section>

      {showProgress && (
        <Section label="Progress">
          <GenerationProgress />
        </Section>
      )}

      {enhanced && (
        <Section label="Enhanced prompt">
          <p className="text-xs leading-relaxed text-white/60 rounded-sm border border-border-subtle bg-surface-2/60 p-2">
            {enhanced}
          </p>
        </Section>
      )}

      {variants.length > 0 && (
        <Section label="Variants">
          <VariantPicker />
        </Section>
      )}

      {error && (
        <div className="rounded-sm border border-signal-danger/30 bg-signal-danger/10 p-2 text-2xs text-signal-danger">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-2xs text-white/45">
        <span className="uppercase tracking-wider">Session cost</span>
        <span className="font-mono tabular-nums text-white/80">${cost.toFixed(3)}</span>
      </div>
    </div>
  );
};
