import { Sparkles, Droplet } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn } from '@/lib/cn';

export const ModeToggle = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const setMode = useSceneStore((s) => s.setMode);

  useKeyboardShortcut('m', () => setMode(mode === 'splat' ? 'particles' : 'splat'));

  return (
    <div className="flex items-center gap-0.5 rounded-sm bg-surface-2 p-0.5 border border-border-subtle">
      <button
        type="button"
        onClick={() => setMode('splat')}
        aria-pressed={mode === 'splat'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-6 rounded-sm text-xs font-medium transition-colors duration-fast',
          mode === 'splat' ? 'bg-surface-0 text-white' : 'text-white/60 hover:text-white/90'
        )}
      >
        <Droplet className="h-3 w-3" />
        Splat
      </button>
      <button
        type="button"
        onClick={() => setMode('particles')}
        aria-pressed={mode === 'particles'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-6 rounded-sm text-xs font-medium transition-colors duration-fast',
          mode === 'particles' ? 'bg-surface-0 text-white' : 'text-white/60 hover:text-white/90'
        )}
      >
        <Sparkles className="h-3 w-3" />
        Particles
      </button>
    </div>
  );
};
