import { useCallback } from 'react';
import { toast } from 'sonner';
import { useSceneStore } from '@/stores/sceneStore';
import { enhancePrompt, generateImage, generate3D } from '@/services/aiService';

export const useGenerationFlow = () => {
  const setStatus = useSceneStore((s) => s.setStatus);
  const setEnhancedPrompt = useSceneStore((s) => s.setEnhancedPrompt);
  const setVariants = useSceneStore((s) => s.setVariants);
  const selectVariant = useSceneStore((s) => s.selectVariant);
  const setAssets = useSceneStore((s) => s.setAssets);
  const setCost = useSceneStore((s) => s.setCost);

  const runImageStage = useCallback(async () => {
    const { generation } = useSceneStore.getState();
    const prompt = generation.enhancedPrompt ?? generation.prompt;
    if (!prompt) {
      toast.error('Type a prompt first');
      return;
    }

    try {
      if (generation.enhancerEnabled && !generation.enhancedPrompt) {
        setStatus('enhancing');
        const { enhanced } = await enhancePrompt({ prompt: generation.prompt, style: 'cinematic' });
        setEnhancedPrompt(enhanced);
      }
    } catch {
      toast.message('Enhancer unavailable — using raw prompt');
    }

    setStatus('generating-image');
    setVariants([]);
    selectVariant(null);

    try {
      const stream = generateImage({
        prompt: useSceneStore.getState().generation.enhancedPrompt ?? prompt,
        model: generation.imageModel,
        batch: 4,
      });
      let cost = 0;
      for await (const evt of stream) {
        if (evt.type === 'images' && evt.images) setVariants(evt.images);
        else if (evt.type === 'done') {
          if (evt.images) setVariants(evt.images);
          cost += evt.costUsd ?? 0;
        } else if (evt.type === 'error') {
          throw new Error(evt.error ?? 'generation error');
        }
      }
      setCost(cost);
      setStatus('idle');
    } catch (err) {
      setStatus('error', (err as Error).message);
      toast.error('Image generation failed');
    }
  }, [setStatus, setEnhancedPrompt, setVariants, selectVariant, setCost]);

  const runThreeDStage = useCallback(async () => {
    const { generation } = useSceneStore.getState();
    const variant =
      generation.selectedVariantIdx !== null ? generation.variants[generation.selectedVariantIdx] : null;
    if (!variant) {
      toast.error('Pick a variant first');
      return;
    }

    setStatus('generating-3d');
    try {
      const stream = generate3D({
        imageUrl: variant.url,
        tier: generation.tier,
        outputs: ['glb', 'splat'],
      });
      for await (const evt of stream) {
        if (evt.type === 'done') {
          setAssets({ glbUrl: evt.glbUrl ?? null, splatUrl: evt.splatUrl ?? null });
          setCost(generation.costUsd + (evt.costUsd ?? 0));
        } else if (evt.type === 'error') {
          throw new Error(evt.error ?? '3D generation error');
        }
      }
      setStatus('ready');
      toast.success('Scene ready');
    } catch (err) {
      setStatus('error', (err as Error).message);
      toast.error('3D generation failed');
    }
  }, [setStatus, setAssets, setCost]);

  return { runImageStage, runThreeDStage };
};
