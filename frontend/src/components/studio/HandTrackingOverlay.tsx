import { useEffect } from 'react';
import { Hand, Loader2 } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { useHandTracking } from '@/hooks/useHandTracking';
import { cn } from '@/lib/cn';

/**
 * When hand tracking is enabled:
 *  - show a mirrored webcam preview bottom-right
 *  - dispatch synthetic mousemove events on the canvas so UltimateParticles' existing
 *    listener picks up the index-finger position like a real mouse
 *  - pinch strength is written to scene.mouse.handPinch (never to .force) —
 *    RendererSwitcher computes the effective force, so no write-read render loop
 */
export const HandTrackingOverlay = () => {
  const handEnabled = useSceneStore((s) => s.scene.mouse.handTracking);
  const updateMouse = useSceneStore((s) => s.updateMouse);
  const { active, starting, error, cursor, pinch, videoRef } = useHandTracking(handEnabled);

  useEffect(() => {
    if (!handEnabled || !cursor) return;
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + cursor.x * rect.width;
    const clientY = rect.top + cursor.y * rect.height;
    canvas.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
      }),
    );
  }, [cursor, handEnabled]);

  // Push pinch into the store as its own field — renderer reads it additively.
  // Quantize to 0.02 steps so we don't kick a store update on every frame.
  useEffect(() => {
    const next = handEnabled ? Math.round(pinch * 50) / 50 : 0;
    updateMouse({ handPinch: next });
  }, [pinch, handEnabled, updateMouse]);

  if (!handEnabled) return null;

  return (
    <div className="pointer-events-none absolute bottom-16 right-4 z-30 flex flex-col items-end gap-2">
      <div className="pointer-events-auto relative h-36 w-48 overflow-hidden rounded-md border border-border bg-surface-1 shadow-xl">
        <video
          ref={videoRef}
          className="h-full w-full -scale-x-100 object-cover"
          playsInline
          muted
          autoPlay
        />
        {cursor && (
          <div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-primary shadow-[0_0_10px_rgba(139,92,246,0.8)]"
            style={{
              left: `${cursor.x * 100}%`,
              top: `${cursor.y * 100}%`,
            }}
          />
        )}
        <div
          className={cn(
            'absolute left-2 top-2 flex items-center gap-1 rounded-full border border-border-subtle bg-surface-0/70 px-2 py-0.5 text-[10px] font-mono',
            error
              ? 'text-signal-danger'
              : active
                ? 'text-signal-success'
                : starting
                  ? 'text-brand-secondary'
                  : 'text-white/50',
          )}
        >
          {starting ? (
            <>
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> Starting…
            </>
          ) : error ? (
            <>ERR</>
          ) : active ? (
            <>
              <Hand className="h-2.5 w-2.5" /> Tracking
            </>
          ) : (
            'Off'
          )}
        </div>
        {cursor && (
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-1 text-[10px] font-mono text-white/70">
            <span>PINCH</span>
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-[width] duration-fast"
                style={{ width: `${pinch * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="pointer-events-auto max-w-[192px] rounded-sm border border-signal-danger/30 bg-signal-danger/10 px-2 py-1 text-right text-2xs text-signal-danger">
          {error}
        </div>
      )}
    </div>
  );
};
