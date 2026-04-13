import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, title, actions, padded = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md bg-surface-1 backdrop-blur-md border border-border-subtle shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]',
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between h-9 px-3 border-b border-border-subtle">
          {title && <h3 className="text-2xs uppercase tracking-wider text-white/50 font-medium">{title}</h3>}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && 'p-3')}>{children}</div>
    </div>
  )
);
Panel.displayName = 'Panel';
