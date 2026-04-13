import { useSceneStore } from '@/stores/sceneStore';
import { SliderField, Select } from '@/components/ui';
import type { ColorMode, Quality, FallbackShape } from '@/stores/sceneStore.types';

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="space-y-2.5">
    <h3 className="text-2xs uppercase tracking-[0.18em] text-white/40 font-medium">{label}</h3>
    {children}
  </section>
);

export const LookPanel = () => {
  const look = useSceneStore((s) => s.scene.look);
  const update = useSceneStore((s) => s.updateLook);
  const hasMesh = useSceneStore((s) => Boolean(s.generation.glbUrl));

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

      <Section label="Shape">
        <Select
          value={look.fallbackShape}
          onChange={(e) => update({ fallbackShape: e.target.value as FallbackShape })}
          disabled={hasMesh}
        >
          <option value="galaxy">Galaxy</option>
          <option value="nebula">Nebula</option>
          <option value="sphere">Sphere</option>
          <option value="cube">Cube</option>
          <option value="torus">Torus</option>
          <option value="heart">Heart</option>
          <option value="star">Star</option>
          <option value="dna">DNA helix</option>
          <option value="wave">Wave</option>
          <option value="butterfly">Butterfly</option>
          <option value="aurora">Aurora</option>
          <option value="skull">Skull</option>
          <option value="phoenix">Phoenix</option>
          <option value="rose">Rose</option>
        </Select>
        <p className="text-2xs leading-relaxed text-white/40">
          {hasMesh
            ? 'Using generated mesh. Clear generation to pick a shape.'
            : 'Used until you generate a 3D mesh.'}
        </p>
      </Section>

      <Section label="Color">
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
            className="mt-2 h-8 w-full cursor-pointer rounded-sm border border-border-subtle bg-surface-2"
          />
        )}
      </Section>

      <Section label="Tone">
        <SliderField
          label="size"
          value={look.particleSize}
          onChange={(v) => update({ particleSize: v })}
          min={0.5}
          max={6}
          step={0.1}
        />
        <SliderField
          label="brightness"
          value={look.brightness}
          onChange={(v) => update({ brightness: v })}
          min={0}
          max={2}
          step={0.05}
        />
        <SliderField
          label="saturation"
          value={look.saturation}
          onChange={(v) => update({ saturation: v })}
          min={0}
          max={2}
          step={0.05}
        />
        <SliderField
          label="hue"
          value={look.hueShift}
          onChange={(v) => update({ hueShift: v })}
          min={-180}
          max={180}
          step={1}
          suffix="°"
        />
        <SliderField
          label="shimmer"
          value={look.shimmer}
          onChange={(v) => update({ shimmer: v })}
          min={0}
          max={1}
          step={0.02}
        />
      </Section>

      <Section label="Effects">
        <SliderField
          label="bloom"
          value={look.bloom}
          onChange={(v) => update({ bloom: v })}
          min={0}
          max={1.5}
          step={0.02}
        />
        <SliderField
          label="trails"
          value={look.trails}
          onChange={(v) => update({ trails: v })}
          min={0}
          max={1}
          step={0.02}
        />
      </Section>
    </div>
  );
};
