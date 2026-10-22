import { Film } from 'lucide-react';
import type { DeploymentScheduleTableCell } from '../../types/deployments';
import { resolveStorageUrl } from '../../lib/libraryType';
import { cn } from '../../lib/cn';
import { getScheduleCellTitle, isScheduleCellAssigned } from '../../lib/scheduleTable';
import { Badge } from '../ui';

export interface ScheduleTableCellProps {
  cell: DeploymentScheduleTableCell | null | undefined;
  compact?: boolean;
  /** Blue playlist / variant badge (e.g. Default (Golf), Zone 1, Fitness (No Wall)). */
  playlistLabel?: string | null;
  showPlaylistLabel?: boolean;
  rotationDay?: number;
}

export function ScheduleTableCell({
  cell,
  compact = false,
  playlistLabel,
  showPlaylistLabel = false,
  rotationDay,
}: ScheduleTableCellProps) {
  const assigned = isScheduleCellAssigned(cell);
  const title = getScheduleCellTitle(cell, rotationDay);
  const thumbnailUrl = resolveStorageUrl(cell?.thumbnail);

  return (
    <div className={cn('flex items-center gap-2 whitespace-nowrap', compact ? 'min-w-[12rem]' : 'min-w-[18.5rem]')}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-surface-border bg-gradient-to-br from-p6-gray-300 to-p6-gray-400 dark:from-p6-gray-700 dark:to-p6-gray-900',
          compact ? 'h-9 w-14' : 'h-10 w-16',
        )}
      >
        {assigned && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className={cn('text-content-muted', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          </div>
        )}
      </div>
      <div className="shrink-0">
        {showPlaylistLabel && playlistLabel ? (
          <Badge variant="brand" className="mb-0.5 whitespace-nowrap">
            {playlistLabel}
          </Badge>
        ) : null}
        <span
          className={cn(
            'block whitespace-nowrap text-body-sm',
            assigned ? 'text-content-secondary' : 'text-content-muted',
          )}
          title={title}
        >
          {title}
        </span>
      </div>
    </div>
  );
}
