import { useState } from 'react';
import { Download, Link2, Link2Off, Ban } from 'lucide-react';
import type { Device } from '../../constants/devices';
import { useRotationSchedule } from '../../context/RotationScheduleContext';
import { useToast } from '../../context/ToastContext';
import {
  useAttachDevice,
  useDisableDevice,
  useDisconnectDevice,
} from '../../hooks/useDevices';
import { cn } from '../../lib/cn';
import { formatDeviceContentAxes } from '../../lib/deploymentDisplay';
import {
  exportRotationScheduleCsv,
  getDeviceScheduleExportFilename,
} from '../../lib/exportRotationSchedule';
import { getApiErrorMessage } from '../../services/axios';
import { AttachDeviceModal } from './AttachDeviceModal';
import { BrightSignDeviceImage } from './BrightSignDeviceImage';
import { Badge, Button, Card, CardTitle, ConfirmModal } from '../ui';

interface DeviceDetailsPanelProps {
  device: Device | null;
  className?: string;
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-body-sm text-content-secondary">{label}</span>
      <span className="text-right text-body-sm text-content-primary">{value}</span>
    </div>
  );
}

export function DeviceDetailsPanel({ device, className }: DeviceDetailsPanelProps) {
  const { getRowByDay } = useRotationSchedule();
  const { showToast } = useToast();
  const { mutateAsync: disconnect, isPending: isDisconnecting } = useDisconnectDevice();
  const { mutateAsync: disable, isPending: isDisabling } = useDisableDevice();
  const { mutateAsync: attach, isPending: isAttaching } = useAttachDevice();

  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  if (!device) {
    return (
      <Card className={cn('flex min-h-[320px] items-center justify-center p-6', className)}>
        <p className="text-center text-body-sm text-content-muted">Select a device to view details</p>
      </Card>
    );
  }

  const registeredDeviceId = device.deviceId ?? null;
  const isRegistered = device.inventoryState === 'registered' && Boolean(registeredDeviceId);
  const isDisabled = device.activationStatus === 'DISABLED';
  const isAttached = Boolean(device.deploymentId);
  const canDisconnect = isRegistered && isAttached && !isDisabled;
  const canDisable = isRegistered && !isAttached && !isDisabled;
  const canAttach = isRegistered && !isAttached && !isDisabled;
  const axes = formatDeviceContentAxes(device);

  function handleExportSchedule() {
    exportRotationScheduleCsv(getRowByDay, getDeviceScheduleExportFilename(device!.name));
  }

  async function handleDisconnect() {
    if (!registeredDeviceId) return;
    try {
      const result = await disconnect(registeredDeviceId);
      showToast({
        title: 'Device disconnected',
        message: result.cluster
          ? 'Entire cluster was removed from the deployment. Token kept for re-attach.'
          : 'Removed from deployment. Token kept for re-attach.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to disconnect device'),
        variant: 'error',
      });
    }
  }

  async function handleDisable() {
    if (!registeredDeviceId) return;
    try {
      await disable(registeredDeviceId);
      showToast({
        title: 'Device disabled',
        message: 'Auth revoked. Restart the simulator to pair and register again.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to disable device'),
        variant: 'error',
      });
    }
  }

  async function handleAttach(deploymentId: string) {
    if (!registeredDeviceId) return;
    try {
      const result = await attach({ deviceId: registeredDeviceId, deploymentId });
      setAttachOpen(false);
      showToast({
        title: 'Device attached',
        message: result.deploymentName
          ? `Connected to ${result.deploymentName}.`
          : 'Connected to deployment.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to attach device'),
        variant: 'error',
      });
    }
  }

  return (
    <Card className={cn('p-6', className)}>
      <CardTitle className="mb-4">Device Details</CardTitle>

      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-content-primary">{device.name}</h3>
          <p className="mt-0.5 text-body-sm text-content-secondary">
            {axes.summary !== '—' ? axes.summary : device.location}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={device.status === 'online' ? 'success' : 'neutral'}>
            {device.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
          {isDisabled && <Badge variant="warning">Disabled</Badge>}
          {isRegistered && !isDisabled && !isAttached && (
            <Badge variant="neutral">Disconnected</Badge>
          )}
        </div>
      </div>
      {device.status === 'offline' && isRegistered ? (
        <p className="mb-4 text-caption text-content-muted">
          Offline means no heartbeat/sync in the last 5 minutes — fleet state can still be Registered.
        </p>
      ) : null}

      <div className="mb-2 rounded-lg bg-surface-muted/80 px-4 py-4 dark:bg-[var(--color-surface-muted)]">
        <BrightSignDeviceImage />
        <p className="mt-1 text-center text-body-sm text-content-primary">{device.model}</p>
      </div>

      <div className="divide-y divide-surface-border border-y border-surface-border">
        <DetailRow label="Serial Number" value={device.serialNumber} />
        <DetailRow label="Model" value={device.model} />
        <DetailRow label="Firmware" value={device.firmware} />
        <DetailRow label="Location" value={device.location} />
        <DetailRow
          label={axes.isAxisFree ? 'Content' : 'Field'}
          value={axes.fieldLabel}
        />
        <DetailRow
          label={axes.isAxisFree ? 'Program' : 'Variant'}
          value={axes.variantLabel}
        />
        <DetailRow
          label="Fleet State"
          value={
            device.inventoryState === 'registered'
              ? 'Registered'
              : device.inventoryState === 'claimed'
                ? 'Claimed'
                : 'Pending'
          }
        />
        {device.pairingCode ? <DetailRow label="Pairing Code" value={device.pairingCode} /> : null}
        <DetailRow label="Timezone" value={device.timezone?.trim() || '—'} />
        <DetailRow label="Last Seen" value={device.lastSync} />
        <DetailRow label="Current Day" value={device.currentDay} />
        <DetailRow
          label="Deployment"
          value={
            isDisabled
              ? 'Disabled'
              : device.deploymentName
                ? device.deploymentType
                  ? `${device.deploymentName} (${device.deploymentType})`
                  : device.deploymentName
                : 'None'
          }
        />
        <div className="py-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-body-sm text-content-secondary">Storage Used</span>
            <span className="text-body-sm text-content-primary">{device.storageUsed}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${device.storageUsed}%` }}
            />
          </div>
        </div>
        <DetailRow label="Mac Address" value={device.macAddress?.trim() || '—'} />
      </div>

      <div className="mt-4 space-y-2">
        {canDisconnect && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full gap-2"
            disabled={isDisconnecting}
            onClick={() => setDisconnectOpen(true)}
          >
            <Link2Off className="h-4 w-4" />
            {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        )}
        {canAttach && (
          <Button
            type="button"
            size="sm"
            className="h-9 w-full gap-2"
            disabled={isAttaching}
            onClick={() => setAttachOpen(true)}
          >
            <Link2 className="h-4 w-4" />
            Attach to deployment
          </Button>
        )}
        {canDisable && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full gap-2 hover:border-status-danger/30 hover:text-status-danger"
            disabled={isDisabling}
            onClick={() => setDisableOpen(true)}
          >
            <Ban className="h-4 w-4" />
            {isDisabling ? 'Disabling…' : 'Disable'}
          </Button>
        )}
        {isRegistered && isAttached && !isDisabled && (
          <p className="text-caption text-content-muted">
            To disable or re-pair, disconnect from the deployment first.
          </p>
        )}
        {canDisable && (
          <p className="text-caption text-content-muted">
            Disable frees the serial for a fresh pair → claim → register.
          </p>
        )}
        <Button type="button" size="sm" className="h-9 w-full gap-2" onClick={handleExportSchedule}>
          <Download className="h-4 w-4" />
          Export Schedule
        </Button>
      </div>

      <ConfirmModal
        open={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        onConfirm={() => {
          void handleDisconnect();
        }}
        title="Disconnect device?"
        description={
          device.model.toUpperCase().includes('HD226')
            ? 'Removes this unit (and the full HD226 cluster if linked) from the deployment. Auth token stays valid for Attach.'
            : 'Removes this device from its deployment. Auth token stays valid for Attach.'
        }
        confirmLabel="Disconnect"
        tone="danger"
      />

      <ConfirmModal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        onConfirm={() => {
          void handleDisable();
        }}
        title="Disable device?"
        description="Revokes the API token and frees the serial for re-pairing. Restart the simulator afterward to pair again."
        confirmLabel="Disable"
        tone="danger"
      />

      <AttachDeviceModal
        open={attachOpen}
        deviceName={device.name}
        isSubmitting={isAttaching}
        onClose={() => setAttachOpen(false)}
        onSubmit={(deploymentId) => {
          void handleAttach(deploymentId);
        }}
      />
    </Card>
  );
}
