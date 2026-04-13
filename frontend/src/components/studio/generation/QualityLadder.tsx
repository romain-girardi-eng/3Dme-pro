import { useSceneStore } from '@/stores/sceneStore';
import { cn } from '@/lib/cn';

interface TierMeta {
  id: 'fast' | 'balanced' | 'pro';
  label: string;
  model: string;
  eta: string;
  cost: number;
  blurb: string;
}

const TIERS: TierMeta[] = [
  { id: 'fast', label: 'Fast', model: 'Trellis', eta: '5s', cost: 0.02, blurb: 'Quickest 3D path' },
  { id: 'balanced', label: 'Balanced', model: 'Hunyuan3D v2', eta: '15s', cost: 0.16, blurb: 'Higher quality mesh' },
  { id: 'pro', label: 'Pro', model: 'Rodin Gen-2', eta: '30s', cost: 0.4, blurb: 'Production PBR mesh' },
];

export const QualityLadder = () => {
  const tier = useSceneStore((s) => s.generation.tier);
  const setTier = useSceneStore((s) => s.setTier);

  return (
    <div className="grid grid-cols-3 gap-2">
      {TIERS.map((t) => {
        const active = tier === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTier(t.id)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors duration-fast',
              active
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-border-subtle bg-surface-2 hover:border-border'
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold text-white">{t.label}</span>
              <span className="text-2xs font-mono tabular-nums text-white/60">${t.cost.toFixed(3)}</span>
            </div>
            <span className="text-2xs text-white/50">{t.model}</span>
            <span className="text-2xs text-white/40">~{t.eta}</span>
          </button>
        );
      })}
    </div>
  );
};
