import * as RadixDialog from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/cn';

export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;

export const SheetContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, children, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 rounded-t-lg border-t border-border bg-surface-1 backdrop-blur-xl p-4 max-h-[85vh] overflow-y-auto',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full',
        className
      )}
      {...props}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
SheetContent.displayName = 'SheetContent';
