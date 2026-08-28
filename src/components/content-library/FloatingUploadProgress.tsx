import { Loader2, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { UploadProgressState } from './UploadProgressPanel';
import { UploadProgressPanel } from './UploadProgressPanel';

export interface FloatingUploadProgressProps {
  open: boolean;
  state: UploadProgressState;
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  canCancel?: boolean;
}

export function FloatingUploadProgress({
  open,
  state,
  title,
  subtitle,
  onCancel,
  canCancel = false,
}: FloatingUploadProgressProps) {
  if (!open || state.phase === 'idle') return null;

  const isBusy = state.phase === 'uploading' || state.phase === 'processing';
  const displayTitle =
    title ??
    (state.phase === 'uploading'
      ? 'Uploading video'
      : state.phase === 'processing'
        ? 'Processing video'
        : state.phase === 'done'
          ? 'Upload complete'
          : 'Upload failed');

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:p-6"
      role="presentation"
    >
      <div
        className={cn(
          'pointer-events-auto w-full max-w-lg rounded-2xl border border-surface-border bg-surface shadow-2xl',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-border px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isBusy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />}
              <p className="truncate text-sm font-semibold text-content-primary">{displayTitle}</p>
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-caption text-content-muted">{subtitle}</p>
            )}
          </div>
          {canCancel && onCancel && isBusy && (
            <button
              type="button"
              className="shrink-0 rounded-md p-1 text-content-muted hover:bg-surface-muted hover:text-content-primary"
              onClick={onCancel}
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="p-4">
          <UploadProgressPanel state={state} className="border-0 bg-transparent p-0" />
        </div>
      </div>
    </div>
  );
}
