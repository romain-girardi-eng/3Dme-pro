import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '@/lib/cn';

export interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  format?: (v: number) => string;
  className?: string;
}

const defaultFormat = (v: number): string => {
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(2).replace(/\.?0+$/, '');
};

export const SliderField = ({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  suffix,
  format = defaultFormat,
  className,
}: SliderFieldProps) => (
  <div className={cn('space-y-1.5', className)}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-2xs font-mono uppercase tracking-wider text-white/45">{label}</span>
      <span className="font-mono text-xs tabular-nums text-white/80">
        {format(value)}
        {suffix && <span className="ml-0.5 text-white/40">{suffix}</span>}
      </span>
    </div>
    <RadixSlider.Root
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
      className="relative flex h-4 w-full touch-none select-none items-center"
      aria-label={label}
    >
      <RadixSlider.Track className="relative h-1 grow overflow-hidden rounded-full bg-surface-2">
        <RadixSlider.Range className="absolute h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="block h-3 w-3 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.7)] transition-transform duration-fast hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60"
      />
    </RadixSlider.Root>
  </div>
);
