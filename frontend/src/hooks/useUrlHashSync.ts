import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/stores/sceneStore';

export const useUrlHashSync = () => {
  const hydrated = useRef(false);
  const hydrate = useSceneStore((s) => s.hydrateFromHash);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) hydrate(hash);
  }, [hydrate]);
};
