import { useSceneStore } from '@/stores/sceneStore';
import type { Quality } from '@/stores/sceneStore.types';

const QUALITY_LABEL: Record<Quality, string> = {
  low: '260k pts',
  medium: '1M pts',
  high: '1.9M pts',
};

export const GizmoOverlay = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const quality = useSceneStore((s) => s.scene.look.quality);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-sm border border-border-subtle bg-surface-0/70 px-2 py-1 text-2xs font-mono text-white/70 backdrop-blur">
        <span className="uppercase tracking-wider">{mode}</span>
        <span className="text-white/30">·</span>
        <span className="tabular-nums">{QUALITY_LABEL[quality]}</span>
      </div>
    </div>
  );
};
