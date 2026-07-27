import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS } from './cardStyles';

type MetricAccent = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const accentClass: Record<MetricAccent, string> = {
  brand: 'metric-icon--brand',
  success: 'metric-icon--success',
  warning: 'metric-icon--warning',
  danger: 'metric-icon--danger',
  neutral: 'metric-icon--neutral',
};

const accentHoverRing: Record<MetricAccent, string> = {
  brand: 'hover:border-brand-500/35 hover:shadow-[0_10px_28px_rgba(17,85,204,0.14)]',
  success: 'hover:border-status-success/35 hover:shadow-[0_10px_28px_rgba(40,199,111,0.14)]',
  warning: 'hover:border-status-warning/40 hover:shadow-[0_10px_28px_rgba(255,159,67,0.16)]',
  danger: 'hover:border-status-danger/35 hover:shadow-[0_10px_28px_rgba(234,84,85,0.14)]',
  neutral: 'hover:border-surface-border hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]',
};

export interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  accent?: MetricAccent;
  trend?: string;
  trendDirection?: 'up' | 'down';
  className?: string;
  /** Makes the card a button that navigates / triggers an action. */
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  accent = 'brand',
  trend,
  trendDirection = 'up',
  className,
  onClick,
}: MetricCardProps) {
  const clickable = Boolean(onClick);
  const Comp = clickable ? 'button' : 'div';

  return (
    <Comp
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        CARD_SURFACE_CLASS,
        'p-6 sm:p-6 text-left transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out',
        clickable &&
          cn(
            'group w-full cursor-pointer',
            'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page',
            accentHoverRing[accent],
          ),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            'metric-icon [&_svg]:h-5 [&_svg]:w-5 transition-transform duration-200',
            accentClass[accent],
            clickable && 'group-hover:scale-110',
          )}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-caption font-medium',
              trendDirection === 'up'
                ? 'bg-[rgba(40,199,111,0.12)] text-status-success'
                : 'bg-[rgba(234,84,85,0.12)] text-status-danger',
            )}
          >
            {trendDirection === 'up' ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-[1.75rem] font-bold leading-tight tracking-tight text-content-primary">
        {value}
      </p>
      <p className="mt-1 text-body-sm text-content-primary">
        {label}
        {clickable ? (
          <span className="ml-1.5 text-caption font-normal text-content-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            View →
          </span>
        ) : null}
      </p>
      {subtext && <p className="mt-0.5 text-caption text-content-muted">{subtext}</p>}
    </Comp>
  );
}
