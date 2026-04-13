import * as RadixTabs from '@radix-ui/react-tabs';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/cn';

export const Tabs = RadixTabs.Root;

export const TabsList = forwardRef<
  ElementRef<typeof RadixTabs.List>,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn('flex items-center gap-0.5 p-1 bg-surface-2 rounded', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  ElementRef<typeof RadixTabs.Trigger>,
  ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center h-7 px-3 text-xs font-medium rounded-sm transition-colors duration-fast',
      'text-white/60 hover:text-white/90',
      'data-[state=active]:bg-surface-0 data-[state=active]:text-white data-[state=active]:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  ElementRef<typeof RadixTabs.Content>,
  ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn('focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
