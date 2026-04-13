import { useSceneStore } from '@/stores/sceneStore';
import { NumberField, Select } from '@/components/ui';

export const PhysicsPanel = () => {
  const p = useSceneStore((s) => s.scene.physics);
  const update = useSceneStore((s) => s.updatePhysics);
  return (
    <div className="space-y-3">
      <NumberField label="mouse gravity" value={p.mouseGravity} onChange={(v) => update({ mouseGravity: v })} min={0} max={4} step={0.05} />
      <NumberField label="mouse radius" value={p.mouseRadius} onChange={(v) => update({ mouseRadius: v })} min={0.1} max={8} step={0.1} />
      <NumberField label="turbulence" value={p.turbulence} onChange={(v) => update({ turbulence: v })} min={0} max={2} step={0.02} />
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">attractor</span>
        <Select
          value={p.attractor}
          onChange={(e) => update({ attractor: e.target.value as typeof p.attractor })}
        >
          <option value="none">None</option>
          <option value="lorenz">Lorenz</option>
          <option value="aizawa">Aizawa</option>
          <option value="chen">Chen</option>
        </Select>
      </div>
    </div>
  );
};
