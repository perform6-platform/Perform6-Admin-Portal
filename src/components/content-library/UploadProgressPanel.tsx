import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export type UploadProgressPhase = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export interface UploadProgressState {
  phase: UploadProgressPhase;
  /** Smooth displayed percent 0–100. */
  percent: number;
  label?: string;
}

export interface UploadProgressPanelProps {
  state: UploadProgressState;
  className?: string;
}

export function UploadProgressPanel({ state, className }: UploadProgressPanelProps) {
  if (state.phase === 'idle') return null;

  const isBusy = state.phase === 'uploading' || state.phase === 'processing';
  const isDone = state.phase === 'done';
  const isError = state.phase === 'error';
  const percent = Math.max(0, Math.min(100, state.percent));

  const title =
    state.label ??
    (state.phase === 'uploading'
      ? 'Uploading video'
      : state.phase === 'processing'
        ? 'Processing video'
        : state.phase === 'done'
          ? 'Upload complete'
          : 'Upload failed');

  return (
    <div
      className={cn(
        'rounded-xl border border-surface-border bg-surface-muted/40 p-4 dark:bg-surface-muted/20',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-body-sm text-content-primary">{title}</p>
          <p className="mt-0.5 text-caption text-content-secondary">
            {isBusy
              ? percent < 70
                ? 'Transferring file to cloud storage…'
                : 'Optimizing and preparing for BrightSign…'
              : isDone
                ? 'Video uploaded successfully.'
                : 'Something went wrong. Try again.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isBusy && percent < 100 && (
            <Loader2 className="h-4 w-4 animate-spin text-brand-600 dark:text-brand-400" />
          )}
          <span
            className={cn(
              'min-w-[3rem] text-right tabular-nums text-body-sm font-medium',
              isError
                ? 'text-status-danger'
                : isDone
                  ? 'text-status-success'
                  : 'text-brand-600 dark:text-brand-400',
            )}
          >
            {isError ? '—' : `${percent}%`}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-border/80">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-150 ease-linear',
            isError
              ? 'bg-status-danger'
              : isDone || percent >= 100
                ? 'bg-status-success'
                : 'bg-brand-600',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
