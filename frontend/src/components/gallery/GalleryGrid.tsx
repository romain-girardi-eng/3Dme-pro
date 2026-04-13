import { PRESETS } from '@/lib/presets';
import { PresetCard } from './PresetCard';

export const GalleryGrid = () => (
  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
    {PRESETS.map((p) => (
      <PresetCard key={p.id} preset={p} />
    ))}
  </div>
);
