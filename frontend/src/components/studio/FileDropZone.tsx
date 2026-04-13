import { Upload } from 'lucide-react';
import { useFileDrop } from '@/hooks/useFileDrop';
import { useAssetIntake } from '@/hooks/useAssetIntake';
import { cn } from '@/lib/cn';

export const FileDropZone = () => {
  const intake = useAssetIntake();
  const dragOver = useFileDrop(intake);

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-fast',
        dragOver ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="absolute inset-0 bg-surface-0/70 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-brand-primary/60 bg-surface-1 px-10 py-8 text-center">
        <Upload className="h-8 w-8 text-brand-primary" />
        <p className="text-base font-semibold text-white">Drop to load</p>
        <p className="text-xs text-white/50">Image (JPG/PNG/WebP/HEIC) → 3D pipeline</p>
        <p className="text-xs text-white/50">GLB / GLTF → direct particle render</p>
      </div>
    </div>
  );
};
