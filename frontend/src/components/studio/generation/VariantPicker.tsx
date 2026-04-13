import { Check } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';

export const VariantPicker = () => {
  const variants = useSceneStore((s) => s.generation.variants);
  const selectedIdx = useSceneStore((s) => s.generation.selectedVariantIdx);
  const selectVariant = useSceneStore((s) => s.selectVariant);
  const { runThreeDStage } = useGenerationFlow();

  if (variants.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {variants.map((v, idx) => {
          const active = selectedIdx === idx;
          return (
            <button
              key={`${v.seed}-${idx}`}
              type="button"
              onClick={() => selectVariant(idx)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-md border transition-all duration-fast',
                active ? 'border-brand-primary ring-2 ring-brand-primary/40' : 'border-border-subtle hover:border-border'
              )}
            >
              <img src={v.url} alt={`variant ${idx + 1}`} className="h-full w-full object-cover" />
              {active && (
                <span className="absolute top-1.5 right-1.5 rounded-full bg-brand-primary p-1 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Button
        variant="primary"
        size="md"
        onClick={() => void runThreeDStage()}
        disabled={selectedIdx === null}
        className="w-full"
      >
        Convert to 3D
      </Button>
    </div>
  );
};
