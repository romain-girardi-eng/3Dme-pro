import * as RadixSlider from '@radix-ui/react-slider';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/cn';

export const Slider = forwardRef<
  ElementRef<typeof RadixSlider.Root>,
  ComponentPropsWithoutRef<typeof RadixSlider.Root>
>(({ className, ...props }, ref) => (
  <RadixSlider.Root
    ref={ref}
    className={cn('relative flex items-center select-none touch-none w-full h-5', className)}
    {...props}
  >
    <RadixSlider.Track className="relative grow h-1 rounded-full bg-surface-2">
      <RadixSlider.Range className="absolute h-full rounded-full bg-brand-primary" />
    </RadixSlider.Track>
    <RadixSlider.Thumb
      className="block h-3.5 w-3.5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 hover:scale-110 transition-transform duration-fast"
      aria-label="value"
    />
  </RadixSlider.Root>
));
Slider.displayName = 'Slider';
