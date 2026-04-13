/**
 * Video Export Utility
 *
 * Exports canvas animations as MP4, WebM, or GIF using:
 * - MediaRecorder API for frame capture
 * - ffmpeg.wasm for post-processing
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

// Export options
export interface ExportOptions {
  format: 'mp4' | 'webm' | 'gif';
  resolution: '720p' | '1080p' | '4k';
  fps: 30 | 60;
  duration: number;
  quality: 'draft' | 'production';
}

// Resolution presets
const RESOLUTIONS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
};

// Bitrate presets (bits per second)
const BITRATES = {
  draft: {
    '720p': 2_000_000,
    '1080p': 4_000_000,
    '4k': 8_000_000,
  },
  production: {
    '720p': 5_000_000,
    '1080p': 10_000_000,
    '4k': 25_000_000,
  },
};

// Progress callback type
export type ProgressCallback = (progress: number, status: string) => void;

// FFmpeg instance (singleton for reuse)
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) {
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();

  // Load FFmpeg with CORS-enabled URLs
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegLoaded = true;
  return ffmpegInstance;
}

/**
 * Export animation as video
 */
export async function exportAnimation(
  canvas: HTMLCanvasElement,
  seekFunction: (time: number) => void,
  renderFunction: () => void,
  options: ExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const { format, resolution, fps, duration, quality } = options;
  const { width, height } = RESOLUTIONS[resolution];
  const bitrate = BITRATES[quality][resolution];
  const totalFrames = Math.ceil(duration * fps);

  onProgress?.(0, 'Initializing recorder...');

  // Resize canvas to target resolution
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  canvas.width = width;
  canvas.height = height;

  try {
    // For WebM, use MediaRecorder directly
    if (format === 'webm') {
      return await exportWebM(canvas, seekFunction, renderFunction, {
        fps,
        duration,
        totalFrames,
        bitrate,
        width,
        height,
        onProgress,
      });
    }

    // For MP4 and GIF, capture as WebM then convert with ffmpeg
    const webmBlob = await exportWebM(canvas, seekFunction, renderFunction, {
      fps,
      duration,
      totalFrames,
      bitrate,
      width,
      height,
      onProgress: (p, s) => onProgress?.(p * 0.7, s), // 70% for capture
    });

    onProgress?.(0.7, 'Loading FFmpeg...');
    const ffmpeg = await getFFmpeg();

    onProgress?.(0.75, 'Converting video...');

    // Write input file
    const inputData = new Uint8Array(await webmBlob.arrayBuffer());
    await ffmpeg.writeFile('input.webm', inputData);

    if (format === 'gif') {
      // High-quality GIF with palette generation
      onProgress?.(0.8, 'Generating GIF palette...');

      // Generate palette
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-vf', `fps=${Math.min(fps, 15)},scale=${Math.min(width, 480)}:-1:flags=lanczos,palettegen`,
        '-y', 'palette.png',
      ]);

      onProgress?.(0.9, 'Creating GIF...');

      // Create GIF with palette
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-i', 'palette.png',
        '-lavfi', `fps=${Math.min(fps, 15)},scale=${Math.min(width, 480)}:-1:flags=lanczos [x]; [x][1:v] paletteuse`,
        '-loop', '0',
        '-y', 'output.gif',
      ]);

      const data = await ffmpeg.readFile('output.gif');
      onProgress?.(1, 'GIF export complete');
      // Handle FileData type from FFmpeg (can be Uint8Array or string)
      if (typeof data === 'string') {
        return new Blob([data], { type: 'image/gif' });
      }
      // Type assertion for FFmpeg's Uint8Array
      return new Blob([data as unknown as BlobPart], { type: 'image/gif' });
    }

    // MP4 conversion
    onProgress?.(0.8, 'Encoding MP4...');

    await ffmpeg.exec([
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-preset', quality === 'draft' ? 'ultrafast' : 'medium',
      '-crf', quality === 'draft' ? '28' : '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-y', 'output.mp4',
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    onProgress?.(1, 'MP4 export complete');
    // Handle FileData type from FFmpeg (can be Uint8Array or string)
    if (typeof data === 'string') {
      return new Blob([data], { type: 'video/mp4' });
    }
    // Type assertion for FFmpeg's Uint8Array
    return new Blob([data as unknown as BlobPart], { type: 'video/mp4' });

  } finally {
    // Restore original canvas size
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    renderFunction(); // Re-render at original size
  }
}

/**
 * Export as WebM using MediaRecorder
 */
async function exportWebM(
  canvas: HTMLCanvasElement,
  seekFunction: (time: number) => void,
  renderFunction: () => void,
  config: {
    fps: number;
    duration: number;
    totalFrames: number;
    bitrate: number;
    width: number;
    height: number;
    onProgress?: ProgressCallback;
  }
): Promise<Blob> {
  const { fps, totalFrames, bitrate, onProgress } = config;

  // Get canvas stream
  const stream = canvas.captureStream(fps);

  // Create MediaRecorder
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrate,
  });

  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Start recording
  mediaRecorder.start();

  // Capture each frame
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;

    // Seek to position
    seekFunction(time);

    // Render frame
    renderFunction();

    // Wait for next animation frame to ensure render is complete
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // Report progress
    onProgress?.((frame + 1) / totalFrames, `Capturing frame ${frame + 1}/${totalFrames}`);
  }

  // Stop and get blob
  return new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    mediaRecorder.stop();
  });
}

/**
 * Estimate file size for given options
 */
export function estimateFileSize(options: ExportOptions): string {
  const { format, resolution, fps, duration, quality } = options;
  const bitrate = BITRATES[quality][resolution];

  let sizeBytes: number;

  if (format === 'gif') {
    // GIF is roughly 2-4 MB per second at 480p
    const scale = RESOLUTIONS[resolution].width <= 480 ? 1 : RESOLUTIONS[resolution].width / 480;
    sizeBytes = duration * 3 * 1024 * 1024 * scale * (fps / 15);
  } else {
    // Video: bitrate * duration / 8 (bits to bytes)
    sizeBytes = (bitrate * duration) / 8;
  }

  if (sizeBytes < 1024 * 1024) {
    return `~${(sizeBytes / 1024).toFixed(0)} KB`;
  }
  return `~${(sizeBytes / (1024 * 1024)).toFixed(0)} MB`;
}

/**
 * Estimate export time
 */
export function estimateExportTime(options: ExportOptions): string {
  const { format, resolution, fps, duration, quality } = options;
  const totalFrames = duration * fps;

  // Base time: ~50ms per frame for capture
  let captureTime = totalFrames * 0.05;

  // Post-processing time
  let processTime = 0;
  if (format === 'gif') {
    processTime = duration * 2; // GIF is slow
  } else if (format === 'mp4') {
    processTime = duration * (quality === 'production' ? 1 : 0.3);
  }

  // 4K takes longer
  if (resolution === '4k') {
    captureTime *= 2;
    processTime *= 1.5;
  }

  const totalSeconds = captureTime + processTime;

  if (totalSeconds < 60) {
    return `~${Math.ceil(totalSeconds)} seconds`;
  }
  return `~${Math.ceil(totalSeconds / 60)} minutes`;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportOptions['format']): string {
  return format;
}
