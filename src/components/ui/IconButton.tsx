import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        'ui-field text-content-secondary',
        'transition-colors hover:border-brand-500/30 hover:text-content-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        className,
      )}
      {...props}
    >
      <span className="flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:stroke-[2]">
        {children}
      </span>
    </button>
  );
}
