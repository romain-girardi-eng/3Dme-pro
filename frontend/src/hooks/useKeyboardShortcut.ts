import { useEffect, useRef } from 'react';

export interface ShortcutOptions {
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  allowInInput?: boolean;
}

export const useKeyboardShortcut = (
  key: string,
  handler: (e: KeyboardEvent) => void,
  opts: ShortcutOptions = {}
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (Boolean(opts.meta) !== e.metaKey) return;
      if (Boolean(opts.ctrl) !== e.ctrlKey) return;
      if (opts.shift !== undefined && Boolean(opts.shift) !== e.shiftKey) return;
      if (opts.alt !== undefined && Boolean(opts.alt) !== e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!opts.allowInInput && target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      handlerRef.current(e);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, opts.meta, opts.ctrl, opts.shift, opts.alt, opts.allowInInput]);
};
