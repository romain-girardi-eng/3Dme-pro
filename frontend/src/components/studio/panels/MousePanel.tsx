import { useSceneStore } from '@/stores/sceneStore';
import { SliderField, Select } from '@/components/ui';
import type { MouseMode } from '@/stores/sceneStore.types';

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="space-y-2.5">
    <h3 className="text-2xs uppercase tracking-[0.18em] text-white/40 font-medium">{label}</h3>
    {children}
  </section>
);

const Toggle = ({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) => (
  <label className="flex items-center justify-between gap-3 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2 text-sm text-white/80 cursor-pointer select-none">
    <span>{children}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 cursor-pointer accent-brand-primary"
    />
  </label>
);

export const MousePanel = () => {
  const mouse = useSceneStore((s) => s.scene.mouse);
  const update = useSceneStore((s) => s.updateMouse);
  const audio = useSceneStore((s) => s.scene.audio);
  const updateAudio = useSceneStore((s) => s.updateAudio);

  return (
    <div className="space-y-5">
      <Section label="Interaction">
        <Toggle checked={mouse.enabled} onChange={(v) => update({ enabled: v })}>
          Mouse hover force
        </Toggle>
        <Toggle
          checked={mouse.handTracking}
          onChange={(v) => update({ handTracking: v, enabled: v ? true : mouse.enabled })}
        >
          Hand tracking (webcam)
        </Toggle>
        {mouse.handTracking && (
          <p className="text-2xs leading-relaxed text-white/45">
            Move your index finger to steer the force. Pinch thumb + index to intensify it.
          </p>
        )}
      </Section>

      {mouse.enabled && (
        <Section label="Tuning">
          <Select
            value={mouse.mode}
            onChange={(e) => update({ mode: e.target.value as MouseMode })}
          >
            <option value="repel">Repel</option>
            <option value="attract">Attract</option>
            <option value="orbit">Orbit</option>
            <option value="vortex">Vortex</option>
          </Select>
          <SliderField
            label="force"
            value={mouse.force}
            onChange={(v) => update({ force: v })}
            min={0}
            max={1.5}
            step={0.01}
          />
          <SliderField
            label="radius"
            value={mouse.radius}
            onChange={(v) => update({ radius: v })}
            min={2}
            max={40}
            step={0.5}
          />
        </Section>
      )}

      <Section label="Audio reactive">
        <Toggle checked={audio.enabled} onChange={(v) => updateAudio({ enabled: v })}>
          React to audio
        </Toggle>
        {audio.enabled && (
          <SliderField
            label="sensitivity"
            value={audio.sensitivity}
            onChange={(v) => updateAudio({ sensitivity: v })}
            min={0}
            max={2}
            step={0.05}
          />
        )}
      </Section>
    </div>
  );
};
