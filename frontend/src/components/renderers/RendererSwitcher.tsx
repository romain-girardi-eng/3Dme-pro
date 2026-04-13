import { useMemo } from 'react';
import { useSceneStore } from '@/stores/sceneStore';
import { SplatRenderer } from './SplatRenderer';
import { UltimateParticles } from '@/components/particles/UltimateParticles';
import { useGlbPointCloud } from '@/hooks/useGlbPointCloud';
import type { Quality } from '@/stores/sceneStore.types';

const QUALITY_TO_TEXTURE_SIZE: Record<Quality, 512 | 1024 | 2048> = {
  low: 512,
  medium: 1024,
  high: 2048,
};

const QUALITY_TO_TARGET_COUNT: Record<Quality, number> = {
  low: 260_000,
  medium: 1_000_000,
  high: 1_900_000,
};

export const RendererSwitcher = () => {
  const mode = useSceneStore((s) => s.scene.mode);
  const splatUrl = useSceneStore((s) => s.generation.splatUrl);
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);
  const look = useSceneStore((s) => s.scene.look);
  const motion = useSceneStore((s) => s.scene.motion);
  const mouse = useSceneStore((s) => s.scene.mouse);

  const textureSize = QUALITY_TO_TEXTURE_SIZE[look.quality];
  const targetCount = QUALITY_TO_TARGET_COUNT[look.quality];

  const { pointCloud, loading, error } = useGlbPointCloud(glbUrl, targetCount);

  const statusBadge = useMemo(() => {
    if (loading) return 'Sampling mesh…';
    if (error) return `Mesh error: ${error.slice(0, 60)}`;
    if (pointCloud) return `${pointCloud.count.toLocaleString()} points from generated mesh`;
    return null;
  }, [loading, error, pointCloud]);

  if (mode === 'splat' && splatUrl) {
    return <SplatRenderer url={splatUrl} className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
      <UltimateParticles
        pointCloud={pointCloud}
        shape={pointCloud ? undefined : look.fallbackShape}
        textureSize={textureSize}
        animationMode={motion.mode}
        animationSpeed={motion.speed}
        returnForce={motion.shapeMemory}
        turbulence={motion.turbulence}
        rotationSpeed={motion.rotationSpeed}
        enableMouse={mouse.enabled}
        mouseForce={mouse.force * (mouse.handTracking ? 1 + mouse.handPinch : 1)}
        mouseRadius={mouse.radius}
        forceMode={mouse.mode}
        particleSize={look.particleSize}
        colorMode={look.colorMode}
        brightness={look.brightness}
        saturation={look.saturation}
        hueShift={look.hueShift}
        shimmerIntensity={look.shimmer}
        customColor={look.customColor}
        enableBloom
        bloomIntensity={look.bloom}
        enableTrails
        trailLength={look.trails}
        className="h-full w-full"
      />
      {statusBadge && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full border border-border-subtle bg-surface-0/70 px-3 py-1 text-2xs font-mono text-white/70 backdrop-blur">
          {statusBadge}
        </div>
      )}
    </div>
  );
};
