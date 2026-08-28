import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, PauseCircle, Play, RotateCcw, Trash2, Upload } from 'lucide-react';
import type { ContentItem } from '../../constants/contentLibrary';
import { defaultContentThumbnail } from '../../constants/contentLibrary';
import { getFullCategoryLabel } from '../../constants/contentPlayback';
import { cn } from '../../lib/cn';
import { Badge, IconButton } from '../ui';

export type CardUploadVisual =
  | 'ready'
  | 'processing'
  | 'failed'
  | 'interrupted'
  | 'resuming';

export interface ContentCardProps {
  item: ContentItem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onPlay?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  onRetryProcessing?: (item: ContentItem) => void;
  onResumeUpload?: (item: ContentItem) => void;
  onDiscardUpload?: (item: ContentItem) => void;
  uploadVisual?: CardUploadVisual;
  uploadPercent?: number;
}

function statusBadge(visual: CardUploadVisual) {
  if (visual === 'processing' || visual === 'resuming') {
    return { label: visual === 'resuming' ? 'Uploading' : 'Processing', variant: 'warning' as const };
  }
  if (visual === 'interrupted') {
    return { label: 'Upload paused', variant: 'danger' as const };
  }
  if (visual === 'failed') {
    return { label: 'Failed', variant: 'danger' as const };
  }
  return null;
}

export function ContentCard({
  item,
  selected = false,
  onSelect,
  onPlay,
  onDelete,
  onRetryProcessing,
  onResumeUpload,
  onDiscardUpload,
  uploadVisual = 'ready',
  uploadPercent = 0,
}: ContentCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(
    item.thumbnailUrl || defaultContentThumbnail,
  );
  const isVideo = item.mediaType === 'video';
  const isBusy = uploadVisual === 'processing' || uploadVisual === 'resuming';
  const isInterrupted = uploadVisual === 'interrupted';
  const isFailed = uploadVisual === 'failed';
  const canPlay = isVideo && uploadVisual === 'ready' && Boolean(item.videoUrl);
  const badge = statusBadge(uploadVisual);

  useEffect(() => {
    setThumbnailUrl(item.thumbnailUrl || defaultContentThumbnail);
  }, [item.id, item.thumbnailUrl, item.status, item.updatedAt]);

  function handleClick() {
    onSelect?.(item.id);
    if (canPlay) {
      onPlay?.(item);
    }
  }

  return (
    <div className="group w-full text-left">
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border-2 transition-colors',
          selected
            ? 'border-status-success shadow-[0_0_0_1px_rgba(40,199,111,0.35)]'
            : 'border-transparent group-hover:border-surface-border',
          (isFailed || isInterrupted) && 'opacity-95',
        )}
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={isBusy}
          className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-default"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-muted">
            <img
              key={thumbnailUrl}
              src={thumbnailUrl}
              alt={item.title}
              className={cn(
                'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]',
                (isBusy || isInterrupted || isFailed) && 'opacity-50 grayscale-[0.2]',
              )}
              loading="lazy"
              onError={() => {
                if (thumbnailUrl !== defaultContentThumbnail) {
                  setThumbnailUrl(defaultContentThumbnail);
                }
              }}
            />

            {uploadVisual === 'processing' && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
                <Loader2 className="h-7 w-7 animate-spin" />
                <span className="text-caption font-medium">Processing for BrightSign…</span>
              </span>
            )}

            {uploadVisual === 'resuming' && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-4 text-white">
                <Loader2 className="h-7 w-7 animate-spin text-brand-300" />
                <span className="text-caption font-medium">Resuming upload…</span>
                <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all duration-300"
                    style={{ width: `${Math.max(4, uploadPercent)}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-white/80">{uploadPercent}%</span>
              </span>
            )}

            {isInterrupted && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-3 text-white">
                <PauseCircle className="h-8 w-8 text-status-danger" strokeWidth={1.75} />
                <span className="text-center text-caption font-medium leading-snug">
                  Upload interrupted
                </span>
                {uploadPercent > 0 && (
                  <span className="text-[11px] tabular-nums text-white/75">
                    {uploadPercent}% was uploaded
                  </span>
                )}
              </span>
            )}

            {isFailed && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white">
                <AlertCircle className="h-8 w-8 text-status-danger" strokeWidth={1.75} />
                <span className="text-caption font-medium">Processing failed</span>
              </span>
            )}

            {canPlay && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              </span>
            )}
          </div>
        </button>

        {badge && (
          <span className="absolute left-2 top-2 z-10">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </span>
        )}

        {onDelete && !isBusy && (
          <IconButton
            label={`Delete ${item.title}`}
            className="absolute right-2 top-2 z-10 h-8 w-8 border-0 bg-black/65 text-white shadow-sm hover:border-status-danger/40 hover:bg-black/80 hover:text-white"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(item);
            }}
          >
            <Trash2 />
          </IconButton>
        )}

        {isInterrupted && onResumeUpload && (
          <div className="absolute bottom-2 left-2 right-2 z-10 flex gap-1.5">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-brand-600 px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-brand-700"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onResumeUpload(item);
              }}
            >
              <Upload className="h-3 w-3" />
              Resume upload
            </button>
            {onDiscardUpload && (
              <button
                type="button"
                className="rounded-md bg-black/60 px-2 py-1.5 text-[11px] font-medium text-white/90 hover:bg-black/80"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDiscardUpload(item);
                }}
              >
                Discard
              </button>
            )}
          </div>
        )}

        {isFailed && onRetryProcessing && (
          <button
            type="button"
            className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-md bg-black/75 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-black/90"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRetryProcessing(item);
            }}
          >
            <RotateCcw className="h-3 w-3" />
            Retry processing
          </button>
        )}

        {item.duration && uploadVisual === 'ready' && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium leading-none text-white">
            {item.duration}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className="mt-2 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-default"
      >
        <p className="truncate text-sm font-medium text-content-primary">{item.title}</p>
        <p className="mt-0.5 truncate text-caption text-brand-600 dark:text-brand-400">
          {getFullCategoryLabel(item.categoryId)}
          {item.rotationDay ? ` · Day ${item.rotationDay}` : ''}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2 text-caption text-content-muted">
          <span>{item.dateLabel}</span>
          <span className="uppercase">{item.format}</span>
        </div>
      </button>
    </div>
  );
}
