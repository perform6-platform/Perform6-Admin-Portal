import { useEffect, useState, type FormEvent } from 'react';
import type { Device } from '../../constants/devices';
import { useFacilityTimezoneLookup } from '../../hooks/useFacilityTimezoneLookup';
import { Button, Dropdown, Input, Modal, ModalBody } from '../ui';

export interface EditFacilityModalProps {
  open: boolean;
  device: Device | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string | null;
    facilityAddress: string;
    facilityCity: string;
    facilityState: string;
    facilityZip: string;
    timezone: string;
  }) => void;
}

export function EditFacilityModal({
  open,
  device,
  isSaving = false,
  onClose,
  onSubmit,
}: EditFacilityModalProps) {
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [facilityCity, setFacilityCity] = useState('');
  const [facilityState, setFacilityState] = useState('');
  const [facilityZip, setFacilityZip] = useState('');
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    if (!open || !device) return;
    setOwnerName(device.ownerName?.trim() || '');
    setOwnerEmail(device.ownerEmail?.trim() || '');
    setOwnerPhone(device.ownerPhone?.trim() || '');
    setFacilityAddress(device.facilityAddress?.trim() || '');
    setFacilityCity(device.facilityCity?.trim() || '');
    setFacilityState(device.facilityState?.trim() || '');
    setFacilityZip(device.facilityZip?.trim() || '');
    setTimezone(device.scheduleTimeZone?.trim() || device.timezone?.trim() || '');
  }, [open, device]);

  const {
    addressComplete: facilityAddressComplete,
    timezoneOptions,
    suggestedZones,
    isLookingUp: timezoneLookingUp,
    lookupError: timezoneLookupError,
  } = useFacilityTimezoneLookup({
    facilityAddress,
    facilityCity,
    facilityState,
    facilityZip,
    enabled: open,
    currentTimezone: timezone,
  });

  useEffect(() => {
    if (!open) return;
    if (!facilityAddressComplete) {
      setTimezone('');
      return;
    }
    if (suggestedZones.length === 0) return;
    setTimezone((current) => {
      if (current && suggestedZones.includes(current)) return current;
      return suggestedZones[0]!;
    });
  }, [facilityAddressComplete, suggestedZones, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!device) return;
    onSubmit({
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      ownerPhone: ownerPhone.trim() || null,
      facilityAddress: facilityAddress.trim(),
      facilityCity: facilityCity.trim(),
      facilityState: facilityState.trim().toUpperCase(),
      facilityZip: facilityZip.trim(),
      timezone: timezone.trim(),
    });
  }

  const canSave =
    Boolean(ownerName.trim()) &&
    Boolean(ownerEmail.trim()) &&
    Boolean(facilityAddress.trim()) &&
    Boolean(facilityCity.trim()) &&
    Boolean(facilityState.trim()) &&
    Boolean(facilityZip.trim()) &&
    Boolean(timezone.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Facility contact & location"
      description={
        device
          ? `Update the facility record for ${device.name}. This replaces IP-based location when set.`
          : undefined
      }
      footer={
        <>
          <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-facility-form"
            size="sm"
            className="h-9 px-4"
            disabled={!device || !canSave || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <ModalBody>
        <form id="edit-facility-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Contact Name"
            placeholder="John Smith"
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            required
          />
          <Input
            label="Contact Email"
            type="email"
            placeholder="john@example.com"
            value={ownerEmail}
            onChange={(event) => setOwnerEmail(event.target.value)}
            required
          />
          <Input
            label="Facility Address"
            placeholder="123 Main Street"
            value={facilityAddress}
            onChange={(event) => setFacilityAddress(event.target.value)}
            required
          />
          <Input
            label="City"
            placeholder="Jacksonville"
            value={facilityCity}
            onChange={(event) => setFacilityCity(event.target.value)}
            required
          />
          <Input
            label="State"
            placeholder="FL"
            value={facilityState}
            onChange={(event) => setFacilityState(event.target.value.toUpperCase())}
            required
          />
          <Input
            label="ZIP Code"
            placeholder="32256"
            value={facilityZip}
            onChange={(event) => setFacilityZip(event.target.value)}
            required
          />
          <Input
            label="Contact Phone"
            placeholder="(555) 555-0100"
            value={ownerPhone}
            onChange={(event) => setOwnerPhone(event.target.value)}
          />
          <div>
            <p className="mb-1 text-xs font-medium text-content-muted">Facility Time Zone</p>
            <Dropdown
              options={timezoneOptions}
              value={timezone}
              onChange={setTimezone}
              fullWidth
              disabled={!facilityAddressComplete || timezoneLookingUp}
              placeholder={
                !facilityAddressComplete
                  ? 'Fill address, city, state, and ZIP first'
                  : timezoneLookingUp
                    ? 'Looking up timezone…'
                    : 'Select timezone'
              }
            />
            {timezoneLookupError ? (
              <p className="mt-1 text-caption text-content-muted">{timezoneLookupError}</p>
            ) : null}
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}
