import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button, DatePicker, Dropdown, Input, Modal, ModalBody, SectionLabel } from '../ui';
import {
  useAddClusterMember,
  useCategoryVariants,
  useDeployment,
  useUpdateDeployment,
} from '../../hooks/useDeployments';
import { useClaimedDevices } from '../../hooks/useDevices';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../context/ToastContext';
import { useGlobalRotationSettings } from '../../hooks/useRotation';
import { cn } from '../../lib/cn';
import {
  formatLinkedDeviceNames,
  formatPortalDate,
  resolveDeploymentRotationMode,
  resolveDeploymentScreens,
} from '../../lib/deploymentDisplay';
import { composeSiteAddress } from '../../lib/facilityLocation';
import { useFacilityTimezoneLookup } from '../../hooks/useFacilityTimezoneLookup';
import { DEFAULT_DEPLOYMENT_SCREENS } from '../../lib/screenCategoryDefaults';
import {
  categoryRequiresProgramPicker,
  deploymentRequiresField,
  deploymentRequiresVariant,
  findCategoryById,
  formatDeviceScreenLabel,
  HD226_MAX_PLAYERS,
  isHdModel,
  orderCategoriesForDropdown,
  paletteLabel,
  playlistOptionsForCategory,
} from '../../lib/deploymentWizard';
import { getApiErrorMessage } from '../../services/axios';
import type {
  DeploymentClusterSlot,
  DeploymentEntity,
  RotationMode,
  UpdateDeploymentPayload,
} from '../../types/deployments';
import type { ContentCategory } from '../../types/categories';
import type { DeviceInventoryItem } from '../../types/devices';

function memberKeyIndex(memberKey: string): number {
  const letter = memberKey.replace(/^DEVICE_/, '').charAt(0);
  const index = letter.charCodeAt(0) - 65;
  return index >= 0 && index < HD226_MAX_PLAYERS ? index : 0;
}

function nextFreeSlotIndex(slots: DeploymentClusterSlot[]): number {
  const used = new Set(slots.map((slot) => slot.memberKey));
  for (let index = 0; index < HD226_MAX_PLAYERS; index += 1) {
    const key = `DEVICE_${String.fromCharCode(65 + index)}`;
    if (!used.has(key)) return index;
  }
  return -1;
}

function deviceOptionLabel(device: DeviceInventoryItem): string {
  return `${device.deviceName || device.serialNumber || 'Device'} — ${device.model || 'Unknown'}${
    device.location ? ` · ${device.location}` : ''
  }`;
}

export interface EditDeploymentModalProps {
  open: boolean;
  deployment: DeploymentEntity | null;
  onClose: () => void;
  onSaved?: () => void;
}

type ScreenRoute = { categoryId: string; playlistKey?: string };

function isDefaultDeployment(type: string | undefined): boolean {
  return (type ?? '').toUpperCase().includes('DEFAULT');
}

function routeValid(
  categories: ContentCategory[],
  categoryId: string,
  playlistKey?: string,
): boolean {
  if (!categoryId) return false;
  const category = findCategoryById(categories, categoryId);
  if (!category) return false;
  if (categoryRequiresProgramPicker(category.scope)) {
    return Boolean(playlistKey);
  }
  return true;
}

export function EditDeploymentModal({
  open,
  deployment,
  onClose,
  onSaved,
}: EditDeploymentModalProps) {
  const { showToast } = useToast();
  const { mutateAsync: updateDeployment, isPending } = useUpdateDeployment();
  const { data: detail, refetch: refetchDetail } = useDeployment(
    open && deployment ? deployment.id : null,
  );
  const { data: contentCategories = [] } = useCategories();
  const { data: claimedInventory } = useClaimedDevices();
  const claimedDevices = claimedInventory?.items ?? [];

  const [deploymentName, setDeploymentName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldCategory, setFieldCategory] = useState('');
  const [exerciseVariant, setExerciseVariant] = useState('');
  const [screenRoutes, setScreenRoutes] = useState<Record<string, ScreenRoute>>({});
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [facilityCity, setFacilityCity] = useState('');
  const [facilityState, setFacilityState] = useState('');
  const [facilityZip, setFacilityZip] = useState('');
  const [facilityTimezone, setFacilityTimezone] = useState('');
  const [rotationMode, setRotationMode] = useState<RotationMode>('GLOBAL');
  const [rotationStartDate, setRotationStartDate] = useState<Date | undefined>(new Date());
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [addPairingId, setAddPairingId] = useState('');
  const [addCategoryId, setAddCategoryId] = useState('');
  const [addPlaylistKey, setAddPlaylistKey] = useState<string | undefined>(undefined);
  const { data: globalRotationSettings } = useGlobalRotationSettings();
  const globalRotationStartDate = globalRotationSettings?.globalRotationStartDate ?? null;

  const source = detail ?? deployment;
  const showScreenEditor = isDefaultDeployment(source?.deploymentType);
  const clusterSlots = useMemo(
    () => source?.clusterSlots ?? [],
    [source?.clusterSlots],
  );
  const isHdCluster = clusterSlots.length > 0;
  const {
    mutateAsync: addClusterMember,
    isPending: isAddingMember,
  } = useAddClusterMember(open && deployment ? deployment.id : null);

  const editorScreens = useMemo(() => {
    const fromSource = resolveDeploymentScreens(source).filter(
      (screen): screen is typeof screen & { screenKey: string } =>
        Boolean(screen.screenKey),
    );
    const reservedKeys = new Set(
      (source?.clusterSlots ?? [])
        .filter((slot) => slot.status === 'reserved')
        .map((slot) => slot.screenKey),
    );
    if (fromSource.length > 0) {
      return fromSource.map((screen) => {
        const match = /^SCREEN_(\d+)$/i.exec(screen.screenKey);
        const index = match ? Math.max(0, Number(match[1]) - 1) : 0;
        const reserved = reservedKeys.has(screen.screenKey);
        return {
          screenKey: screen.screenKey,
          label: reserved
            ? `${formatDeviceScreenLabel(index)} (reserved)`
            : formatDeviceScreenLabel(index),
        };
      });
    }
    return DEFAULT_DEPLOYMENT_SCREENS.map((screen, index) => ({
      screenKey: screen.screenKey,
      label: formatDeviceScreenLabel(index),
    }));
  }, [source]);

  const selectedCategoryIds = useMemo(
    () =>
      Object.values(screenRoutes)
        .map((route) => route.categoryId)
        .filter(Boolean),
    [screenRoutes],
  );

  const needsField = useMemo(() => {
    if (!showScreenEditor) return true;
    return deploymentRequiresField(contentCategories, selectedCategoryIds);
  }, [showScreenEditor, contentCategories, selectedCategoryIds]);

  const needsVariant = useMemo(() => {
    if (!showScreenEditor) return true;
    return deploymentRequiresVariant(contentCategories, selectedCategoryIds);
  }, [showScreenEditor, contentCategories, selectedCategoryIds]);

  const { data: variants = [] } = useCategoryVariants(
    needsField && fieldCategory ? fieldCategory : null,
  );

  const categoryOptions = useMemo(
    () =>
      orderCategoriesForDropdown(contentCategories).map((category) => ({
        value: category.id,
        label: paletteLabel(category),
      })),
    [contentCategories],
  );

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
    currentTimezone: facilityTimezone,
  });

  const linkedDeviceLabel = useMemo(
    () => (source ? formatLinkedDeviceNames(source) : '—'),
    [source],
  );

  const hdClaimedDevices = useMemo(
    () =>
      claimedDevices.filter(
        (device) => isHdModel(device.model) && Boolean(device.pairingId),
      ),
    [claimedDevices],
  );

  const nextSlotIndex = useMemo(
    () => nextFreeSlotIndex(clusterSlots),
    [clusterSlots],
  );

  const addCategory = findCategoryById(contentCategories, addCategoryId);
  const addNeedsProgram =
    Boolean(addCategory) && categoryRequiresProgramPicker(addCategory!.scope);
  const addProgramOptions = playlistOptionsForCategory(addCategory);
  const canConfirmAddDevice =
    Boolean(addPairingId) &&
    routeValid(contentCategories, addCategoryId, addPlaylistKey) &&
    nextSlotIndex >= 0;

  useEffect(() => {
    if (!open) {
      setAddDeviceOpen(false);
      setAddPairingId('');
      setAddCategoryId('');
      setAddPlaylistKey(undefined);
    }
  }, [open]);

  useEffect(() => {
    if (!source || !open) return;
    setDeploymentName(
      typeof source.name === 'string' ? source.name : '',
    );
    setDescription(
      typeof source.description === 'string' ? source.description : '',
    );
    setFieldCategory(source.fieldCategory ?? '');
    setExerciseVariant(source.exerciseVariant ?? '');

    const screens = resolveDeploymentScreens(source);
    const nextRoutes: Record<string, ScreenRoute> = {};
    for (const screen of editorScreens) {
      nextRoutes[screen.screenKey] = { categoryId: '', playlistKey: undefined };
    }
    for (const screen of screens) {
      if (!screen.screenKey) continue;
      nextRoutes[screen.screenKey] = {
        categoryId: screen.categoryId ?? '',
        playlistKey: screen.playlistKey ?? undefined,
      };
    }
    setScreenRoutes(nextRoutes);

    const contact = source.siteContact;
    const deviceFallback = source.devices?.[0] as
      | Record<string, unknown>
      | undefined;
    setOwnerName(
      String(contact?.ownerName ?? deviceFallback?.ownerName ?? '').trim(),
    );
    setOwnerEmail(
      String(contact?.ownerEmail ?? deviceFallback?.ownerEmail ?? '').trim(),
    );
    setOwnerPhone(
      String(contact?.ownerPhone ?? deviceFallback?.ownerPhone ?? '').trim(),
    );
    setFacilityAddress(
      String(
        contact?.facilityAddress ?? deviceFallback?.facilityAddress ?? '',
      ).trim(),
    );
    setFacilityCity(
      String(contact?.facilityCity ?? deviceFallback?.facilityCity ?? '').trim(),
    );
    setFacilityState(
      String(
        contact?.facilityState ?? deviceFallback?.facilityState ?? '',
      ).trim(),
    );
    setFacilityZip(
      String(contact?.facilityZip ?? deviceFallback?.facilityZip ?? '').trim(),
    );
    setFacilityTimezone(
      String(contact?.timezone ?? deviceFallback?.timezone ?? '').trim(),
    );

    const mode = resolveDeploymentRotationMode(source);
    setRotationMode(mode === 'DEVICE' ? 'DEVICE' : 'GLOBAL');
    const existingStart = (source.devices ?? [])
      .map((device) => device.rotationStartDate)
      .find((value): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value));
    if (existingStart) {
      const [year, month, day] = existingStart.slice(0, 10).split('-').map(Number);
      const parsed = new Date(year, (month ?? 1) - 1, day);
      setRotationStartDate(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
    } else {
      setRotationStartDate(new Date());
    }
  }, [source, open, editorScreens]);

  useEffect(() => {
    if (!open) return;
    if (!facilityAddressComplete) {
      setFacilityTimezone('');
      return;
    }
    if (suggestedZones.length === 0) return;
    setFacilityTimezone((current) => {
      if (current && suggestedZones.includes(current)) return current;
      return suggestedZones[0]!;
    });
  }, [facilityAddressComplete, suggestedZones, open]);

  const screensValid =
    !showScreenEditor ||
    editorScreens.every((screen) => {
      const route = screenRoutes[screen.screenKey];
      return routeValid(contentCategories, route?.categoryId ?? '', route?.playlistKey);
    });

  const axesValid =
    (!needsField || Boolean(fieldCategory)) &&
    (!needsVariant || Boolean(exerciseVariant));

  const hasLinkedDevices = (source?.devices?.length ?? 0) > 0;
  const facilityValid =
    !hasLinkedDevices ||
    (Boolean(ownerName.trim()) &&
      Boolean(ownerEmail.trim()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()) &&
      Boolean(facilityAddress.trim()) &&
      Boolean(facilityCity.trim()) &&
      Boolean(facilityState.trim()) &&
      Boolean(facilityZip.trim()) &&
      Boolean(facilityTimezone.trim()));

  const rotationValid =
    rotationMode === 'DEVICE'
      ? Boolean(rotationStartDate)
      : globalRotationSettings == null || Boolean(globalRotationStartDate);

  const canSave =
    Boolean(deploymentName.trim()) &&
    screensValid &&
    axesValid &&
    facilityValid &&
    rotationValid;

  function updateScreenRoute(screenKey: string, patch: Partial<ScreenRoute>) {
    setScreenRoutes((current) => ({
      ...current,
      [screenKey]: {
        categoryId: current[screenKey]?.categoryId ?? '',
        playlistKey: current[screenKey]?.playlistKey,
        ...patch,
      },
    }));
  }

  async function handleAddClusterDevice() {
    if (!deployment || !canConfirmAddDevice) return;
    const selected = hdClaimedDevices.find(
      (device) => device.pairingId === addPairingId,
    );
    try {
      const result = await addClusterMember({
        pairingId: addPairingId,
        ...(selected?.deviceName ? { deviceName: selected.deviceName } : {}),
        categoryId: addCategoryId,
        ...(addPlaylistKey ? { playlistKey: addPlaylistKey } : {}),
      });
      showToast({
        title: 'Device added to cluster',
        message: `${formatDeviceScreenLabel(memberKeyIndex(result.memberKey))} linked.`,
        variant: 'success',
      });
      setAddDeviceOpen(false);
      setAddPairingId('');
      setAddCategoryId('');
      setAddPlaylistKey(undefined);
      await refetchDetail();
      onSaved?.();
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to add device'),
        variant: 'error',
      });
    }
  }

  async function handleSave() {
    if (!deployment || !canSave) return;

    const composed = composeSiteAddress({
      facilityAddress,
      facilityCity,
      facilityState,
      facilityZip,
    });

    const payload: UpdateDeploymentPayload = {
      name: deploymentName.trim(),
      description: description.trim() || undefined,
      rotationMode,
      ...(rotationMode === 'DEVICE' && rotationStartDate
        ? { rotationStartDate: format(rotationStartDate, 'yyyy-MM-dd') }
        : {}),
      ...(hasLinkedDevices
        ? {
            siteContact: {
              ownerName: ownerName.trim(),
              ownerEmail: ownerEmail.trim(),
              ...(ownerPhone.trim() ? { ownerPhone: ownerPhone.trim() } : {}),
              facilityAddress: facilityAddress.trim(),
              facilityCity: facilityCity.trim(),
              facilityState: facilityState.trim().toUpperCase(),
              facilityZip: facilityZip.trim(),
              timezone: facilityTimezone.trim(),
              ...(composed ? { siteAddress: composed } : {}),
            },
          }
        : {}),
    };

    if (needsField && fieldCategory) {
      payload.fieldCategory = fieldCategory;
    } else if (showScreenEditor) {
      payload.fieldCategory = null;
    }
    if (needsVariant && exerciseVariant) {
      payload.exerciseVariant = exerciseVariant;
    } else if (showScreenEditor) {
      payload.exerciseVariant = null;
    }

    if (showScreenEditor) {
      payload.screenCategories = editorScreens.map((screen) => {
        const route = screenRoutes[screen.screenKey]!;
        return {
          screenKey: screen.screenKey,
          categoryId: route.categoryId,
          ...(route.playlistKey ? { playlistKey: route.playlistKey } : {}),
        };
      });
    }

    try {
      await updateDeployment({ id: deployment.id, payload });
      showToast({
        title: 'Deployment updated',
        message: 'Changes apply on the next device sync.',
        variant: 'success',
      });
      onSaved?.();
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to update deployment'),
        variant: 'error',
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit deployment"
      description="Update deployment name, content, screens, facility contact, or rotation. Rename devices from the Devices page."
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 px-4"
            onClick={() => void handleSave()}
            disabled={isPending || !canSave}
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <ModalBody>
        <div className="space-y-4">
          <Input
            label="Deployment Name"
            value={deploymentName}
            onChange={(event) => setDeploymentName(event.target.value)}
            placeholder="P6-HD-D2"
            required
          />
          {isHdCluster ? (
            <div className="space-y-3 rounded-lg border border-surface-border p-4">
              <SectionLabel className="block">Cluster devices</SectionLabel>
              <p className="text-caption text-content-secondary">
                Disconnect reserves a slot. Add Device always opens the next free
                slot — never fills a reserved hole. Attach restores the previous
                device to its reserved screen.
              </p>
              {clusterSlots.map((slot) => {
                const label = formatDeviceScreenLabel(memberKeyIndex(slot.memberKey));
                const isReserved = slot.status === 'reserved';
                return (
                  <div
                    key={slot.memberKey}
                    className="space-y-2 rounded-lg border border-surface-border p-3"
                  >
                    <p className="text-body-sm font-medium text-content-primary">
                      {label}
                      {isReserved ? (
                        <span className="ml-2 text-caption font-normal text-content-muted">
                          Reserved
                        </span>
                      ) : null}
                    </p>
                    <div>
                      <p className="mb-1 text-xs font-medium text-content-muted">
                        HD226 device
                      </p>
                      {isReserved ? (
                        <Dropdown
                          options={[
                            {
                              value: '',
                              label: 'Empty — reserved for previous device',
                            },
                          ]}
                          value=""
                          onChange={() => undefined}
                          fullWidth
                          disabled
                        />
                      ) : (
                        <p className="rounded-lg border border-surface-border bg-surface-muted/20 px-3 py-2 text-body-sm font-medium text-content-primary">
                          {slot.deviceName || slot.serialNumber || 'Linked device'}
                        </p>
                      )}
                    </div>
                    {isReserved ? (
                      <p className="text-caption text-content-muted">
                        Reconnect the same unit from Devices → Attach to restore
                        this screen and zone.
                      </p>
                    ) : null}
                  </div>
                );
              })}

              {addDeviceOpen && nextSlotIndex >= 0 ? (
                <div className="space-y-2 rounded-lg border border-brand-500/30 bg-brand-500/5 p-3">
                  <p className="text-body-sm font-medium text-content-primary">
                    {formatDeviceScreenLabel(nextSlotIndex)}
                    <span className="ml-2 text-caption font-normal text-content-muted">
                      New slot
                    </span>
                  </p>
                  <div>
                    <p className="mb-1 text-xs font-medium text-content-muted">
                      HD226 device
                    </p>
                    <Dropdown
                      options={[
                        { value: '', label: 'Select claimed HD226…' },
                        ...hdClaimedDevices.map((device) => ({
                          value: device.pairingId ?? '',
                          label: deviceOptionLabel(device),
                        })),
                      ]}
                      value={addPairingId}
                      onChange={setAddPairingId}
                      fullWidth
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-content-muted">
                      Player screen category
                    </p>
                    <Dropdown
                      options={[
                        { value: '', label: 'Select category…' },
                        ...categoryOptions,
                      ]}
                      value={addCategoryId}
                      onChange={(value) => {
                        setAddCategoryId(value);
                        setAddPlaylistKey(undefined);
                      }}
                      fullWidth
                    />
                    {addNeedsProgram ? (
                      <Dropdown
                        options={[
                          { value: '', label: 'Select zone…' },
                          ...addProgramOptions,
                        ]}
                        value={addPlaylistKey ?? ''}
                        onChange={(value) =>
                          setAddPlaylistKey(value || undefined)
                        }
                        fullWidth
                        className="mt-2"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 px-4"
                      disabled={!canConfirmAddDevice || isAddingMember}
                      onClick={() => void handleAddClusterDevice()}
                    >
                      {isAddingMember ? 'Adding…' : 'Confirm device'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-4"
                      disabled={isAddingMember}
                      onClick={() => {
                        setAddDeviceOpen(false);
                        setAddPairingId('');
                        setAddCategoryId('');
                        setAddPlaylistKey(undefined);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-4"
                disabled={
                  addDeviceOpen ||
                  nextSlotIndex < 0 ||
                  isAddingMember ||
                  clusterSlots.length >= HD226_MAX_PLAYERS
                }
                onClick={() => setAddDeviceOpen(true)}
              >
                Add Device
              </Button>
              {hdClaimedDevices.length === 0 ? (
                <p className="text-caption text-status-warning">
                  Claim an HD226 player first, then add it here.
                </p>
              ) : null}
            </div>
          ) : (
            <div>
              <p className="mb-1 text-xs font-medium text-content-muted">
                Device name
              </p>
              <p className="rounded-lg border border-surface-border bg-surface-muted/20 px-3 py-2 text-body-sm font-medium text-content-primary">
                {linkedDeviceLabel}
              </p>
              <p className="mt-1 text-caption text-content-muted">
                Read-only. Rename from the Devices table.
              </p>
            </div>
          )}
          <Input
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes"
          />

          <div className="space-y-3">
            <p className="text-xs font-medium text-content-muted">Rotation schedule</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-2 text-body-sm',
                  rotationMode === 'GLOBAL'
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                    : 'border-surface-border bg-surface-muted/20 text-content-secondary',
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="editRotationMode"
                    className="accent-brand-600"
                    checked={rotationMode === 'GLOBAL'}
                    onChange={() => setRotationMode('GLOBAL')}
                  />
                  Global Rotation
                </span>
                <span className="pl-6 text-caption text-content-secondary">
                  Deployment follows the synchronized Perform6 global rotation.
                </span>
              </label>
              <label
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-2 text-body-sm',
                  rotationMode === 'DEVICE'
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                    : 'border-surface-border bg-surface-muted/20 text-content-secondary',
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="editRotationMode"
                    className="accent-brand-600"
                    checked={rotationMode === 'DEVICE'}
                    onChange={() => setRotationMode('DEVICE')}
                  />
                  Custom Rotation
                </span>
                <span className="pl-6 text-caption text-content-secondary">
                  Deployment follows an independent rotation based on its configured start date.
                </span>
              </label>
            </div>
          </div>

          {rotationMode === 'DEVICE' ? (
            <div>
              <p className="mb-1 text-xs font-medium text-content-muted">Rotation start date</p>
              <DatePicker value={rotationStartDate} onChange={setRotationStartDate} />
              <p className="mt-1 text-caption text-content-secondary">
                This date establishes Day 1 for this deployment.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-surface-border bg-surface-muted/20 p-4 text-body-sm text-content-secondary">
              {globalRotationStartDate ? (
                <>
                  <p>
                    Global Day 1 :{' '}
                    <span className="font-medium text-content-primary">
                      {formatPortalDate(globalRotationStartDate)}
                    </span>
                  </p>
                  {globalRotationSettings?.currentRotationDay != null && (
                    <p className="mt-1">
                      Current platform day : Day {globalRotationSettings.currentRotationDay} of 36
                    </p>
                  )}
                </>
              ) : (
                <p className="text-status-warning">
                  Global rotation is not configured yet. Set the start date on the Rotation page
                  before content sync begins.
                </p>
              )}
            </div>
          )}

          {needsField && (
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">
                Content Type
              </label>
              <Dropdown
                fullWidth
                value={fieldCategory}
                onChange={(value) => {
                  setFieldCategory(value);
                  setExerciseVariant('');
                }}
                options={[
                  { value: 'FITNESS', label: 'Fitness' },
                  { value: 'GOLF', label: 'Golf' },
                ]}
              />
            </div>
          )}

          {needsVariant && (
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">
                Environment
              </label>
              <Dropdown
                fullWidth
                value={exerciseVariant}
                onChange={setExerciseVariant}
                options={variants.map((variant) => ({
                  value: String(variant.value ?? variant.id),
                  label: variant.label,
                }))}
                disabled={!fieldCategory}
                placeholder={
                  fieldCategory ? 'Select environment' : 'Select content type first'
                }
              />
            </div>
          )}

          {showScreenEditor && (
            <div className="space-y-4 rounded-lg border border-surface-border p-4">
              <SectionLabel className="block">Screen content</SectionLabel>
              <p className="text-caption text-content-secondary">
                Change which parent category (and program, when needed) plays on each
                screen.
              </p>
              {editorScreens.map((screen) => {
                const route = screenRoutes[screen.screenKey] ?? {
                  categoryId: '',
                  playlistKey: undefined,
                };
                const category = findCategoryById(contentCategories, route.categoryId);
                const showProgram =
                  category && categoryRequiresProgramPicker(category.scope);
                const programOptions = playlistOptionsForCategory(category);

                return (
                  <div key={screen.screenKey} className="space-y-2">
                    <p className="text-xs font-medium text-content-muted">
                      {screen.label}
                    </p>
                    <Dropdown
                      options={[
                        { value: '', label: 'Select category…' },
                        ...categoryOptions,
                      ]}
                      value={route.categoryId}
                      onChange={(value) =>
                        updateScreenRoute(screen.screenKey, {
                          categoryId: value,
                          playlistKey: undefined,
                        })
                      }
                      fullWidth
                    />
                    {showProgram && (
                      <Dropdown
                        options={[
                          { value: '', label: 'Select zone…' },
                          ...programOptions,
                        ]}
                        value={route.playlistKey ?? ''}
                        onChange={(value) =>
                          updateScreenRoute(screen.screenKey, {
                            playlistKey: value || undefined,
                          })
                        }
                        fullWidth
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4 rounded-lg border border-surface-border p-4">
            <SectionLabel className="block">
              Facility Contact – Device Notifications
            </SectionLabel>
            <p className="text-caption text-content-secondary">
              This contact will receive notifications about device connectivity and content
              synchronization. Saved on every device linked to this deployment.
            </p>
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
              <p className="mb-1 text-xs font-medium text-content-muted">
                Facility Time Zone
              </p>
              <Dropdown
                options={timezoneOptions}
                value={facilityTimezone}
                onChange={setFacilityTimezone}
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
                <p className="mt-1 text-caption text-content-muted">
                  {timezoneLookupError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
