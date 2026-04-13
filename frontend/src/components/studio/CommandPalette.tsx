import { useState } from 'react';
import { Command } from 'cmdk';
import { Sparkles, Share2, Droplet, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useSceneStore } from '@/stores/sceneStore';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const setMode = useSceneStore((s) => s.setMode);
  const resetScene = useSceneStore((s) => s.resetScene);
  const toHash = useSceneStore((s) => s.toHash);
  const { runImageStage } = useGenerationFlow();

  useKeyboardShortcut('k', () => setOpen((v) => !v), { meta: true });

  const close = () => setOpen(false);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command Palette">
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
        onClick={close}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-md bg-surface-1 border border-border shadow-2xl overflow-hidden"
        >
          <Command.Input
            placeholder="Type a command…"
            className="w-full h-11 px-4 bg-transparent border-b border-border-subtle text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <Command.List className="max-h-[320px] overflow-y-auto p-1">
            <Command.Empty className="px-4 py-6 text-center text-xs text-white/40">
              No commands found.
            </Command.Empty>
            <Command.Group heading="Generation">
              <Command.Item
                onSelect={() => {
                  close();
                  void runImageStage();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate from current prompt
              </Command.Item>
            </Command.Group>
            <Command.Group heading="View">
              <Command.Item
                onSelect={() => {
                  setMode('splat');
                  close();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2"
              >
                <Droplet className="h-3.5 w-3.5" /> Switch to Splat mode
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setMode('particles');
                  close();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2"
              >
                <Play className="h-3.5 w-3.5" /> Switch to Particles mode
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Scene">
              <Command.Item
                onSelect={async () => {
                  await navigator.clipboard.writeText(`${window.location.origin}/studio#${toHash()}`);
                  toast.success('Share URL copied');
                  close();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2"
              >
                <Share2 className="h-3.5 w-3.5" /> Copy share URL
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  resetScene();
                  close();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 rounded-sm data-[selected=true]:bg-surface-2"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset scene
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  );
};
