import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Kbd = ({ className, children, ...props }: HTMLAttributes<HTMLElement>) => (
  <kbd
    className={cn(
      'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm',
      'bg-surface-0 border border-border-subtle text-[10px] font-mono text-white/70',
      className
    )}
    {...props}
  >
    {children}
  </kbd>
);
