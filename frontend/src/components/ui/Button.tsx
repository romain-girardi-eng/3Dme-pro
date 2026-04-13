import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const button = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded transition-colors duration-fast ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 active:bg-brand-primary/80',
        secondary: 'bg-surface-2 text-white border border-border hover:bg-surface-3',
        ghost: 'bg-transparent text-white/80 hover:bg-surface-2 hover:text-white',
        danger: 'bg-signal-danger/90 text-white hover:bg-signal-danger',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, leading, trailing, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(button({ variant, size }), className)} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {leading}
            {children}
            {trailing}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
