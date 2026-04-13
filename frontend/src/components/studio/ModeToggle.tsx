import { Sparkles, Box, Droplet } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { Tooltip } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { RenderMode } from '@/stores/sceneStore.types';

interface ModeMeta {
  id: RenderMode;
  label: string;
  icon: typeof Sparkles;
  availableWhen: (state: { glb: boolean; splat: boolean }) => boolean;
  disabledHint: string;
}

const MODES: ModeMeta[] = [
  {
    id: 'particles',
    label: 'Particles',
    icon: Sparkles,
    availableWhen: () => true,
    disabledHint: '',
  },
  {
    id: 'mesh',
    label: 'Mesh',
    icon: Box,
    availableWhen: ({ glb }) => glb,
    disabledHint: 'Generate or upload a 3D model first',
  },
  {
    id: 'splat',
    label: 'Splat',
    icon: Droplet,
    availableWhen: ({ splat }) => splat,
    disabledHint: 'No splat available for this scene',
  },
];

export const ModeToggle = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const setMode = useSceneStore((s) => s.setMode);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);
  const splatUrl = useSceneStore((s) => s.generation.splatUrl);
  const available = { glb: Boolean(glbUrl), splat: Boolean(splatUrl) };

  useKeyboardShortcut('m', () => {
    const enabled = MODES.filter((m) => m.availableWhen(available));
    const idx = enabled.findIndex((m) => m.id === mode);
    const next = enabled[(idx + 1) % enabled.length];
    if (next) setMode(next.id);
  });

  return (
    <div className="flex items-center gap-0.5 rounded-sm border border-border-subtle bg-surface-2 p-0.5">
      {MODES.map((m) => {
        const enabled = m.availableWhen(available);
        const active = mode === m.id;
        const Icon = m.icon;
        const button = (
          <button
            type="button"
            onClick={() => enabled && setMode(m.id)}
            disabled={!enabled}
            aria-pressed={active}
            className={cn(
              'flex h-6 items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium transition-colors duration-fast',
              active
                ? 'bg-surface-0 text-white'
                : enabled
                  ? 'text-white/60 hover:text-white/90'
                  : 'cursor-not-allowed text-white/25',
            )}
          >
            <Icon className="h-3 w-3" />
            {m.label}
          </button>
        );
        return !enabled && m.disabledHint ? (
          <Tooltip key={m.id} content={m.disabledHint}>
            <span>{button}</span>
          </Tooltip>
        ) : (
          <span key={m.id}>{button}</span>
        );
      })}
    </div>
  );
};
