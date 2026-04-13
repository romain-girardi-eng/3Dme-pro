import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[72px] p-3 rounded-sm bg-surface-2 border border-border-subtle text-sm text-white placeholder:text-white/30 resize-y',
        'hover:border-border focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
        'transition-colors duration-fast',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
