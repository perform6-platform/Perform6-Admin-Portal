import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  endIcon?: ReactNode;
  label?: string;
}

export function Input({ icon, endIcon, label, className, ...props }: InputProps) {
  return (
    <div className={className}>
      {label && <label className="mb-2 block text-xs font-normal text-content-muted">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
            {icon}
          </span>
        )}
        <input
          className={cn(
            'ui-input h-10 w-full rounded-control px-4 text-body-sm',
            'hover:border-brand-500/30',
            'focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-10' : undefined,
            endIcon ? 'pr-10' : undefined,
          )}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted">{endIcon}</span>
        )}
      </div>
    </div>
  );
}
