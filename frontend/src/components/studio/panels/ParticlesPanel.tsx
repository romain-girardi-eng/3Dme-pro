import { useSceneStore } from '@/stores/sceneStore';
import { NumberField, Select } from '@/components/ui';

export const ParticlesPanel = () => {
  const p = useSceneStore((s) => s.scene.particles);
  const update = useSceneStore((s) => s.updateParticles);

  return (
    <div className="space-y-3">
      <NumberField
        label="count"
        value={p.count}
        onChange={(v) => update({ count: v })}
        min={1000}
        max={2_000_000}
        step={10_000}
        suffix="pts"
      />
      <NumberField
        label="size"
        value={p.size}
        onChange={(v) => update({ size: v })}
        min={0.1}
        max={10}
        step={0.1}
      />
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">shape</span>
        <Select value={p.shape} onChange={(e) => update({ shape: e.target.value as typeof p.shape })}>
          <option value="mesh">From mesh</option>
          <option value="sphere">Sphere</option>
          <option value="galaxy">Galaxy</option>
          <option value="star">Star</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">color mode</span>
        <Select
          value={p.colorMode}
          onChange={(e) => update({ colorMode: e.target.value as typeof p.colorMode })}
        >
          <option value="image">Sample image</option>
          <option value="gradient">Gradient</option>
          <option value="solid">Solid</option>
        </Select>
      </div>
    </div>
  );
};
