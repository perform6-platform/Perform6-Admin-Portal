import { useState } from 'react';
import {
  Download,
  FileText,
  HardDriveDownload,
  Power,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useQueueDeviceRemoteCommand, useRetryDeviceOta } from '../../hooks/useDevices';
import type { DeviceRemoteCommandAction } from '../../types/monitoring';
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
  const [forceHealOpen, setForceHealOpen] = useState(false);

  const queue = (
    label: string,
    action: DeviceRemoteCommandAction,
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
          setLastQueued(`${label} queued — runs on next player heartbeat (~60s).`),
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
          onClick={() => queue('Bridge recycle', 'BRIDGE_RECYCLE')}
        >
          <RotateCcw className="h-4 w-4" />
          Bridge recycle
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || busy}
          onClick={() => setForceHealOpen(true)}
        >
          <ShieldAlert className="h-4 w-4" />
          Force bridge heal
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
          Commands run on the next heartbeat (~60s).{' '}
          <span className="font-medium">Bridge recycle</span> = soft HtmlWidget reload.{' '}
          <span className="font-medium">Force bridge heal</span> = reboot even if heal
          cooldown active.
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
        open={forceHealOpen}
        onClose={() => setForceHealOpen(false)}
        onConfirm={() => {
          queue('Force bridge heal', 'FORCE_BRIDGE_HEAL');
          setForceHealOpen(false);
        }}
        title="Force bridge heal reboot?"
        description="Bypasses the heal cooldown marker and reboots the player to recover a dead JS↔autorun bridge."
        confirmLabel="Force heal"
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
      />

      <ConfirmModal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          queue('Clear SD cache', 'CLEAR_SD_CACHE');
          setClearOpen(false);
        }}
        title="Clear SD media cache?"
        description="Wipes cached media on the player SD, then runs a media-only sync."
        confirmLabel="Clear cache"
        tone="danger"
      />
    </div>
  );
}
