import { useState } from 'react';
import { HardDriveDownload, Power, RefreshCw } from 'lucide-react';
import { useQueueDeviceRemoteCommand } from '../../hooks/useDevices';
import { Button, ConfirmModal } from '../ui';

export interface DeviceRemoteOpsProps {
  deviceId: string | null;
  disabled?: boolean;
}

export function DeviceRemoteOps({ deviceId, disabled }: DeviceRemoteOpsProps) {
  const { mutate, isPending } = useQueueDeviceRemoteCommand();
  const [lastQueued, setLastQueued] = useState<string | null>(null);
  const [rebootOpen, setRebootOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const queue = (label: string, action: 'REBOOT' | 'SYNC_NOW' | 'CLEAR_SD_CACHE') => {
    if (!deviceId || disabled) return;
    mutate(
      { deviceId, payload: { action } },
      {
        onSuccess: () => setLastQueued(label),
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || isPending}
          onClick={() => setRebootOpen(true)}
        >
          <Power className="h-4 w-4" />
          Reboot
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || isPending}
          onClick={() => queue('Sync now', 'SYNC_NOW')}
        >
          <RefreshCw className="h-4 w-4" />
          Sync now
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || isPending}
          onClick={() => setClearOpen(true)}
        >
          <HardDriveDownload className="h-4 w-4" />
          Clear SD cache
        </Button>
      </div>

      <p className="text-caption text-content-muted">
        Delivered on the device&apos;s next heartbeat (~60s). Keep the player online.
        {lastQueued ? ` Last queued: ${lastQueued}.` : ''}
      </p>

      <ConfirmModal
        open={rebootOpen}
        onClose={() => setRebootOpen(false)}
        onConfirm={() => {
          queue('Reboot', 'REBOOT');
          setRebootOpen(false);
        }}
        title="Reboot player?"
        description="The BrightSign will restart within about one minute. Use this to recover from a stuck sync or apply a pending OTA update."
        confirmLabel="Reboot"
        tone="danger"
      />

      <ConfirmModal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          queue('Clear SD cache', 'CLEAR_SD_CACHE');
          setClearOpen(false);
        }}
        title="Clear SD cache?"
        description="Deletes all files in SD:/perform6-cache on the device, then starts a fresh sync. Videos will re-download."
        confirmLabel="Clear cache"
        tone="danger"
      />
    </div>
  );
}
