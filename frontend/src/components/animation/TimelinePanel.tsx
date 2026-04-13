/**
 * TimelinePanel Component
 *
 * Visual timeline scrubber with time markers.
 */

import { useRef, useCallback, useState, useEffect } from 'react';

interface TimelinePanelProps {
  position: number;
  duration: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
}

export function TimelinePanel({
  position,
  duration,
  onSeek,
  isPlaying,
}: TimelinePanelProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  // Calculate position from mouse event
  const getPositionFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      return (x / rect.width) * duration;
    },
    [duration]
  );

  // Handle mouse down on track
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const newPosition = getPositionFromEvent(e);
      onSeek(newPosition);
    },
    [getPositionFromEvent, onSeek]
  );

  // Handle mouse move for hover preview and dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getPositionFromEvent(e);
      setHoverPosition(pos);
    },
    [getPositionFromEvent]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  // Global mouse move/up for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const newPosition = getPositionFromEvent(e);
      onSeek(newPosition);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, getPositionFromEvent, onSeek]);

  // Progress percentage
  const progressPercent = (position / duration) * 100;
  const hoverPercent = hoverPosition !== null ? (hoverPosition / duration) * 100 : null;

  // Generate time markers
  const markers = [];
  const markerInterval = duration <= 10 ? 1 : duration <= 30 ? 5 : 10;
  for (let t = 0; t <= duration; t += markerInterval) {
    markers.push(t);
  }

  return (
    <div className="space-y-1">
      {/* Timeline track */}
      <div
        ref={trackRef}
        className="relative h-8 bg-white/5 rounded cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500/30 to-orange-500/50 rounded-l"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Hover preview */}
        {hoverPercent !== null && !isDragging && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white/30"
            style={{ left: `${hoverPercent}%` }}
          />
        )}

        {/* Playhead */}
        <div
          className={`absolute top-0 h-full w-1 -translate-x-1/2 transition-colors ${
            isPlaying ? 'bg-orange-500' : 'bg-orange-400'
          }`}
          style={{ left: `${progressPercent}%` }}
        >
          {/* Playhead handle */}
          <div
            className={`absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${
              isPlaying ? 'bg-orange-500 border-orange-300' : 'bg-orange-400 border-orange-200'
            }`}
          />
        </div>

        {/* Time markers */}
        {markers.map((t) => (
          <div
            key={t}
            className="absolute top-0 h-full flex flex-col justify-end"
            style={{ left: `${(t / duration) * 100}%` }}
          >
            <div className="w-px h-2 bg-white/20" />
          </div>
        ))}
      </div>

      {/* Time labels */}
      <div className="relative h-4">
        {markers.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2 text-[9px] text-white/40 font-mono"
            style={{ left: `${(t / duration) * 100}%` }}
          >
            {t}s
          </span>
        ))}
      </div>

      {/* Hover time tooltip */}
      {hoverPosition !== null && (
        <div
          className="absolute -top-6 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-mono pointer-events-none transform -translate-x-1/2"
          style={{ left: `${hoverPercent}%` }}
        >
          {hoverPosition.toFixed(2)}s
        </div>
      )}
    </div>
  );
}

export default TimelinePanel;
