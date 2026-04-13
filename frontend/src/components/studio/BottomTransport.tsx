import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { IconButton, Slider } from '@/components/ui';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const BottomTransport = () => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);

  useKeyboardShortcut(' ', () => setPlaying((p) => !p));

  return (
    <footer className="flex h-[60px] shrink-0 items-center gap-4 border-t border-border-subtle bg-surface-1 backdrop-blur-md px-4">
      <div className="flex items-center gap-1">
        <IconButton icon={<SkipBack />} label="Previous keyframe" size="sm" />
        <IconButton
          icon={playing ? <Pause /> : <Play />}
          label={playing ? 'Pause' : 'Play'}
          variant="primary"
          size="md"
          onClick={() => setPlaying((p) => !p)}
        />
        <IconButton icon={<SkipForward />} label="Next keyframe" size="sm" />
      </div>
      <Slider value={progress} onValueChange={setProgress} min={0} max={100} className="flex-1" />
      <span className="text-2xs font-mono tabular-nums text-white/50 w-12 text-right">
        {progress[0].toFixed(0)}%
      </span>
    </footer>
  );
};
