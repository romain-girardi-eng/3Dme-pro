/**
 * useTheatreAnimation Hook
 *
 * React hook for integrating Theatre.js animations with the particle system.
 * Provides reactive animation values and playback controls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  mainSheet,
  playSequence,
  pauseSequence,
  seekSequence,
  getSequencePosition,
  initializeStudio,
} from './theatreProject';
import { DEFAULT_ANIMATION_VALUES, type AnimationValues, type PlaybackState } from './types';
import { types } from '@theatre/core';

export interface UseTheatreAnimationReturn {
  // Current animated values
  values: AnimationValues;

  // Playback state
  playback: PlaybackState;

  // Playback controls
  play: (options?: { rate?: number; range?: [number, number] }) => Promise<boolean>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setDuration: (duration: number) => void;

  // Value controls (for manual override / recording)
  setValue: (key: keyof AnimationValues, value: number) => void;
  setValues: (values: Partial<AnimationValues>) => void;
  resetValues: () => void;

  // Keyframe controls
  addKeyframe: (property: keyof AnimationValues, time: number, value: number) => void;
  removeKeyframe: (property: keyof AnimationValues, time: number) => void;

  // Import/Export
  exportAnimation: () => string;
  importAnimation: (json: string) => boolean;

  // Studio
  isStudioReady: boolean;
  openStudio: () => void;
}

export function useTheatreAnimation(): UseTheatreAnimationReturn {
  // Animation values state
  const [values, setValuesState] = useState<AnimationValues>(DEFAULT_ANIMATION_VALUES);

  // Playback state
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 10, // Default 10 second timeline
  });

  // Studio state
  const [isStudioReady, setIsStudioReady] = useState(false);

  // Animation frame ref for position updates
  const animationFrameRef = useRef<number | null>(null);
  const lastPositionRef = useRef<number>(0);

  // Theatre.js object for direct manipulation
  const objectRef = useRef<any>(null);

  // Initialize Theatre.js and create animatable object
  useEffect(() => {
    // Create the animatable object with all properties
    const obj = mainSheet.object('ParticleSystem', {
      transform: types.compound({
        rotationX: types.number(DEFAULT_ANIMATION_VALUES.rotationX, { range: [-Math.PI, Math.PI] }),
        rotationY: types.number(DEFAULT_ANIMATION_VALUES.rotationY, { range: [-Math.PI, Math.PI] }),
        rotationZ: types.number(DEFAULT_ANIMATION_VALUES.rotationZ, { range: [-Math.PI, Math.PI] }),
        scale: types.number(DEFAULT_ANIMATION_VALUES.scale, { range: [0.1, 5] }),
      }),
      animation: types.compound({
        mode: types.number(DEFAULT_ANIMATION_VALUES.animationMode, { range: [0, 7] }),
        speed: types.number(DEFAULT_ANIMATION_VALUES.animationSpeed, { range: [0, 3] }),
        intensity: types.number(DEFAULT_ANIMATION_VALUES.animationIntensity, { range: [0, 2] }),
      }),
      visual: types.compound({
        brightness: types.number(DEFAULT_ANIMATION_VALUES.brightness, { range: [0, 2] }),
        saturation: types.number(DEFAULT_ANIMATION_VALUES.saturation, { range: [0, 2] }),
        hueShift: types.number(DEFAULT_ANIMATION_VALUES.hueShift, { range: [0, 360] }),
        sharpness: types.number(DEFAULT_ANIMATION_VALUES.particleSharpness, { range: [0, 1] }),
      }),
      effects: types.compound({
        bloom: types.number(DEFAULT_ANIMATION_VALUES.bloomIntensity, { range: [0, 2] }),
        breathing: types.number(DEFAULT_ANIMATION_VALUES.breathingIntensity, { range: [0, 2] }),
        shimmer: types.number(DEFAULT_ANIMATION_VALUES.shimmerIntensity, { range: [0, 1] }),
      }),
      physics: types.compound({
        friction: types.number(DEFAULT_ANIMATION_VALUES.friction, { range: [0.9, 0.999] }),
        returnForce: types.number(DEFAULT_ANIMATION_VALUES.returnForce, { range: [0, 0.1] }),
        gravity: types.number(DEFAULT_ANIMATION_VALUES.gravity, { range: [-1, 1] }),
        turbulence: types.number(DEFAULT_ANIMATION_VALUES.turbulence, { range: [0, 1] }),
      }),
      camera: types.compound({
        x: types.number(DEFAULT_ANIMATION_VALUES.cameraX, { range: [-500, 500] }),
        y: types.number(DEFAULT_ANIMATION_VALUES.cameraY, { range: [-500, 500] }),
        z: types.number(DEFAULT_ANIMATION_VALUES.cameraZ, { range: [10, 1000] }),
        fov: types.number(DEFAULT_ANIMATION_VALUES.cameraFOV, { range: [20, 120] }),
      }),
    });

    objectRef.current = obj;

    // Subscribe to value changes
    const unsubscribe = obj.onValuesChange((newValues: any) => {
      setValuesState({
        rotationX: newValues.transform.rotationX,
        rotationY: newValues.transform.rotationY,
        rotationZ: newValues.transform.rotationZ,
        scale: newValues.transform.scale,
        animationMode: newValues.animation.mode,
        animationSpeed: newValues.animation.speed,
        animationIntensity: newValues.animation.intensity,
        brightness: newValues.visual.brightness,
        saturation: newValues.visual.saturation,
        hueShift: newValues.visual.hueShift,
        particleSharpness: newValues.visual.sharpness,
        bloomIntensity: newValues.effects.bloom,
        breathingIntensity: newValues.effects.breathing,
        shimmerIntensity: newValues.effects.shimmer,
        friction: newValues.physics.friction,
        returnForce: newValues.physics.returnForce,
        gravity: newValues.physics.gravity,
        turbulence: newValues.physics.turbulence,
        cameraX: newValues.camera.x,
        cameraY: newValues.camera.y,
        cameraZ: newValues.camera.z,
        cameraFOV: newValues.camera.fov,
      });
    });

    // Initialize Studio in dev mode
    if (import.meta.env.DEV) {
      initializeStudio().then(() => {
        setIsStudioReady(true);
      });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Track playback position
  useEffect(() => {
    const updatePosition = () => {
      const currentPosition = getSequencePosition();
      if (currentPosition !== lastPositionRef.current) {
        lastPositionRef.current = currentPosition;
        setPlayback(prev => ({ ...prev, position: currentPosition }));
      }

      if (playback.isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updatePosition);
      }
    };

    if (playback.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playback.isPlaying]);

  // Playback controls
  const play = useCallback(async (options?: { rate?: number; range?: [number, number] }) => {
    setPlayback(prev => ({ ...prev, isPlaying: true }));
    const result = await playSequence({
      rate: options?.rate,
      range: options?.range,
      iterationCount: Infinity, // Loop by default
      direction: 'normal',
    });
    setPlayback(prev => ({ ...prev, isPlaying: false }));
    return result;
  }, []);

  const pause = useCallback(() => {
    pauseSequence();
    setPlayback(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stop = useCallback(() => {
    pauseSequence();
    seekSequence(0);
    setPlayback(prev => ({ ...prev, isPlaying: false, position: 0 }));
  }, []);

  const seek = useCallback((time: number) => {
    seekSequence(time);
    setPlayback(prev => ({ ...prev, position: time }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setPlayback(prev => ({ ...prev, duration }));
  }, []);

  // Value controls
  const setValue = useCallback((key: keyof AnimationValues, value: number) => {
    // Map flat key to Theatre.js nested structure
    // This updates the value immediately (useful for recording)
    setValuesState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setMultipleValues = useCallback((newValues: Partial<AnimationValues>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const resetValues = useCallback(() => {
    setValuesState(DEFAULT_ANIMATION_VALUES);
    seek(0);
  }, [seek]);

  // Keyframe controls (simplified - Theatre.js handles this internally via Studio)
  const addKeyframe = useCallback((_property: keyof AnimationValues, _time: number, _value: number) => {
    // Theatre.js Studio handles keyframe creation via its UI
    // For programmatic keyframes, we'd need to use the experimental API
    console.log('Keyframe creation requires Theatre.js Studio');
  }, []);

  const removeKeyframe = useCallback((_property: keyof AnimationValues, _time: number) => {
    console.log('Keyframe removal requires Theatre.js Studio');
  }, []);

  // Import/Export
  const exportAnimation = useCallback((): string => {
    // Theatre.js state is managed internally
    // For full export, we need Studio's createContentOfSaveFile()
    const state = {
      version: '1.0',
      duration: playback.duration,
      // Add any custom state here
    };
    return JSON.stringify(state, null, 2);
  }, [playback.duration]);

  const importAnimation = useCallback((json: string): boolean => {
    try {
      const state = JSON.parse(json);
      if (state.duration) {
        setDuration(state.duration);
      }
      return true;
    } catch (e) {
      console.error('Failed to import animation:', e);
      return false;
    }
  }, [setDuration]);

  // Open Studio panel
  const openStudio = useCallback(() => {
    if (import.meta.env.DEV && isStudioReady) {
      // Theatre.js Studio is already visible when initialized
      console.log('Theatre.js Studio is active - use the UI overlay to edit keyframes');
    }
  }, [isStudioReady]);

  return {
    values,
    playback,
    play,
    pause,
    stop,
    seek,
    setDuration,
    setValue,
    setValues: setMultipleValues,
    resetValues,
    addKeyframe,
    removeKeyframe,
    exportAnimation,
    importAnimation,
    isStudioReady,
    openStudio,
  };
}

export default useTheatreAnimation;
