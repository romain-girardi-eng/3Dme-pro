import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from './useKeyboardShortcut';

const fire = (init: KeyboardEventInit) => {
  window.dispatchEvent(new KeyboardEvent('keydown', init));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useKeyboardShortcut', () => {
  it('calls handler on exact key match', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('g', fn));
    fire({ key: 'g' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('ignores modifiers unless requested', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('g', fn));
    fire({ key: 'g', metaKey: true });
    expect(fn).not.toHaveBeenCalled();
  });

  it('matches meta+key when requested', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('k', fn, { meta: true }));
    fire({ key: 'k', metaKey: true });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('skips when target is input', () => {
    const fn = vi.fn();
    renderHook(() => useKeyboardShortcut('g', fn));
    const input = document.createElement('input');
    document.body.appendChild(input);
    const evt = new KeyboardEvent('keydown', { key: 'g', bubbles: true });
    Object.defineProperty(evt, 'target', { value: input });
    window.dispatchEvent(evt);
    expect(fn).not.toHaveBeenCalled();
    input.remove();
  });
});
