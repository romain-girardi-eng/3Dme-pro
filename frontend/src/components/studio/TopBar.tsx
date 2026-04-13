import { useState } from 'react';
import { Sparkles, Share2, Download, Undo2, Redo2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { IconButton, Tooltip, Button } from '@/components/ui';
import { ModeToggle } from './ModeToggle';
import { ShareDialog } from './ShareDialog';
import { ExportDialog } from './ExportDialog';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const TopBar = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const status = useSceneStore((s) => s.generation.status);
  const cost = useSceneStore((s) => s.generation.costUsd);

  useKeyboardShortcut('s', () => setShareOpen(true), { meta: true, shift: true });

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-1 backdrop-blur-md px-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-primary" />
        <span className="font-semibold text-sm text-white">3Dme</span>
        <span className="hidden md:inline text-2xs text-white/40 ml-2">Untitled scene</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 p-0.5">
          <Tooltip content="Undo ⌘Z">
            <IconButton icon={<Undo2 />} label="Undo" size="sm" />
          </Tooltip>
          <Tooltip content="Redo ⌘⇧Z">
            <IconButton icon={<Redo2 />} label="Redo" size="sm" />
          </Tooltip>
        </div>
        <span className="text-2xs font-mono text-white/50">
          {status === 'ready' ? 'Ready' : status === 'idle' ? 'Idle' : status}
          <span className="mx-2 text-white/20">·</span>${cost.toFixed(3)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
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
