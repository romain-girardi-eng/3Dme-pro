import { useCallback } from 'react';
import { toast } from 'sonner';
import { useSceneStore } from '@/stores/sceneStore';
import { useGenerationFlow } from './useGenerationFlow';

const GLB_EXT = /\.(glb|gltf)$/i;
const HEIC_EXT = /\.heic$/i;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const useAssetIntake = () => {
  const setStatus = useSceneStore((s) => s.setStatus);
  const setVariants = useSceneStore((s) => s.setVariants);
  const selectVariant = useSceneStore((s) => s.selectVariant);
  const setAssets = useSceneStore((s) => s.setAssets);
  const pushHistory = useSceneStore((s) => s.pushHistory);
  const { runThreeDStage } = useGenerationFlow();

  return useCallback(
    async (file: File) => {
      // ----- GLB / GLTF: skip generation, render directly -----
      if (GLB_EXT.test(file.name) || file.type === 'model/gltf-binary') {
        const url = URL.createObjectURL(file);
        setAssets({ glbUrl: url, splatUrl: null });
        setStatus('ready');
        pushHistory({
          id: `upl-${Date.now()}`,
          prompt: file.name,
          thumbnailUrl: null,
          glbUrl: url,
          splatUrl: null,
          tier: 'fast',
          source: 'uploaded',
          createdAt: Date.now(),
        });
        toast.success(`Loaded ${file.name}`);
        return;
      }

      // ----- Image: HEIC → JPG → data URL → fal 3D -----
      let imageFile = file;
      if (HEIC_EXT.test(file.name)) {
        try {
          const mod = (await import('heic2any')) as {
            default?: (opts: { blob: Blob; toType: string }) => Promise<Blob | Blob[]>;
          };
          const heic2any = mod.default;
          if (!heic2any) throw new Error('heic2any not available');
          const result = await heic2any({ blob: file, toType: 'image/jpeg' });
          const blob = Array.isArray(result) ? result[0] : result;
          imageFile = new File([blob], file.name.replace(HEIC_EXT, '.jpg'), { type: 'image/jpeg' });
        } catch {
          toast.error('HEIC conversion failed');
          return;
        }
      }
      if (!imageFile.type.startsWith('image/')) {
        toast.error('Drop an image or a .glb/.gltf file');
        return;
      }

      try {
        const dataUrl = await readAsDataUrl(imageFile);
        setVariants([{ url: dataUrl, seed: 0 }]);
        selectVariant(0);
        setStatus('idle');
        toast.success('Image loaded — converting to 3D');
        void runThreeDStage();
      } catch (err) {
        toast.error(`File read failed: ${(err as Error).message}`);
      }
    },
    [setStatus, setVariants, selectVariant, setAssets, pushHistory, runThreeDStage],
  );
};
