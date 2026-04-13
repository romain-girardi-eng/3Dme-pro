/**
 * PlaybackControls Component
 *
 * Play/pause/stop controls for animation timeline.
 */

import { Play, Pause, Square, SkipBack, SkipForward, Repeat } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  position: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSetDuration: (duration: number) => void;
  isLooping?: boolean;
  onToggleLoop?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function PlaybackControls({
  isPlaying,
  position,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSetDuration,
  isLooping = true,
  onToggleLoop,
}: PlaybackControlsProps) {
  return (
    <div className="space-y-2">
      {/* Main controls row */}
      <div className="flex items-center gap-2">
        {/* Skip to start */}
        <button
          onClick={() => onSeek(0)}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="Go to start"
        >
          <SkipBack size={16} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className={`p-2 rounded-full transition-colors ${
            isPlaying
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        {/* Stop */}
        <button
          onClick={onStop}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="Stop"
        >
          <Square size={16} />
        </button>

        {/* Skip to end */}
        <button
          onClick={() => onSeek(duration)}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="Go to end"
        >
          <SkipForward size={16} />
        </button>

        {/* Loop toggle */}
        {onToggleLoop && (
          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded transition-colors ${
              isLooping
                ? 'bg-orange-500/30 text-orange-400'
                : 'hover:bg-white/10 text-white/50'
            }`}
            title={isLooping ? 'Loop enabled' : 'Loop disabled'}
          >
            <Repeat size={16} />
          </button>
        )}

        {/* Time display */}
        <div className="flex-1 text-right">
          <span className="font-mono text-xs text-white/70">
            {formatTime(position)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Duration control */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-white/50 uppercase">Duration:</label>
        <div className="flex items-center gap-1">
          {[5, 10, 15, 30].map((d) => (
            <button
              key={d}
              onClick={() => onSetDuration(d)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                duration === d
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {d}s
            </button>
          ))}
          <input
            type="number"
            value={duration}
            onChange={(e) => onSetDuration(Math.max(1, parseFloat(e.target.value) || 10))}
            className="w-12 px-1 py-0.5 rounded bg-white/10 text-white text-[10px] text-center border border-white/10 focus:border-orange-500 outline-none"
            min={1}
            max={120}
          />
        </div>
      </div>
    </div>
  );
}

export default PlaybackControls;
