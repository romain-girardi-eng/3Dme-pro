import { RendererSwitcher } from '@/components/renderers/RendererSwitcher';
import { GizmoOverlay } from './GizmoOverlay';
import { EmptyState } from './EmptyState';

export const CanvasViewport = () => (
  <div className="relative flex-1 bg-surface-0 overflow-hidden">
    <RendererSwitcher />
    <GizmoOverlay />
    <EmptyState />
  </div>
);
