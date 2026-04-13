import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-8 px-3 rounded-sm bg-surface-2 border border-border-subtle text-sm text-white placeholder:text-white/30',
        'hover:border-border focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
        'transition-colors duration-fast',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
