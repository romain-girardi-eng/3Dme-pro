import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full h-8 px-2 rounded-sm bg-surface-2 border border-border-subtle text-sm text-white',
        'hover:border-border focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
        'transition-colors duration-fast cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
