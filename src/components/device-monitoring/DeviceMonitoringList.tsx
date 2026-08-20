import type { Device } from '../../constants/devices';
import { cn } from '../../lib/cn';
import { Badge, CARD_SURFACE_CLASS } from '../ui';

export interface DeviceMonitoringListProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
  className?: string;
}

export function DeviceMonitoringList({
  devices,
  selectedDeviceId,
  onSelect,
  className,
}: DeviceMonitoringListProps) {
  return (
    <div
      className={cn(
        CARD_SURFACE_CLASS,
        'flex max-h-[720px] flex-col overflow-hidden p-3',
        className,
      )}
    >
      <ul className="hide-scrollbar divide-y divide-surface-border overflow-y-auto rounded-lg">
        {devices.map((device) => {
          const isSelected = device.id === selectedDeviceId;

          return (
            <li key={device.id}>
              <button
                type="button"
                onClick={() => onSelect(device.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 px-3 py-3.5 text-left transition-colors',
                  isSelected
                    ? 'bg-brand-600/10'
                    : 'hover:bg-surface-muted/40',
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium text-content-primary">{device.name}</p>
                  <p className="truncate text-caption text-content-secondary">{device.location}</p>
                </div>
                <Badge
                  variant={device.status === 'online' ? 'success' : 'danger'}
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5',
                    device.status === 'online'
                      ? 'border border-status-success/30'
                      : 'border border-status-danger/30',
                  )}
                >
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
