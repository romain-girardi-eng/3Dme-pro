import { useSceneStore } from '@/stores/sceneStore';
import { NumberField, Select } from '@/components/ui';
import type { ColorMode, Quality } from '@/stores/sceneStore.types';

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-2xs uppercase tracking-[0.18em] text-white/40 font-medium">{label}</h3>
    {children}
  </section>
);

export const LookPanel = () => {
  const look = useSceneStore((s) => s.scene.look);
  const update = useSceneStore((s) => s.updateLook);

  return (
    <div className="space-y-5">
      <Section label="Quality">
        <Select
          value={look.quality}
          onChange={(e) => update({ quality: e.target.value as Quality })}
        >
          <option value="low">Low — 260k pts</option>
          <option value="medium">Medium — 1M pts</option>
          <option value="high">High — 1.9M pts</option>
        </Select>
      </Section>

      <Section label="Color">
        <div className="space-y-2">
          <Select
            value={look.colorMode}
            onChange={(e) => update({ colorMode: e.target.value as ColorMode })}
          >
            <option value="original">From generated image</option>
            <option value="rainbow">Rainbow</option>
            <option value="ocean">Ocean</option>
            <option value="sunset">Sunset</option>
            <option value="neon">Neon</option>
            <option value="fire">Fire</option>
            <option value="matrix">Matrix</option>
            <option value="velocity">Velocity-mapped</option>
            <option value="custom">Custom</option>
          </Select>
          {look.colorMode === 'custom' && (
            <input
              type="color"
              value={look.customColor}
              onChange={(e) => update({ customColor: e.target.value })}
              className="h-8 w-full cursor-pointer rounded-sm border border-border-subtle bg-surface-2"
            />
          )}
        </div>
      </Section>

      <Section label="Tone">
        <div className="space-y-2">
          <NumberField
            label="size"
            value={look.particleSize}
            onChange={(v) => update({ particleSize: v })}
            min={0.5}
            max={8}
            step={0.1}
          />
          <NumberField
            label="brightness"
            value={look.brightness}
            onChange={(v) => update({ brightness: v })}
            min={0}
            max={2}
            step={0.05}
          />
          <NumberField
            label="saturation"
            value={look.saturation}
            onChange={(v) => update({ saturation: v })}
            min={0}
            max={2}
            step={0.05}
          />
          <NumberField
            label="hue"
            value={look.hueShift}
            onChange={(v) => update({ hueShift: v })}
            min={-180}
            max={180}
            step={1}
            suffix="°"
          />
          <NumberField
            label="shimmer"
            value={look.shimmer}
            onChange={(v) => update({ shimmer: v })}
            min={0}
            max={1}
            step={0.02}
          />
        </div>
      </Section>

      <Section label="Effects">
        <div className="space-y-2">
          <NumberField
            label="bloom"
            value={look.bloom}
            onChange={(v) => update({ bloom: v })}
            min={0}
            max={2}
            step={0.05}
          />
          <NumberField
            label="trails"
            value={look.trails}
            onChange={(v) => update({ trails: v })}
            min={0}
            max={1}
            step={0.02}
          />
        </div>
      </Section>
    </div>
  );
};
