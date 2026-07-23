import { useEffect, useState, type FormEvent } from 'react';
import type { Device, DeviceStatus } from '../../constants/devices';
import {
  assignableLocations,
  getLocationKeyFromLabel,
  getLocationLabelFromKey,
} from '../../constants/devices';
import { Button, Dropdown, Input, Modal, ModalBody } from '../ui';

const deviceStatusOptions = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
] as const;

export interface EditDeviceModalProps {
  open: boolean;
  device: Device | null;
  onClose: () => void;
  onSubmit?: (payload: {
    id: string;
    deviceName: string;
    location: string;
    currentDay: string;
    status: DeviceStatus;
  }) => void;
}

export function EditDeviceModal({ open, device, onClose, onSubmit }: EditDeviceModalProps) {
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState(assignableLocations[0]?.value ?? 'new-york');
  const [currentDay, setCurrentDay] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('online');

  useEffect(() => {
    if (!open || !device) return;

    setDeviceName(device.name);
    setLocation(getLocationKeyFromLabel(device.location));
    setCurrentDay(device.currentDay);
    setStatus(device.status);
  }, [open, device]);

  function handleClose() {
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!device) return;

    onSubmit?.({
      id: device.id,
      deviceName: deviceName.trim(),
      location: getLocationLabelFromKey(location),
      currentDay: currentDay.trim(),
      status,
    });
    handleClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit device"
      description={device ? `Update settings for ${device.name}.` : undefined}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-device-form" size="sm" className="h-9 px-4" disabled={!device}>
            Save changes
          </Button>
        </>
      }
    >
      <ModalBody>
        <form id="edit-device-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Device name"
            placeholder="e.g. BrightSign-001"
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">Location</label>
            <Dropdown
              options={[...assignableLocations]}
              value={location}
              onChange={setLocation}
              fullWidth
            />
          </div>
          <Input
            label="Current day"
            placeholder="e.g. Day 14"
            value={currentDay}
            onChange={(event) => setCurrentDay(event.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">Status</label>
            <Dropdown
              options={[...deviceStatusOptions]}
              value={status}
              onChange={(value) => setStatus(value as DeviceStatus)}
              fullWidth
            />
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}
