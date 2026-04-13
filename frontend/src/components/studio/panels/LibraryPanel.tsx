import { useSceneStore } from '@/stores/sceneStore';

const PRESETS = [
  { id: 'galaxy', label: 'Milky Way', prompt: 'A realistic spiral galaxy with visible dust lanes and bright core' },
  { id: 'dragon', label: 'Ice Dragon', prompt: 'An ancient ice dragon carved from blue obsidian, volumetric fog' },
  { id: 'jellyfish', label: 'Jellyfish', prompt: 'A translucent bioluminescent jellyfish drifting in dark water' },
  { id: 'mech', label: 'Mech', prompt: 'A battle-worn mecha with intricate armor and glowing core' },
];

export const LibraryPanel = () => {
  const setPrompt = useSceneStore((s) => s.setPrompt);
  return (
    <ul className="space-y-1">
      {PRESETS.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => setPrompt(p.prompt)}
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-white/70 hover:bg-surface-2 hover:text-white transition-colors duration-fast"
          >
            {p.label}
          </button>
        </li>
      ))}
    </ul>
  );
};
