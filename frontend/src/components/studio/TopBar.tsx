import { useState } from 'react';
import { Sparkles, Share2, Download, Undo2, Redo2, Maximize2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { IconButton, Tooltip, Button } from '@/components/ui';
import { ModeToggle } from './ModeToggle';
import { ShareDialog } from './ShareDialog';
import { ExportDialog } from './ExportDialog';
import { useChromeStore } from './StudioShell';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const TopBar = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const status = useSceneStore((s) => s.generation.status);
  const cost = useSceneStore((s) => s.generation.costUsd);
  const toggleFullscreen = useChromeStore((s) => s.toggleFullscreen);

  useKeyboardShortcut('s', () => setShareOpen(true), { meta: true, shift: true });

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-1 backdrop-blur-md px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-primary shrink-0" />
        <span className="text-sm font-semibold text-white">3Dme</span>
        <span className="hidden lg:inline text-2xs text-white/35 truncate">Untitled scene</span>
      </div>

      <div className="hidden md:flex items-center gap-0.5 rounded-sm border border-border-subtle bg-surface-2 p-0.5 ml-2">
        <Tooltip content="Undo ⌘Z">
          <IconButton icon={<Undo2 />} label="Undo" size="sm" />
        </Tooltip>
        <Tooltip content="Redo ⌘⇧Z">
          <IconButton icon={<Redo2 />} label="Redo" size="sm" />
        </Tooltip>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2">
        <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-2/60 px-2.5 py-0.5 text-2xs font-mono text-white/55">
          <span
            className={
              status === 'ready'
                ? 'h-1.5 w-1.5 rounded-full bg-signal-success'
                : status === 'idle'
                ? 'h-1.5 w-1.5 rounded-full bg-white/30'
                : 'h-1.5 w-1.5 rounded-full bg-brand-secondary animate-pulse'
            }
          />
          {status === 'ready' ? 'Ready' : status === 'idle' ? 'Idle' : status.replace('-', ' ')}
          <span className="text-white/20">·</span>
          <span className="tabular-nums text-white/75">${cost.toFixed(3)}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <Tooltip content="Fullscreen ⇧F">
          <IconButton icon={<Maximize2 />} label="Fullscreen" variant="solid" size="sm" onClick={toggleFullscreen} />
        </Tooltip>
        <Tooltip content="Share scene ⌘⇧S">
          <Button
            variant="secondary"
            size="sm"
            leading={<Share2 className="h-3.5 w-3.5" />}
            onClick={() => setShareOpen(true)}
          >
            Share
          </Button>
        </Tooltip>
        <Tooltip content="Export">
          <IconButton
            icon={<Download />}
            label="Export"
            variant="solid"
            size="sm"
            onClick={() => setExportOpen(true)}
          />
        </Tooltip>
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </header>
  );
};
