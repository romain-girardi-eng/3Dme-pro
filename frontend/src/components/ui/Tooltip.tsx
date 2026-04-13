import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

export const Tooltip = ({ content, side = 'top', children }: TooltipProps) => (
  <RadixTooltip.Root delayDuration={300}>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={6}
        className={cn(
          'z-50 px-2 py-1 rounded-sm bg-surface-0 border border-border text-2xs text-white/90 shadow-xl',
          'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0'
        )}
      >
        {content}
        <RadixTooltip.Arrow className="fill-surface-0" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
);
