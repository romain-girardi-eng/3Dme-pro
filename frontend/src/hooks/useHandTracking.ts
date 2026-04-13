import { useEffect, useRef, useState } from 'react';

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandTrackingState {
  active: boolean;
  starting: boolean;
  error: string | null;
  /** Index-finger tip in normalized viewport coords (0..1), null when not detected. */
  cursor: { x: number; y: number } | null;
  /** 0..1 pinch strength (index-thumb distance inverted). */
  pinch: number;
  /** DOM element you can attach to a <video /> to show the webcam feed. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// Dynamic import keeps tasks-vision + wasm out of the main bundle.
const loadHandLandmarker = async () => {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm',
  );
  return vision.HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
};

type HandLandmarker = Awaited<ReturnType<typeof loadHandLandmarker>>;

export const useHandTracking = (enabled: boolean): HandTrackingState => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(-1);
  const [starting, setStarting] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pinch, setPinch] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setStarting(true);
    setError(null);

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error('video element not mounted');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();

        const landmarker = await loadHandLandmarker();
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setStarting(false);
        setActive(true);

        const loop = () => {
          if (cancelled || !landmarkerRef.current || !videoRef.current) return;
          const v = videoRef.current;
          if (v.readyState >= 2 && v.currentTime !== lastTsRef.current) {
            lastTsRef.current = v.currentTime;
            const result = landmarkerRef.current.detectForVideo(v, performance.now());
            const hand = result.landmarks?.[0] as NormalizedLandmark[] | undefined;
            if (hand && hand.length >= 9) {
              // Mirror x (selfie view) so moving hand right moves cursor right.
              const idx = hand[8];
              setCursor({ x: 1 - idx.x, y: idx.y });
              const thumb = hand[4];
              const dx = idx.x - thumb.x;
              const dy = idx.y - thumb.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              // dist typically 0.02 (pinched) to 0.25 (open)
              const normalized = Math.max(0, Math.min(1, 1 - dist / 0.2));
              setPinch(normalized);
            } else {
              setCursor(null);
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        if (cancelled) return;
        setStarting(false);
        setActive(false);
        setError((err as Error).message);
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setActive(false);
      setStarting(false);
      setCursor(null);
      setPinch(0);
    };
  }, [enabled]);

  return { active, starting, error, cursor, pinch, videoRef };
};
