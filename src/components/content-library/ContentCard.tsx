import { useEffect, useState } from 'react';
import { Loader2, Play, Trash2 } from 'lucide-react';
import type { ContentItem } from '../../constants/contentLibrary';
import { defaultContentThumbnail } from '../../constants/contentLibrary';
import { getFullCategoryLabel } from '../../constants/contentPlayback';
import { cn } from '../../lib/cn';
import { Badge, IconButton } from '../ui';

export interface ContentCardProps {
  item: ContentItem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onPlay?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
}

function statusBadge(status?: string) {
  if (status === 'PROCESSING') {
    return { label: 'Processing', variant: 'warning' as const };
  }
  if (status === 'FAILED') {
    return { label: 'Failed', variant: 'danger' as const };
  }
  if (status === 'READY' || !status) {
    return null;
  }
  return { label: status, variant: 'neutral' as const };
}

export function ContentCard({
  item,
  selected = false,
  onSelect,
  onPlay,
  onDelete,
}: ContentCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(
    item.thumbnailUrl || defaultContentThumbnail,
  );
  const isVideo = item.mediaType === 'video';
  const isProcessing = item.status === 'PROCESSING';
  const isFailed = item.status === 'FAILED';
  const canPlay = isVideo && !isProcessing && !isFailed && Boolean(item.videoUrl);
  const badge = statusBadge(item.status);

  // Keep card in sync when upload finishes and library refetch updates the real thumb.
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
          isFailed && 'opacity-90',
        )}
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={isProcessing}
          className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-default"
        >
          <div className="aspect-[16/10] w-full overflow-hidden bg-surface-muted">
            <img
              key={thumbnailUrl}
              src={thumbnailUrl}
              alt={item.title}
              className={cn(
                'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]',
                isProcessing && 'opacity-60',
              )}
              loading="lazy"
              onError={() => {
                if (thumbnailUrl !== defaultContentThumbnail) {
                  setThumbnailUrl(defaultContentThumbnail);
                }
              }}
            />
            {isProcessing && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-caption font-medium">Processing…</span>
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

        {onDelete && (
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

        {item.duration && !isProcessing && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium leading-none text-white">
            {item.duration}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
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
