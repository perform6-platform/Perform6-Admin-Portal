import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

const dotColors: Record<StatusVariant, string> = {
  success: 'bg-[#28C76F]',
  warning: 'bg-[#FF9F43]',
  danger: 'bg-[#EA5455]',
  neutral: 'bg-content-muted',
};

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  size?: 'sm' | 'md';
}

export function StatusDot({ variant = 'neutral', size = 'sm', className, ...props }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full',
        size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3',
        dotColors[variant],
        className,
      )}
      {...props}
    />
  );
}

export interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  variant?: StatusVariant;
}

export function StatusBadge({ label, value, variant = 'success', className, ...props }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        'ui-field inline-flex items-center gap-2 rounded-lg px-3 py-2',
        className,
      )}
      {...props}
    >
      <span className="hidden text-caption text-content-secondary sm:inline">{label}</span>
      <StatusDot variant={variant} />
      <span className="text-body-sm font-medium text-content-primary">{value}</span>
    </div>
  );
}

export interface DateBadgeProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function DateBadge({ label, className, ...props }: DateBadgeProps) {
  return (
    <div
      className={cn(
        'ui-field inline-flex items-center gap-2 rounded-lg px-3 py-2',
        className,
      )}
      {...props}
    >
      <svg className="h-4 w-4 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <span className="text-body-sm text-content-primary">{label}</span>
    </div>
  );
}
