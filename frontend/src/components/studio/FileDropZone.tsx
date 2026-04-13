import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useFileDrop } from '@/hooks/useFileDrop';
import { useSceneStore } from '@/stores/sceneStore';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { cn } from '@/lib/cn';

export const FileDropZone = () => {
  const setStatus = useSceneStore((s) => s.setStatus);
  const selectVariant = useSceneStore((s) => s.selectVariant);
  const setVariants = useSceneStore((s) => s.setVariants);
  const { runThreeDStage } = useGenerationFlow();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic')) {
      toast.error('Drop an image file');
      return;
    }
    let imageFile: File = file;
    if (file.name.toLowerCase().endsWith('.heic')) {
      try {
        const mod = (await import('heic2any')) as unknown as {
          default?: (opts: { blob: Blob; toType?: string }) => Promise<Blob | Blob[]>;
        };
        const heic2any =
          mod.default ??
          (mod as unknown as (opts: { blob: Blob; toType?: string }) => Promise<Blob | Blob[]>);
        const result = await heic2any({ blob: file, toType: 'image/jpeg' });
        const blob = Array.isArray(result) ? result[0] : result;
        imageFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
          type: 'image/jpeg',
        });
      } catch {
        toast.error('HEIC conversion failed');
        return;
      }
    }

    setStatus('generating-image');
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(imageFile);
      });
      setVariants([{ url: dataUrl, seed: 0 }]);
      selectVariant(0);
      setStatus('idle');
      toast.success('Image ready — click Convert to 3D');
      void runThreeDStage();
    } catch (err) {
      setStatus('error', (err as Error).message);
      toast.error('File read failed');
    }
  };

  const dragOver = useFileDrop(handleFile);

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-fast',
        dragOver ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className="absolute inset-0 bg-surface-0/70 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-brand-primary/60 bg-surface-1 px-10 py-8 text-center">
        <Upload className="h-8 w-8 text-brand-primary" />
        <p className="text-base font-semibold text-white">Drop image to convert</p>
        <p className="text-xs text-white/50">JPG, PNG, WebP, HEIC</p>
      </div>
    </div>
  );
};
