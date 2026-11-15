import { useEffect, useState, type FormEvent } from 'react';
import type { Device } from '../../constants/devices';
import { Button, Input, Modal, ModalBody } from '../ui';

export interface RenameDeviceModalProps {
  open: boolean;
  device: Device | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: { id: string; deviceName: string }) => void;
}

export function RenameDeviceModal({
  open,
  device,
  isSaving = false,
  onClose,
  onSubmit,
}: RenameDeviceModalProps) {
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    if (!open || !device) return;
    setDeviceName(device.name?.trim() || '');
  }, [open, device]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!device) return;
    const trimmed = deviceName.trim();
    if (!trimmed) return;
    const id = device.deviceId?.trim() || device.pairingId?.trim() || device.id;
    onSubmit({ id, deviceName: trimmed });
  }

  const canSave = Boolean(deviceName.trim()) && Boolean(device);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rename device"
      description={
        device
          ? `This name shows across Devices, Deployments, and Content Syncing.`
          : undefined
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="rename-device-form"
            size="sm"
            className="h-9 px-4"
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save name'}
          </Button>
        </>
      }
    >
      <ModalBody>
        <form id="rename-device-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Device name"
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
            placeholder="e.g. Lobby Screen"
            required
            autoFocus
          />
          {device?.serialNumber ? (
            <p className="text-caption text-content-muted">
              Serial: {device.serialNumber}
            </p>
          ) : null}
        </form>
      </ModalBody>
    </Modal>
  );
}
