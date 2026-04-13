import type { ReactNode } from 'react';
import { Loader2, Check, Image as ImageIcon, Box, Wand2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { cn } from '@/lib/cn';

type StepState = 'pending' | 'active' | 'done';
interface Step {
  id: string;
  label: string;
  icon: ReactNode;
  state: StepState;
}

export const GenerationProgress = () => {
  const status = useSceneStore((s) => s.generation.status);
  const variants = useSceneStore((s) => s.generation.variants);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);

  if (status === 'idle' && variants.length === 0) return null;

  const steps: Step[] = [
    {
      id: 'enhance',
      label: 'Enhance prompt',
      icon: <Wand2 className="h-3.5 w-3.5" />,
      state:
        status === 'enhancing'
          ? 'active'
          : variants.length > 0 || status === 'generating-image'
            ? 'done'
            : 'pending',
    },
    {
      id: 'image',
      label: 'Generate image',
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      state: status === 'generating-image' ? 'active' : variants.length > 0 ? 'done' : 'pending',
    },
    {
      id: '3d',
      label: 'Build 3D',
      icon: <Box className="h-3.5 w-3.5" />,
      state: status === 'generating-3d' ? 'active' : glbUrl ? 'done' : 'pending',
    },
  ];

  return (
    <div className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-1 px-4 py-2">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border',
              s.state === 'active' && 'border-brand-primary text-brand-primary',
              s.state === 'done' && 'border-signal-success text-signal-success',
              s.state === 'pending' && 'border-border-subtle text-white/30'
            )}
          >
            {s.state === 'active' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : s.state === 'done' ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              s.icon
            )}
          </div>
          <span className={cn('text-xs', s.state === 'pending' ? 'text-white/30' : 'text-white/80')}>
            {s.label}
          </span>
          {idx < steps.length - 1 && <span className="h-px w-4 bg-border" />}
        </div>
      ))}
    </div>
  );
};
