import { create } from 'zustand';
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

  useKeyboardShortcut('f', toggle, { shift: true });
  useKeyboardShortcut('Escape', () => useChromeStore.getState().setFullscreen(false), { allowInInput: true });

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
    </div>
  );
};
