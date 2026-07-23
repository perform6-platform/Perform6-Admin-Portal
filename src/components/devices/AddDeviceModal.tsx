import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, ModalBody } from '../ui';
import type { ClaimPairingPayload } from '../../types/devices';

export interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: ClaimPairingPayload) => void;
  isSubmitting?: boolean;
}

const emptyForm: ClaimPairingPayload = {
  pairingCode: '',
  deviceName: '',
};

export function AddDeviceModal({ open, onClose, onSubmit, isSubmitting = false }: AddDeviceModalProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
    }
  }, [open]);

  function handleClose() {
    if (isSubmitting) return;
    setForm(emptyForm);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.({
      pairingCode: form.pairingCode.trim(),
      deviceName: form.deviceName.trim(),
    });
  }

  function updateField<K extends keyof ClaimPairingPayload>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add device"
      description="Enter the pairing code shown on the BrightSign device and give it a name to claim it."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-device-form"
            size="sm"
            className="h-9 px-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add device'}
          </Button>
        </>
      }
    >
      <ModalBody>
        <form id="add-device-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Pairing code"
            placeholder="e.g. 482913"
            value={form.pairingCode}
            onChange={(event) => updateField('pairingCode', event.target.value)}
            required
          />
          <Input
            label="Device name"
            placeholder="e.g. Gym Screen 1"
            value={form.deviceName}
            onChange={(event) => updateField('deviceName', event.target.value)}
            required
          />
        </form>
      </ModalBody>
    </Modal>
  );
}
