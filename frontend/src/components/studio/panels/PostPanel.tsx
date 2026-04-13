import { useSceneStore } from '@/stores/sceneStore';
import { NumberField } from '@/components/ui';

export const PostPanel = () => {
  const p = useSceneStore((s) => s.scene.post);
  const update = useSceneStore((s) => s.updatePost);
  return (
    <div className="space-y-3">
      <NumberField label="bloom" value={p.bloom} onChange={(v) => update({ bloom: v })} min={0} max={3} step={0.05} />
      <NumberField label="chromatic" value={p.chromaticAberration} onChange={(v) => update({ chromaticAberration: v })} min={0} max={0.2} step={0.005} />
      <NumberField label="vignette" value={p.vignette} onChange={(v) => update({ vignette: v })} min={0} max={1} step={0.02} />
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={p.dof} onChange={(e) => update({ dof: e.target.checked })} />
        Depth of field
      </label>
    </div>
  );
};
