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

export interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  accent?: MetricAccent;
  trend?: string;
  trendDirection?: 'up' | 'down';
  className?: string;
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
}: MetricCardProps) {
  return (
    <div className={cn(CARD_SURFACE_CLASS, 'p-5 sm:p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn('metric-icon [&_svg]:h-5 [&_svg]:w-5', accentClass[accent])}>{icon}</div>
        {trend && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-caption font-semibold',
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
      <p className="mt-1 text-body-sm font-medium text-content-primary">{label}</p>
      {subtext && <p className="mt-0.5 text-caption text-content-muted">{subtext}</p>}
    </div>
  );
}
