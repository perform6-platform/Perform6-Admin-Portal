import { StatusDot } from '../ui/StatusBadge';

const segmentVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  '#28C76F': 'success',
  '#FF9F43': 'warning',
  '#EA5455': 'danger',
};

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: ChartSegment[];
  totalLabel?: string;
}

export function DonutChart({ segments, totalLabel = 'Total' }: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cumulative = 0;

  const gradientStops = segments
    .map((segment) => {
      const start = (cumulative / total) * 100;
      cumulative += segment.value;
      const end = (cumulative / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(', ');

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full sm:h-36 sm:w-36"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-xl font-bold text-content-primary">{total}</span>
          <span className="text-caption text-content-muted">{totalLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-3 sm:w-auto">
        {segments.map((segment) => {
          const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <li key={segment.label} className="flex items-center gap-2">
              <StatusDot variant={segmentVariant[segment.color] ?? 'neutral'} />
              <span className="min-w-[60px] text-body-sm text-content-secondary">{segment.label}</span>
              <span className="text-body-sm font-semibold text-content-primary">{segment.value}</span>
              <span className="text-caption text-content-muted">({percentage}%)</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface BarChartItem {
  label: string;
  value: number;
}

export interface BarChartProps {
  items: BarChartItem[];
  maxValue?: number;
}

function splitLocationLabel(label: string): { city: string; suffix: string } {
  if (label.endsWith(' Gym')) {
    return { city: label.slice(0, -4), suffix: 'Gym' };
  }
  return { city: label, suffix: '' };
}

export function BarChart({ items, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...items.map((item) => item.value), 1);
  const chartHeight = 120;

  return (
    <div className="w-full pt-2">
      <div className="flex gap-1 sm:gap-2">
        {items.map((item) => {
          const barHeight = item.value > 0 ? Math.max((item.value / max) * chartHeight, 10) : 0;
          const { city, suffix } = splitLocationLabel(item.label);

          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className="flex w-full flex-col items-center justify-end"
                style={{ height: chartHeight + 28 }}
              >
                <span className="mb-1.5 text-sm font-semibold leading-none text-content-primary">
                  {item.value}
                </span>
                <div
                  className="w-full max-w-[36px] rounded-t-md bg-brand-400/70 sm:max-w-[44px] dark:bg-brand-500/70"
                  style={{ height: barHeight }}
                />
              </div>

              <div className="h-px w-full bg-surface-border" />

              <div className="mt-2 w-full px-0.5 text-center leading-tight text-content-muted">
                <span className="block text-[10px] sm:text-[11px]">{city}</span>
                {suffix && <span className="block text-[10px] sm:text-[11px]">{suffix}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
