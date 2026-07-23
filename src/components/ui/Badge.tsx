import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'brand';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[rgba(40,199,111,0.12)] text-status-success',
  danger: 'bg-[rgba(234,84,85,0.12)] text-status-danger',
  warning: 'bg-[rgba(255,159,67,0.12)] text-status-warning',
  neutral: 'bg-surface-muted text-content-secondary',
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-caption font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
