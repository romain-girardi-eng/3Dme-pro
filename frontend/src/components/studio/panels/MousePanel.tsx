import { useSceneStore } from '@/stores/sceneStore';
import { NumberField, Select } from '@/components/ui';
import type { MouseMode } from '@/stores/sceneStore.types';

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-2xs uppercase tracking-[0.18em] text-white/40 font-medium">{label}</h3>
    {children}
  </section>
);

export const MousePanel = () => {
  const mouse = useSceneStore((s) => s.scene.mouse);
  const update = useSceneStore((s) => s.updateMouse);
  const audio = useSceneStore((s) => s.scene.audio);
  const updateAudio = useSceneStore((s) => s.updateAudio);

  return (
    <div className="space-y-5">
      <Section label="Interaction">
        <label className="flex items-center justify-between gap-3 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2 text-sm text-white/80 cursor-pointer select-none">
          <span>Mouse hover force</span>
          <input
            type="checkbox"
            checked={mouse.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-brand-primary"
          />
        </label>
      </Section>

      {mouse.enabled && (
        <Section label="Tuning">
          <div className="space-y-2">
            <Select
              value={mouse.mode}
              onChange={(e) => update({ mode: e.target.value as MouseMode })}
            >
              <option value="repel">Repel</option>
              <option value="attract">Attract</option>
              <option value="orbit">Orbit</option>
              <option value="vortex">Vortex</option>
            </Select>
            <NumberField
              label="force"
              value={mouse.force}
              onChange={(v) => update({ force: v })}
              min={0}
              max={2}
              step={0.02}
            />
            <NumberField
              label="radius"
              value={mouse.radius}
              onChange={(v) => update({ radius: v })}
              min={0.1}
              max={3}
              step={0.05}
            />
          </div>
        </Section>
      )}

      <Section label="Audio reactive">
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2 text-sm text-white/80 cursor-pointer select-none">
            <span>React to audio</span>
            <input
              type="checkbox"
              checked={audio.enabled}
              onChange={(e) => updateAudio({ enabled: e.target.checked })}
              className="h-4 w-4 cursor-pointer accent-brand-primary"
            />
          </label>
          {audio.enabled && (
            <NumberField
              label="sensitivity"
              value={audio.sensitivity}
              onChange={(v) => updateAudio({ sensitivity: v })}
              min={0}
              max={2}
              step={0.05}
            />
          )}
        </div>
      </Section>
    </div>
  );
};
