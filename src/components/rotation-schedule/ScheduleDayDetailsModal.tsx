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

export interface ScheduleDayDetailsModalProps {
  open: boolean;
  onClose: () => void;
  row: DeploymentScheduleTableRow | null;
  columns: DeploymentScheduleTableColumn[];
  device?: Device;
}

export function ScheduleDayDetailsModal({
  open,
  onClose,
  row,
  columns,
  device,
}: ScheduleDayDetailsModalProps) {
  const videos = row ? getScheduleVideosForDay(row, columns) : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={row ? formatScheduleDayModalTitle(row) : 'Schedule details'}
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
          <section>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <SectionLabel className="mb-1 block">
                    SCHEDULED CONTENT — DAY {row.rotationDay}
                  </SectionLabel>
                  <p className="text-body-sm text-content-secondary">
                    {device
                      ? `${device.name}${device.location && device.location !== '—' ? ` · ${device.location}` : ''}`
                      : `Day ${row.rotationDay} · ${row.dateLabel}`}
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

            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {videos.map((entry) => {
                const thumbnailUrl = resolveStorageUrl(entry.thumbnail);
                return (
                  <li
                    key={`${entry.playlistLabel}-${entry.video}`}
                    className="min-w-0 rounded-lg border border-surface-border bg-surface-muted/30 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-surface-border bg-gradient-to-br from-p6-gray-300 to-p6-gray-400 dark:from-p6-gray-700 dark:to-p6-gray-900">
                        {entry.assigned && thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Film className="h-4 w-4 text-content-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Badge variant="brand" className="mb-1 max-w-full truncate">
                          {entry.playlistLabel}
                        </Badge>
                        <p
                          className={cn(
                            'whitespace-nowrap text-body-sm font-medium',
                            entry.assigned ? 'text-content-primary' : 'text-content-muted',
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
          </section>
        )}
      </ModalBody>
    </Modal>
  );
}
