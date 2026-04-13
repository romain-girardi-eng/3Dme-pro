import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSceneStore, DEFAULT_SCENE_STATE } from '@/stores/sceneStore';
import { useUrlHashSync } from './useUrlHashSync';

describe('useUrlHashSync', () => {
  beforeEach(() => {
    useSceneStore.setState(DEFAULT_SCENE_STATE);
    window.location.hash = '';
  });

  it('hydrates from initial hash', () => {
    useSceneStore.getState().setPrompt('seeded');
    const hash = useSceneStore.getState().toHash();
    useSceneStore.setState(DEFAULT_SCENE_STATE);
    window.location.hash = `#${hash}`;
    renderHook(() => useUrlHashSync());
    expect(useSceneStore.getState().generation.prompt).toBe('seeded');
  });

  it('ignores empty hash', () => {
    window.location.hash = '';
    renderHook(() => useUrlHashSync());
    expect(useSceneStore.getState().generation.prompt).toBe('');
  });
});
