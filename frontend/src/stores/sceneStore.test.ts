import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore, DEFAULT_SCENE_STATE } from './sceneStore';

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState(DEFAULT_SCENE_STATE);
  });

  it('initializes with defaults', () => {
    const s = useSceneStore.getState();
    expect(s.generation.prompt).toBe('');
    expect(s.scene.mode).toBe('particles');
    expect(s.scene.particles.count).toBeGreaterThan(0);
  });

  it('setPrompt updates prompt', () => {
    useSceneStore.getState().setPrompt('a cat');
    expect(useSceneStore.getState().generation.prompt).toBe('a cat');
  });

  it('updateParticles patches particle config', () => {
    useSceneStore.getState().updateParticles({ count: 100000, size: 3 });
    const p = useSceneStore.getState().scene.particles;
    expect(p.count).toBe(100000);
    expect(p.size).toBe(3);
  });

  it('setMode switches render mode', () => {
    useSceneStore.getState().setMode('splat');
    expect(useSceneStore.getState().scene.mode).toBe('splat');
  });

  it('toHash() and hydrateFromHash() round-trip scene state', () => {
    const s = useSceneStore.getState();
    s.setPrompt('roundtrip');
    s.updateParticles({ count: 42000 });
    s.setMode('splat');
    const hash = s.toHash();
    useSceneStore.setState(DEFAULT_SCENE_STATE);
    expect(useSceneStore.getState().generation.prompt).toBe('');
    const ok = useSceneStore.getState().hydrateFromHash(hash);
    expect(ok).toBe(true);
    const after = useSceneStore.getState();
    expect(after.generation.prompt).toBe('roundtrip');
    expect(after.scene.particles.count).toBe(42000);
    expect(after.scene.mode).toBe('splat');
  });

  it('hydrateFromHash returns false for invalid hash', () => {
    expect(useSceneStore.getState().hydrateFromHash('xxx')).toBe(false);
  });

  it('resetScene restores defaults', () => {
    useSceneStore.getState().setPrompt('x');
    useSceneStore.getState().resetScene();
    expect(useSceneStore.getState().generation.prompt).toBe('');
  });
});
