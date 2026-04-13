import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const iconButton = cva(
  'inline-flex items-center justify-center rounded transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        ghost: 'text-white/70 hover:text-white hover:bg-surface-2',
        solid: 'bg-surface-2 text-white hover:bg-surface-3 border border-border',
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
      },
      size: {
        sm: 'h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5',
        md: 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4',
        lg: 'h-10 w-10 [&>svg]:h-5 [&>svg]:w-5',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  }
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButton> {
  icon: ReactNode;
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, icon, label, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      className={cn(iconButton({ variant, size }), className)}
      {...props}
    >
      {icon}
    </button>
  )
);
IconButton.displayName = 'IconButton';
