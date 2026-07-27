import { Film, Monitor } from 'lucide-react';
import type { Device } from '../../constants/devices';
import type {
  DeploymentScheduleTableColumn,
  DeploymentScheduleTableRow,
} from '../../types/deployments';
import { getScheduleVideosForDay, formatScheduleDayModalTitle } from '../../lib/scheduleTable';
import { resolveStorageUrl } from '../../lib/libraryType';
import { cn } from '../../lib/cn';
import { Button, Badge, Modal, ModalBody, SectionLabel } from '../ui';
import { CARD_SURFACE_CLASS } from '../ui/cardStyles';

export interface ScheduleDayDetailsModalProps {
  open: boolean;
  onClose: () => void;
  row: DeploymentScheduleTableRow | null;
  columns: DeploymentScheduleTableColumn[];
  device?: Device;
  connectionStartDate?: string;
  isCurrentDay?: boolean;
}

function formatConnectionStartLabel(value: string): string {
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ScheduleDayDetailsModal({
  open,
  onClose,
  row,
  columns,
  device,
  connectionStartDate,
  isCurrentDay = false,
}: ScheduleDayDetailsModalProps) {
  const videos = row ? getScheduleVideosForDay(row, columns) : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={row ? formatScheduleDayModalTitle(row) : 'Schedule details'}
      description={row ? row.dateLabel : undefined}
      size="lg"
      footer={
        <Button type="button" size="sm" className="h-9 px-4" onClick={onClose}>
          Close
        </Button>
      }
    >
      <ModalBody className="space-y-4">
        {!row ? (
          <p className="text-body-sm text-content-muted">No schedule day selected.</p>
        ) : (
          <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <SectionLabel className="mb-1 block">
                    {isCurrentDay
                      ? `Currently playing on Rotation Day ${row.rotationDay}`
                      : `Videos on Day ${row.day}`}
                  </SectionLabel>
                  <p className="text-body-sm text-content-secondary">
                    {device
                      ? `${device.name} · ${device.location} · Rotation Day ${row.rotationDay}`
                      : `Day ${row.day} · ${row.dateLabel} · Rotation Day ${row.rotationDay}`}
                    {connectionStartDate
                      ? ` · Connection started ${formatConnectionStartLabel(connectionStartDate)}`
                      : device?.currentDay
                        ? ` · ${device.currentDay}`
                        : ''}
                  </p>
                </div>
              </div>
              {device && (
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-caption font-medium',
                    device.status === 'online'
                      ? 'bg-status-success/10 text-status-success'
                      : 'bg-status-warning/10 text-status-warning',
                  )}
                >
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </span>
              )}
            </div>

            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map((entry) => {
                const thumbnailUrl = resolveStorageUrl(entry.thumbnail);
                return (
                  <li
                    key={`${entry.group}-${entry.variantLabel ?? ''}-${entry.label ?? ''}-${entry.video}`}
                    className="rounded-lg border border-surface-border bg-surface-muted/30 px-4 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-surface-border bg-gradient-to-br from-p6-gray-300 to-p6-gray-400 dark:from-p6-gray-700 dark:to-p6-gray-900">
                        {entry.assigned && thumbnailUrl ? (
                          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Film className="h-4 w-4 text-content-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-caption font-medium text-content-muted">
                            {entry.label ? `${entry.group} · ${entry.label}` : entry.group}
                          </p>
                          {entry.variantLabel && (
                            <Badge variant="brand" className="shrink-0">
                              {entry.variantLabel}
                            </Badge>
                          )}
                        </div>
                        <p
                          className={cn(
                            'mt-0.5 truncate text-body-sm font-medium',
                            entry.assigned ? 'text-content-primary' : 'italic text-content-muted',
                          )}
                          title={entry.video}
                        >
                          {entry.video}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 text-caption text-content-muted">
              Source: <code className="text-content-secondary">GET /deployments/:id/schedule-table</code>
            </p>
          </section>
        )}
      </ModalBody>
    </Modal>
  );
}
