import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/stores/sceneStore';

export const useAudioReactive = () => {
  const audio = useSceneStore((s) => s.scene.audio);
  const setLevels = useSceneStore((s) => s.setAudioLevels);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audio.enabled) return;

    let cancelled = false;
    const start = async () => {
      try {
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyserRef.current = analyser;

        if (audio.source === 'mic') {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const src = ctx.createMediaStreamSource(stream);
          src.connect(analyser);
          sourceRef.current = src;
        }

        const buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(buf);
          const avg = (from: number, to: number) => {
            let sum = 0;
            for (let i = from; i < to; i++) sum += buf[i];
            return sum / (to - from) / 255;
          };
          const bass = avg(0, 16) * audio.sensitivity * 2;
          const mid = avg(16, 128) * audio.sensitivity * 2;
          const treble = avg(128, 384) * audio.sensitivity * 2;
          setLevels({ bass, mid, treble });
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn('[3Dme] audio init failed', err);
      }
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      void ctxRef.current?.close();
      ctxRef.current = null;
      setLevels({ bass: 0, mid: 0, treble: 0 });
    };
  }, [audio.enabled, audio.source, audio.sensitivity, setLevels]);
};
