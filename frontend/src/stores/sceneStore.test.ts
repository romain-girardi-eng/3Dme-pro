import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore, DEFAULT_SCENE_STATE } from './sceneStore';

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState(DEFAULT_SCENE_STATE);
  });

  it('initializes with sensible defaults', () => {
    const s = useSceneStore.getState();
    expect(s.generation.glbUrl).toBeTruthy();
    expect(s.scene.mode).toBe('particles');
    expect(s.scene.look.quality).toBe('medium');
    expect(s.scene.motion.shapeMemory).toBeGreaterThan(0.5);
    expect(s.scene.mouse.enabled).toBe(true);
    expect(s.scene.mouse.force).toBeLessThan(0.5);
  });

  it('setPrompt updates prompt', () => {
    useSceneStore.getState().setPrompt('a cat');
    expect(useSceneStore.getState().generation.prompt).toBe('a cat');
  });

  it('updateLook patches look config', () => {
    useSceneStore.getState().updateLook({ brightness: 1.5, saturation: 0.8 });
    const l = useSceneStore.getState().scene.look;
    expect(l.brightness).toBe(1.5);
    expect(l.saturation).toBe(0.8);
  });

  it('updateMotion patches motion config', () => {
    useSceneStore.getState().updateMotion({ shapeMemory: 0.5 });
    expect(useSceneStore.getState().scene.motion.shapeMemory).toBe(0.5);
  });

  it('updateMouse patches mouse config', () => {
    useSceneStore.getState().updateMouse({ force: 0.9, mode: 'attract' });
    const m = useSceneStore.getState().scene.mouse;
    expect(m.force).toBe(0.9);
    expect(m.mode).toBe('attract');
  });

  it('setMode switches render mode', () => {
    useSceneStore.getState().setMode('splat');
    expect(useSceneStore.getState().scene.mode).toBe('splat');
  });

  it('toHash() and hydrateFromHash() round-trip scene state', () => {
    const s = useSceneStore.getState();
    s.setPrompt('roundtrip');
    s.updateLook({ brightness: 1.42 });
    s.setMode('splat');
    const hash = s.toHash();
    useSceneStore.setState(DEFAULT_SCENE_STATE);
    expect(useSceneStore.getState().generation.prompt).not.toBe('roundtrip');
    const ok = useSceneStore.getState().hydrateFromHash(hash);
    expect(ok).toBe(true);
    const after = useSceneStore.getState();
    expect(after.generation.prompt).toBe('roundtrip');
    expect(after.scene.look.brightness).toBe(1.42);
    expect(after.scene.mode).toBe('splat');
  });

  it('hydrateFromHash returns false for invalid hash', () => {
    expect(useSceneStore.getState().hydrateFromHash('xxx')).toBe(false);
  });

  it('resetScene restores defaults', () => {
    useSceneStore.getState().setPrompt('x');
    useSceneStore.getState().updateLook({ brightness: 0 });
    useSceneStore.getState().resetScene();
    expect(useSceneStore.getState().generation.glbUrl).toBeTruthy();
    expect(useSceneStore.getState().scene.look.brightness).toBeCloseTo(0.85);
  });
});
