import { cn } from '../../lib/cn';

export interface UsageGaugeProps {
  label: string;
  value: number;
  color: string;
  className?: string;
}

export function UsageGauge({ label, value, color, className }: UsageGaugeProps) {
  const radius = 46;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className="mb-2 text-caption text-content-secondary">{label}</span>
      <div className="relative h-[108px] w-[108px]">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-surface-muted)"
            strokeWidth={stroke}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-content-primary">{value}%</span>
        </div>
      </div>
    </div>
  );
}
