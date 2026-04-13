import { TopBar } from './TopBar';
import { LeftRail } from './LeftRail';
import { RightRail } from './RightRail';
import { CanvasViewport } from './CanvasViewport';
import { BottomTransport } from './BottomTransport';
import { CommandPalette } from './CommandPalette';
import { FileDropZone } from './FileDropZone';
import { useUrlHashSync } from '@/hooks/useUrlHashSync';

export const StudioShell = () => {
  useUrlHashSync();

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-0 text-white overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftRail />
        <CanvasViewport />
        <RightRail />
      </div>
      <BottomTransport />
      <CommandPalette />
      <FileDropZone />
    </div>
  );
};
