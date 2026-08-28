import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS } from '../ui/cardStyles';
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
  const visible = open && state.phase !== 'idle';

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="ui-modal-overlay absolute inset-0" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        className={cn(CARD_SURFACE_CLASS, 'ui-modal-panel relative z-10 w-full max-w-lg rounded-xl')}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isBusy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />}
              <p className="truncate text-lg font-semibold text-content-primary">{displayTitle}</p>
            </div>
            {subtitle && (
              <p className="mt-1 truncate text-body-sm text-content-secondary">{subtitle}</p>
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

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <UploadProgressPanel state={state} />
          {isBusy && (
            <p className="text-center text-caption text-content-muted">
              Please keep this window open until the bar reaches 100%.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
