import { useSceneStore } from '@/stores/sceneStore';
import { SplatRenderer } from './SplatRenderer';
import { UltimateParticles } from '@/components/particles/UltimateParticles';

export const RendererSwitcher = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const splatUrl = useSceneStore((s) => s.generation.splatUrl);
  const particles = useSceneStore((s) => s.scene.particles);
  const material = useSceneStore((s) => s.scene.material);

  if (mode === 'splat' && splatUrl) {
    return <SplatRenderer url={splatUrl} className="h-full w-full" />;
  }

  return (
    <UltimateParticles
      shape={particles.shape === 'mesh' ? 'galaxy' : particles.shape}
      particleSize={particles.size}
      brightness={material.brightness}
      saturation={material.saturation}
      hueShift={material.hueShift}
      rotationSpeed={material.rotationSpeed}
      className="h-full w-full"
    />
  );
};
