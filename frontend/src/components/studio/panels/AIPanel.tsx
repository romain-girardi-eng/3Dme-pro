import { useSceneStore } from '@/stores/sceneStore';
import { QualityLadder } from '../generation/QualityLadder';
import { VariantPicker } from '../generation/VariantPicker';

export const AIPanel = () => {
  const enhanced = useSceneStore((s) => s.generation.enhancedPrompt);
  const cost = useSceneStore((s) => s.generation.costUsd);
  const variants = useSceneStore((s) => s.generation.variants);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-2xs uppercase tracking-wider text-white/40">quality tier</span>
        <QualityLadder />
      </div>
      {enhanced && (
        <div className="space-y-1">
          <span className="text-2xs uppercase tracking-wider text-white/40">enhanced prompt</span>
          <p className="text-xs text-white/60 leading-relaxed">{enhanced}</p>
        </div>
      )}
      {variants.length > 0 && (
        <div className="space-y-2">
          <span className="text-2xs uppercase tracking-wider text-white/40">variants</span>
          <VariantPicker />
        </div>
      )}
      <div className="flex items-center justify-between text-2xs text-white/50">
        <span>Session cost</span>
        <span className="font-mono tabular-nums text-white/80">${cost.toFixed(3)}</span>
      </div>
    </div>
  );
};
