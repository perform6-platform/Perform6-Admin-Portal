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
          <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
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

            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map((entry) => {
                const thumbnailUrl = resolveStorageUrl(entry.thumbnail);
                return (
                  <li
                    key={`${entry.playlistLabel}-${entry.video}`}
                    className="rounded-lg border border-surface-border bg-surface-muted/30 px-4 py-3"
                  >
                    <div className="flex items-start gap-2">
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
                        <Badge variant="brand" className="mb-1 max-w-full">
                          {entry.playlistLabel}
                        </Badge>
                        <p
                          className={cn(
                            'text-body-sm font-medium break-words',
                            entry.assigned ? 'text-content-primary' : 'italic text-content-muted',
                          )}
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
