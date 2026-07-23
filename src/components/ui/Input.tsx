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
      {label && (
        <label className="mb-1 block text-xs font-medium text-content-muted">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
            {icon}
          </span>
        )}
        <input
          className={cn(
            'ui-input h-9 w-full rounded-lg px-3 text-sm',
            'hover:border-brand-500/30',
            'focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-9' : undefined,
            endIcon ? 'pr-9' : undefined,
          )}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted">{endIcon}</span>
        )}
      </div>
    </div>
  );
}
