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
    <div className="flex w-full flex-col gap-1.5 rounded-md border border-border-subtle bg-surface-1 px-3 py-2.5">
      {steps.map((s) => (
        <div key={s.id} className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
              s.state === 'active' && 'border-brand-primary text-brand-primary',
              s.state === 'done' && 'border-signal-success text-signal-success',
              s.state === 'pending' && 'border-border-subtle text-white/30',
            )}
          >
            {s.state === 'active' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : s.state === 'done' ? (
              <Check className="h-3 w-3" />
            ) : (
              s.icon
            )}
          </div>
          <span
            className={cn(
              'text-xs truncate',
              s.state === 'pending' ? 'text-white/30' : s.state === 'active' ? 'text-brand-primary' : 'text-white/70',
            )}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};
