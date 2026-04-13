import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Preset } from '@/lib/presets';
import { useSceneStore } from '@/stores/sceneStore';
import { cn } from '@/lib/cn';

export const PresetCard = ({ preset }: { preset: Preset }) => {
  const navigate = useNavigate();
  const setPrompt = useSceneStore((s) => s.setPrompt);
  const setTier = useSceneStore((s) => s.setTier);
  const toHash = useSceneStore((s) => s.toHash);

  const use = () => {
    setPrompt(preset.prompt);
    setTier(preset.tier);
    navigate(`/studio#${toHash()}`);
  };

  return (
    <button
      type="button"
      onClick={use}
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-md border border-border-subtle text-left transition-transform duration-fast hover:-translate-y-0.5',
        'bg-gradient-to-br',
        preset.gradient
      )}
    >
      <div className="absolute inset-0 bg-surface-0/50 backdrop-blur-sm" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="text-2xs uppercase tracking-wider text-white/60">{preset.tag}</span>
          <span className="text-2xs font-mono uppercase text-brand-secondary">{preset.tier}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">{preset.title}</h3>
          <p className="text-2xs line-clamp-2 text-white/60">{preset.prompt}</p>
          <div className="mt-2 flex items-center gap-1.5 text-2xs text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
            Open in Studio <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </button>
  );
};
