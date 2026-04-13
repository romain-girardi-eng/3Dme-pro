/**
 * ExportDialog Component
 *
 * Modal dialog for configuring and executing video exports.
 */

import { useState, useCallback } from 'react';
import { X, Download, Film, Image, FileVideo } from 'lucide-react';
import {
  type ExportOptions,
  estimateFileSize,
  estimateExportTime,
  exportAnimation,
  downloadBlob,
  getFileExtension,
} from '../../utils/videoExport';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  seekFunction: (time: number) => void;
  renderFunction: () => void;
  currentDuration: number;
}

type ExportFormat = 'mp4' | 'webm' | 'gif';
type Resolution = '720p' | '1080p' | '4k';
type FPS = 30 | 60;
type Quality = 'draft' | 'production';

const FORMAT_INFO: Record<ExportFormat, { icon: typeof Film; label: string; description: string }> = {
  mp4: { icon: FileVideo, label: 'MP4', description: 'Universal, best quality' },
  webm: { icon: Film, label: 'WebM', description: 'Web-optimized, smaller' },
  gif: { icon: Image, label: 'GIF', description: 'Animated, social sharing' },
};

export function ExportDialog({
  isOpen,
  onClose,
  canvas,
  seekFunction,
  renderFunction,
  currentDuration,
}: ExportDialogProps) {
  // Export settings
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [fps, setFps] = useState<FPS>(60);
  const [duration, setDuration] = useState(currentDuration);
  const [quality, setQuality] = useState<Quality>('production');

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Build options object
  const options: ExportOptions = { format, resolution, fps, duration, quality };

  // Estimates
  const estimatedSize = estimateFileSize(options);
  const estimatedTime = estimateExportTime(options);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!canvas) {
      setError('Canvas not available');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setStatus('Initializing...');
    setError(null);

    try {
      const blob = await exportAnimation(
        canvas,
        seekFunction,
        renderFunction,
        options,
        (p, s) => {
          setProgress(p);
          setStatus(s);
        }
      );

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `3dme-animation-${timestamp}.${getFileExtension(format)}`;

      // Trigger download
      downloadBlob(blob, filename);
      setStatus('Export complete!');

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setProgress(0);
      }, 1500);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsExporting(false);
    }
  }, [canvas, seekFunction, renderFunction, options, format, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isExporting) {
      // TODO: Implement cancellation
      setIsExporting(false);
      setStatus('Cancelled');
    } else {
      onClose();
    }
  }, [isExporting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-white/10 shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Download size={20} className="text-orange-400" />
            Export Animation
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(FORMAT_INFO) as [ExportFormat, typeof FORMAT_INFO.mp4][]).map(
                ([key, { icon: Icon, label, description }]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    disabled={isExporting}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      format === key
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon
                      size={18}
                      className={format === key ? 'text-orange-400' : 'text-white/60'}
                    />
                    <div className="mt-1.5 text-sm font-medium text-white">{label}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{description}</div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Resolution</label>
            <div className="flex gap-2">
              {(['720p', '1080p', '4k'] as Resolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  disabled={isExporting}
                  className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                    resolution === res
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {res.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Rate */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Frame Rate</label>
            <div className="flex gap-2">
              {([30, 60] as FPS[]).map((rate) => (
                <button
                  key={rate}
                  onClick={() => setFps(rate)}
                  disabled={isExporting}
                  className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                    fps === rate
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {rate} fps
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">
              Duration <span className="text-white/30">(Timeline: {currentDuration}s)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={isExporting}
                className="flex-1 accent-orange-500"
              />
              <div className="w-16 text-right">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(120, Number(e.target.value))))}
                  disabled={isExporting}
                  className="w-full px-2 py-1 rounded bg-white/10 text-white text-sm text-center border border-white/10 focus:border-orange-500 outline-none"
                />
              </div>
              <span className="text-sm text-white/50">sec</span>
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Quality</label>
            <div className="flex gap-2">
              {(['draft', 'production'] as Quality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  disabled={isExporting}
                  className={`flex-1 py-2 rounded text-sm font-medium capitalize transition-colors ${
                    quality === q
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Estimates */}
          <div className="flex justify-between text-sm text-white/50 border-t border-white/10 pt-4">
            <div>
              Estimated size: <span className="text-white">{estimatedSize}</span>
            </div>
            <div>
              Est. time: <span className="text-white">{estimatedTime}</span>
            </div>
          </div>

          {/* Progress bar (when exporting) */}
          {isExporting && (
            <div className="space-y-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="text-xs text-white/60 text-center">{status}</div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/10">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            {isExporting ? 'Cancel' : 'Close'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !canvas}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isExporting || !canvas
                ? 'bg-orange-500/50 text-white/50 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
