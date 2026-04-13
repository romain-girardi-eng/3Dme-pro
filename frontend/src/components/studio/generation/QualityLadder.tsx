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
    <div className="flex flex-col gap-1">
      {TIERS.map((t) => {
        const active = tier === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTier(t.id)}
            className={cn(
              'group flex items-center justify-between gap-2 rounded-sm border px-2.5 py-2 text-left transition-colors duration-fast',
              active
                ? 'border-brand-primary/60 bg-brand-primary/10'
                : 'border-border-subtle bg-surface-2 hover:border-border'
            )}
          >
            <div className="flex min-w-0 flex-col">
              <span className={cn('text-xs font-semibold', active ? 'text-white' : 'text-white/85')}>{t.label}</span>
              <span className="text-2xs text-white/45 truncate">{t.model} · ~{t.eta}</span>
            </div>
            <span className={cn('shrink-0 text-2xs font-mono tabular-nums', active ? 'text-brand-secondary' : 'text-white/55')}>
              ${t.cost.toFixed(3)}
            </span>
          </button>
        );
      })}
    </div>
  );
};
