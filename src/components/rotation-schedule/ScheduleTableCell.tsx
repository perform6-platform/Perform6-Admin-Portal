import { Film } from 'lucide-react';
import type { DeploymentScheduleTableCell } from '../../types/deployments';
import { resolveStorageUrl } from '../../lib/libraryType';
import { cn } from '../../lib/cn';
import { getScheduleCellTitle, isScheduleCellAssigned } from '../../lib/scheduleTable';
import { Badge } from '../ui';

export interface ScheduleTableCellProps {
  cell: DeploymentScheduleTableCell | null | undefined;
  compact?: boolean;
  /** Wall / No Wall — shown for Phase 1 columns. */
  variantLabel?: string | null;
  showVariant?: boolean;
}

export function ScheduleTableCell({
  cell,
  compact = false,
  variantLabel,
  showVariant = false,
}: ScheduleTableCellProps) {
  const assigned = isScheduleCellAssigned(cell);
  const title = getScheduleCellTitle(cell);
  const thumbnailUrl = resolveStorageUrl(cell?.thumbnail);

  return (
    <div className={cn('flex min-w-0 items-center gap-2', compact ? 'max-w-[180px]' : 'max-w-[220px]')}>
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
      <div className="min-w-0 flex-1">
        {showVariant && variantLabel && (
          <Badge variant="brand" className="mb-0.5 max-w-full truncate">
            {variantLabel}
          </Badge>
        )}
        <span
          className={cn(
            'block min-w-0 truncate text-body-sm',
            assigned ? 'text-content-secondary' : 'italic text-content-muted',
          )}
          title={title}
        >
          {title}
        </span>
      </div>
    </div>
  );
}
