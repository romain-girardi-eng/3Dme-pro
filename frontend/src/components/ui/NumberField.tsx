import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/cn';

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const NumberField = ({
  value,
  onChange,
  label,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix,
  className,
}: NumberFieldProps) => {
  const [draft, setDraft] = useState(String(value));
  const scrubbing = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(value);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    onChange(clamp(parsed, min, max));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit(draft);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setDraft(String(value));
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(clamp(value + step * (e.shiftKey ? 10 : 1), min, max));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(clamp(value - step * (e.shiftKey ? 10 : 1), min, max));
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLLabelElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    scrubbing.current = true;
    startX.current = e.clientX;
    startValue.current = value;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLLabelElement>) => {
    if (!scrubbing.current) return;
    const dx = e.clientX - startX.current;
    const next = startValue.current + Math.round(dx) * step;
    onChange(clamp(next, min, max));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLLabelElement>) => {
    scrubbing.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <label
      className={cn(
        'group flex items-center gap-2 h-7 px-2 rounded-sm bg-surface-2 border border-border-subtle hover:border-border cursor-ew-resize select-none',
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span className="text-2xs uppercase tracking-wider text-white/40 font-mono">{label}</span>
      <input
        aria-label={label}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent text-right text-sm font-mono tabular-nums text-white outline-none cursor-text"
      />
      {suffix && <span className="text-2xs font-mono text-white/40">{suffix}</span>}
    </label>
  );
};
