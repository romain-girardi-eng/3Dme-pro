import { useEffect } from 'react';
import { useSceneStore } from '@/stores/sceneStore';
import { RendererSwitcher } from '@/components/renderers/RendererSwitcher';

export default function EmbedPage() {
  const hydrate = useSceneStore((s) => s.hydrateFromHash);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) hydrate(hash);
  }, [hydrate]);

  return (
    <div className="fixed inset-0 bg-surface-0">
      <RendererSwitcher />
    </div>
  );
}
