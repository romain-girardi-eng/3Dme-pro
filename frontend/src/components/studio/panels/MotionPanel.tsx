import { useSceneStore } from '@/stores/sceneStore';
import { NumberField, Select } from '@/components/ui';
import type { AnimationMode } from '@/stores/sceneStore.types';

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-2xs uppercase tracking-[0.18em] text-white/40 font-medium">{label}</h3>
    {children}
  </section>
);

export const MotionPanel = () => {
  const motion = useSceneStore((s) => s.scene.motion);
  const update = useSceneStore((s) => s.updateMotion);

  return (
    <div className="space-y-5">
      <Section label="Animation">
        <Select
          value={motion.mode}
          onChange={(e) => update({ mode: e.target.value as AnimationMode })}
        >
          <option value="none">None (static)</option>
          <option value="float">Float</option>
          <option value="wave">Wave</option>
          <option value="vortex">Vortex</option>
          <option value="turbulence">Turbulence</option>
          <option value="magnetic">Magnetic</option>
          <option value="lorenz">Lorenz attractor</option>
          <option value="aizawa">Aizawa attractor</option>
        </Select>
      </Section>

      <Section label="Parameters">
        <div className="space-y-2">
          <NumberField
            label="speed"
            value={motion.speed}
            onChange={(v) => update({ speed: v })}
            min={0}
            max={3}
            step={0.05}
          />
          <NumberField
            label="turbulence"
            value={motion.turbulence}
            onChange={(v) => update({ turbulence: v })}
            min={0}
            max={1}
            step={0.02}
          />
          <NumberField
            label="rotation"
            value={motion.rotationSpeed}
            onChange={(v) => update({ rotationSpeed: v })}
            min={0}
            max={2}
            step={0.05}
          />
        </div>
      </Section>

      <Section label="Shape memory">
        <div className="space-y-2">
          <NumberField
            label="strength"
            value={motion.shapeMemory}
            onChange={(v) => update({ shapeMemory: v })}
            min={0}
            max={1}
            step={0.02}
          />
          <p className="text-2xs leading-relaxed text-white/45">
            How strongly particles snap back to the generated shape. Higher = more solid form.
          </p>
        </div>
      </Section>
    </div>
  );
};
