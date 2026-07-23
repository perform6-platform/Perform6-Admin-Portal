import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'ui-button-primary',
  outline: 'ui-button-outline',
  ghost: 'ui-button-ghost',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-caption',
  md: 'h-10 px-4 text-body-sm',
  lg: 'h-11 px-5 text-body-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface QuickActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

export function QuickActionButton({ icon, label, className, ...props }: QuickActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-card border border-transparent',
        'bg-surface px-4 py-3 text-body-sm font-medium text-content-primary shadow-card transition-all',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(30,34,41,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        className,
      )}
      {...props}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon}
      </span>
      {label}
    </button>
  );
}
