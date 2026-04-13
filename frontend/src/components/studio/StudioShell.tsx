import { useEffect } from 'react';
import { create } from 'zustand';
import { Minimize2 } from 'lucide-react';
import { TopBar } from './TopBar';
import { LeftRail } from './LeftRail';
import { RightRail } from './RightRail';
import { CanvasViewport } from './CanvasViewport';
import { BottomTransport } from './BottomTransport';
import { CommandPalette } from './CommandPalette';
import { FileDropZone } from './FileDropZone';
import { HandTrackingOverlay } from './HandTrackingOverlay';
import { useUrlHashSync } from '@/hooks/useUrlHashSync';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface ChromeState {
  fullscreen: boolean;
  toggleFullscreen: () => void;
  setFullscreen: (v: boolean) => void;
}

export const useChromeStore = create<ChromeState>((set) => ({
  fullscreen: false,
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  setFullscreen: (fullscreen) => set({ fullscreen }),
}));

export const StudioShell = () => {
  useUrlHashSync();
  const fullscreen = useChromeStore((s) => s.fullscreen);
  const toggle = useChromeStore((s) => s.toggleFullscreen);
  const setFullscreen = useChromeStore((s) => s.setFullscreen);

  useKeyboardShortcut('f', toggle, { shift: true });
  useKeyboardShortcut('Escape', () => setFullscreen(false), { allowInInput: true });

  // When fullscreen toggles, rails mount/unmount → canvas container resizes.
  // UltimateParticles listens to window resize, so nudge it after layout settles.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
    return () => cancelAnimationFrame(id);
  }, [fullscreen]);

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-0 text-white overflow-hidden">
      {!fullscreen && <TopBar />}
      <div className="flex min-h-0 flex-1">
        {!fullscreen && <LeftRail />}
        <CanvasViewport />
        {!fullscreen && <RightRail />}
      </div>
      {!fullscreen && <BottomTransport />}
      <CommandPalette />
      <FileDropZone />
      <HandTrackingOverlay />
      {fullscreen && (
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-surface-0/80 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-surface-1 hover:text-white"
          aria-label="Exit fullscreen"
        >
          <Minimize2 className="h-3.5 w-3.5" /> Exit fullscreen
          <span className="text-2xs text-white/40">Esc</span>
        </button>
      )}
    </div>
  );
};
