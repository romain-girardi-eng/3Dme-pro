import * as RadixDialog from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content> & { title?: ReactNode; description?: ReactNode }
>(({ className, children, title, description, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'rounded-md bg-surface-1 backdrop-blur-xl border border-border shadow-2xl',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <header className="p-5 border-b border-border-subtle">
          {title && <RadixDialog.Title className="text-lg font-semibold text-white">{title}</RadixDialog.Title>}
          {description && <RadixDialog.Description className="text-sm text-white/60 mt-1">{description}</RadixDialog.Description>}
        </header>
      )}
      <div className="p-5">{children}</div>
      <RadixDialog.Close className="absolute top-3 right-3 text-white/50 hover:text-white">
        <X className="w-4 h-4" />
        <span className="sr-only">Close</span>
      </RadixDialog.Close>
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
DialogContent.displayName = 'DialogContent';
