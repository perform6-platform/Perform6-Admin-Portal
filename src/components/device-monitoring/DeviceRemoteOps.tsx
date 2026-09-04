import { useState } from 'react';
import { Download, FileText, HardDriveDownload, Power, RefreshCw } from 'lucide-react';
import { useQueueDeviceRemoteCommand, useRetryDeviceOta } from '../../hooks/useDevices';
import { Button, ConfirmModal } from '../ui';

export interface DeviceRemoteOpsProps {
  deviceId: string | null;
  disabled?: boolean;
}

export function DeviceRemoteOps({ deviceId, disabled }: DeviceRemoteOpsProps) {
  const { mutate, isPending } = useQueueDeviceRemoteCommand();
  const retryOta = useRetryDeviceOta();
  const [lastQueued, setLastQueued] = useState<string | null>(null);
  const [rebootOpen, setRebootOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [otaOpen, setOtaOpen] = useState(false);

  const queue = (
    label: string,
    action: 'REBOOT' | 'SYNC_NOW' | 'CLEAR_SD_CACHE' | 'UPLOAD_LOGS',
    extra?: { skipOta?: boolean; forceOta?: boolean },
  ) => {
    if (!deviceId || disabled) return;
    setLastQueued(`Queuing ${label}…`);
    mutate(
      {
        deviceId,
        payload: {
          action,
          ...(action === 'SYNC_NOW'
            ? {
                skipOta: extra?.forceOta === true ? false : true,
                forceOta: extra?.forceOta === true,
              }
            : {}),
        },
      },
      {
        onSuccess: () =>
          setLastQueued(
            `${label} queued — runs on next player heartbeat (~60s). Works even if the autorun bridge is down (Node path).`,
          ),
        onError: () => setLastQueued(`Failed to queue ${label}.`),
      },
    );
  };

  const queueInstallOta = () => {
    if (!deviceId || disabled) return;
    setLastQueued('Queuing Install OTA…');
    retryOta.mutate(
      { deviceId, reboot: false },
      {
        onSuccess: () =>
          setLastQueued(
            'Install OTA queued — package download starts on next heartbeat (~60s).',
          ),
        onError: () => setLastQueued('Failed to queue Install OTA.'),
      },
    );
  };

  const busy = isPending || retryOta.isPending;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || busy}
          onClick={() => setRebootOpen(true)}
        >
          <Power className="h-4 w-4" />
          Reboot
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || busy}
          onClick={() => queue('Sync now (media only)', 'SYNC_NOW', { skipOta: true })}
        >
          <RefreshCw className="h-4 w-4" />
          Sync now
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!deviceId || disabled || busy}
          onClick={() => setOtaOpen(true)}
        >
          <Download className="h-4 w-4" />
          Install OTA
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || busy}
          onClick={() => queue('Upload logs', 'UPLOAD_LOGS')}
        >
          <FileText className="h-4 w-4" />
          Upload logs
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || busy}
          onClick={() => setClearOpen(true)}
        >
          <HardDriveDownload className="h-4 w-4" />
          Clear SD cache
        </Button>
      </div>

      {disabled ? (
        <p className="text-caption text-status-warning">
          Device offline — remote commands are disabled until the player is online.
        </p>
      ) : (
        <p className="text-caption text-content-muted">
          Commands are not instant: they run on the next heartbeat (~60s).{' '}
          <span className="font-medium">Sync now</span> = media only.{' '}
          <span className="font-medium">Install OTA</span> = software update only.
          {lastQueued ? (
            <>
              <br />
              <span className="font-medium text-content-primary">{lastQueued}</span>
            </>
          ) : null}
        </p>
      )}

      <ConfirmModal
        open={rebootOpen}
        onClose={() => setRebootOpen(false)}
        onConfirm={() => {
          queue('Reboot', 'REBOOT');
          setRebootOpen(false);
        }}
        title="Reboot player?"
        description="Queued now; the BrightSign restarts after the next heartbeat (~60s)."
        confirmLabel="Reboot"
        tone="danger"
      />

      <ConfirmModal
        open={otaOpen}
        onClose={() => setOtaOpen(false)}
        onConfirm={() => {
          queueInstallOta();
          setOtaOpen(false);
        }}
        title="Install OTA update?"
        description="Downloads the published player package only (media sync is not mixed). Starts after the next heartbeat."
        confirmLabel="Install OTA"
        tone="default"
      />

      <ConfirmModal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          queue('Clear SD cache', 'CLEAR_SD_CACHE');
          setClearOpen(false);
        }}
        title="Clear SD cache?"
        description="Wipes media cache + media pool, then media-only sync. OTA pool is not deleted. Runs after next heartbeat."
        confirmLabel="Clear cache"
        tone="danger"
      />
    </div>
  );
}
