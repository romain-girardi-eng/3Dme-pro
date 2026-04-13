import { useSceneStore } from '@/stores/sceneStore';
import { useAudioReactive } from '@/hooks/useAudioReactive';
import { NumberField, Select } from '@/components/ui';

export const AudioPanel = () => {
  const audio = useSceneStore((s) => s.scene.audio);
  const update = useSceneStore((s) => s.updateAudio);
  const levels = useSceneStore((s) => s.audioLevels);
  useAudioReactive();

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={audio.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
        Enable audio reactive
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-wider text-white/40">source</span>
        <Select
          value={audio.source}
          onChange={(e) => update({ source: e.target.value as typeof audio.source })}
        >
          <option value="mic">Microphone</option>
          <option value="file">File</option>
          <option value="demo">Demo track</option>
        </Select>
      </div>
      <NumberField
        label="sensitivity"
        value={audio.sensitivity}
        onChange={(v) => update({ sensitivity: v })}
        min={0}
        max={2}
        step={0.05}
      />
      <div className="grid grid-cols-3 gap-2 pt-2">
        {(['bass', 'mid', 'treble'] as const).map((band) => (
          <div key={band} className="space-y-1">
            <span className="text-2xs uppercase tracking-wider text-white/40">{band}</span>
            <div className="h-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-brand-primary transition-all duration-fast"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ width: `${Math.min(100, levels[band] * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
