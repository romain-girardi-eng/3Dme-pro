import { useSceneStore } from '@/stores/sceneStore';

export const GizmoOverlay = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const count = useSceneStore((s) => s.scene.particles.count);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-sm bg-surface-0/70 backdrop-blur border border-border-subtle px-2 py-1 text-2xs font-mono text-white/70">
        <span className="uppercase tracking-wider">{mode}</span>
        <span className="text-white/30">·</span>
        <span className="tabular-nums">{count.toLocaleString()} pts</span>
      </div>
    </div>
  );
};
