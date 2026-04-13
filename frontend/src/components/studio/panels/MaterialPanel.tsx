import { useSceneStore } from '@/stores/sceneStore';
import { NumberField } from '@/components/ui';

export const MaterialPanel = () => {
  const m = useSceneStore((s) => s.scene.material);
  const update = useSceneStore((s) => s.updateMaterial);
  return (
    <div className="space-y-3">
      <NumberField label="exposure" value={m.exposure} onChange={(v) => update({ exposure: v })} min={0} max={4} step={0.05} />
      <NumberField label="splat scale" value={m.splatScale} onChange={(v) => update({ splatScale: v })} min={0.1} max={4} step={0.05} />
      <NumberField label="opacity cutoff" value={m.opacityCutoff} onChange={(v) => update({ opacityCutoff: v })} min={0} max={1} step={0.005} />
      <NumberField label="emissive" value={m.emissive} onChange={(v) => update({ emissive: v })} min={0} max={2} step={0.05} />
      <NumberField label="fresnel" value={m.fresnel} onChange={(v) => update({ fresnel: v })} min={0} max={1} step={0.01} />
      <NumberField label="brightness" value={m.brightness} onChange={(v) => update({ brightness: v })} min={0} max={2} step={0.05} />
      <NumberField label="saturation" value={m.saturation} onChange={(v) => update({ saturation: v })} min={0} max={2} step={0.05} />
      <NumberField label="hue shift" value={m.hueShift} onChange={(v) => update({ hueShift: v })} min={-180} max={180} step={1} suffix="°" />
      <NumberField label="rotation speed" value={m.rotationSpeed} onChange={(v) => update({ rotationSpeed: v })} min={0} max={2} step={0.05} />
    </div>
  );
};
