import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BrandingLogoUpload } from './BrandingLogoUpload';
import { DeploymentStepper } from './DeploymentStepper';
import {
  Badge,
  Button,
  CARD_SURFACE_CLASS,
  DatePicker,
  Dropdown,
  Input,
  SectionLabel,
} from '../ui';
import { useToast } from '../../context/ToastContext';
import { useCreateBranding, usePlatformDefaultBranding } from '../../hooks/useBranding';
import { useCategories } from '../../hooks/useCategories';
import {
  useCategoryVariants,
  useDeploymentCategories,
  useDeploymentPreview,
  useDeploymentTypes,
  useRegisterDeployment,
} from '../../hooks/useDeployments';
import { useDevices as useInventoryDevices } from '../../hooks/useDevices';
import { resolveStorageUrl } from '../../lib/libraryType';
import {
  formatPreviewDuration,
  parseDeploymentPreviewSlots,
} from '../../lib/deploymentPreview';
import {
  buildCategoryPalette,
  buildDeploymentScreens,
  categoryRequiresProgramPicker,
  deploymentRequiresField,
  deploymentRequiresVariant,
  findCategoryById,
  HD226_MAX_PLAYERS,
  isDefaultDeploymentType,
  isHdModel,
  isTouchscreenDeployment,
  isXcModel,
  paletteLabel,
  playlistOptionsForCategory,
  touchscreenCategoryIds,
  XC_SCREEN_KEYS,
} from '../../lib/deploymentWizard';
import { cn } from '../../lib/cn';
import { createId } from '../../lib/createId';
import { formatDateLabel } from '../../lib/formatDateLabel';
import { getApiErrorMessage } from '../../services/axios';
import type { DeviceInventoryItem } from '../../types/devices';
import type {
  BrandingMode,
  RegisterClusterPayload,
  RegisterSinglePayload,
} from '../../types/deployments';

const TOTAL_STEPS = 4;

type BrandingUiMode = 'none' | 'platform' | 'custom';
type DeviceHardwareKind = 'XC' | 'HD' | '';

const brandingOptions = [
  { value: 'none', label: 'None' },
  { value: 'platform', label: 'Platform default' },
  { value: 'custom', label: 'Custom' },
] as const;

type ScreenRoute = { categoryId: string; playlistKey?: string };

type HdPlayerRow = {
  id: string;
  pairingId: string;
  categoryId: string;
  playlistKey?: string;
};

function createHdRow(): HdPlayerRow {
  return {
    id: createId(),
    pairingId: '',
    categoryId: '',
    playlistKey: undefined,
  };
}

function deviceOptionLabel(device: DeviceInventoryItem): string {
  return `${device.deviceName || device.serialNumber || 'Device'} — ${device.model || 'Unknown'}${
    device.location ? ` · ${device.location}` : ''
  }`;
}

export interface NewDeploymentFormProps {
  onSuccess?: (message: string) => void;
}

export function NewDeploymentForm({ onSuccess }: NewDeploymentFormProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);

  const [deploymentType, setDeploymentType] = useState('');
  const [paletteIds, setPaletteIds] = useState<string[]>([]);
  const [fieldCategory, setFieldCategory] = useState('');
  const [exerciseVariant, setExerciseVariant] = useState('');
  const [rotationStartDate, setRotationStartDate] = useState<Date | undefined>(new Date());

  const [deviceKind, setDeviceKind] = useState<DeviceHardwareKind>('');
  const [xcPairingId, setXcPairingId] = useState('');
  const [xcDeviceName, setXcDeviceName] = useState('');
  const [xcScreens, setXcScreens] = useState<Record<string, ScreenRoute>>({
    SCREEN_1: { categoryId: '' },
    SCREEN_2: { categoryId: '' },
    SCREEN_3: { categoryId: '' },
  });
  const [hdRows, setHdRows] = useState<HdPlayerRow[]>([createHdRow()]);

  const [brandingUiMode, setBrandingUiMode] = useState<BrandingUiMode>('none');
  const [companyName, setCompanyName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: types = [], isLoading: typesLoading } = useDeploymentTypes();
  const { data: fieldOptions = [], isLoading: fieldLoading } = useDeploymentCategories();
  const { data: variants = [], isLoading: variantsLoading } = useCategoryVariants(
    fieldCategory || null,
  );
  const { data: contentCategories = [], isLoading: contentCategoriesLoading } = useCategories();

  const { data: claimedInventory } = useInventoryDevices({ state: 'claimed', limit: 100 });
  const { data: platformBranding } = usePlatformDefaultBranding();
  const { mutateAsync: createBranding } = useCreateBranding();
  const { mutateAsync: registerDeployment } = useRegisterDeployment();

  const claimedDevices = claimedInventory?.items ?? [];
  const isDefault = isDefaultDeploymentType(deploymentType);
  const isTouchscreen = isTouchscreenDeployment(deploymentType);

  const palette = useMemo(
    () => buildCategoryPalette(contentCategories),
    [contentCategories],
  );

  const touchCategoryIds = useMemo(
    () => touchscreenCategoryIds(contentCategories),
    [contentCategories],
  );

  const selectedPaletteCategories = useMemo(
    () => contentCategories.filter((category) => paletteIds.includes(category.id)),
    [contentCategories, paletteIds],
  );

  const paletteOptions = useMemo(
    () =>
      selectedPaletteCategories.map((category) => ({
        value: category.id,
        label: paletteLabel(category),
      })),
    [selectedPaletteCategories],
  );

  const xcDevices = useMemo(
    () => claimedDevices.filter((device) => isXcModel(device.model)),
    [claimedDevices],
  );

  const hdDevices = useMemo(
    () => claimedDevices.filter((device) => isHdModel(device.model)),
    [claimedDevices],
  );

  const selectedXcDevice = useMemo(
    () => xcDevices.find((device) => device.pairingId === xcPairingId),
    [xcDevices, xcPairingId],
  );

  const selectedClaimedDevice = useMemo(
    () => claimedDevices.find((device) => device.pairingId === xcPairingId),
    [claimedDevices, xcPairingId],
  );

  const screenCategoryPayload = useMemo(() => {
    if (!isDefault) return undefined;

    if (deviceKind === 'XC') {
      return XC_SCREEN_KEYS.map((screenKey) => {
        const route = xcScreens[screenKey] ?? { categoryId: '' };
        return {
          screenKey,
          categoryId: route.categoryId,
          ...(route.playlistKey ? { playlistKey: route.playlistKey } : {}),
        };
      }).filter((entry) => Boolean(entry.categoryId));
    }

    if (deviceKind === 'HD') {
      return hdRows
        .map((row, index) => {
          const screen = buildDeploymentScreens(hdRows.length)[index];
          if (!screen || !row.categoryId) return null;
          return {
            screenKey: screen.screenKey,
            categoryId: row.categoryId,
            ...(row.playlistKey ? { playlistKey: row.playlistKey } : {}),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    }

    return undefined;
  }, [isDefault, deviceKind, xcScreens, hdRows]);

  // Prefer categories actually assigned to screens; fall back to palette on step 1.
  // Touchscreen always uses fixed system categories (default / start-here / phase-1…).
  const assignedCategoryIds = useMemo(() => {
    if (isTouchscreen) return touchCategoryIds;
    if (!screenCategoryPayload?.length) return paletteIds;
    return [...new Set(screenCategoryPayload.map((entry) => entry.categoryId))];
  }, [isTouchscreen, touchCategoryIds, screenCategoryPayload, paletteIds]);

  const needsField = useMemo(
    () =>
      (isDefault || isTouchscreen) &&
      deploymentRequiresField(contentCategories, assignedCategoryIds),
    [isDefault, isTouchscreen, contentCategories, assignedCategoryIds],
  );

  const needsVariant = useMemo(
    () =>
      (isDefault || isTouchscreen) &&
      deploymentRequiresVariant(contentCategories, assignedCategoryIds),
    [isDefault, isTouchscreen, contentCategories, assignedCategoryIds],
  );

  const previewQuery = useMemo(() => {
    if (step < 3 || !deploymentType) return null;
    if (needsField && !fieldCategory) return null;
    if (needsVariant && !exerciseVariant) return null;
    if (isDefault && (!screenCategoryPayload || screenCategoryPayload.length === 0)) {
      return null;
    }

    return {
      deploymentType,
      ...(fieldCategory ? { fieldCategory } : {}),
      ...(exerciseVariant ? { exerciseVariant } : {}),
      rotationStartDate: rotationStartDate
        ? format(rotationStartDate, 'yyyy-MM-dd')
        : undefined,
      screenCategories: screenCategoryPayload,
    };
  }, [
    step,
    deploymentType,
    fieldCategory,
    exerciseVariant,
    rotationStartDate,
    screenCategoryPayload,
    isDefault,
    needsField,
    needsVariant,
  ]);

  const { data: preview, isLoading: previewLoading } = useDeploymentPreview(previewQuery);
  const previewSlots = useMemo(() => parseDeploymentPreviewSlots(preview), [preview]);

  useEffect(() => {
    if (types.length > 0 && !deploymentType) {
      setDeploymentType(types[0]!.value);
    }
  }, [types, deploymentType]);

  useEffect(() => {
    if (!isDefault) return;
    if (!contentCategories.length || paletteIds.length > 0) return;
    const defaults = ['start-here', 'phase-1', 'phase-2']
      .map((slug) => contentCategories.find((category) => category.slug === slug)?.id)
      .filter((id): id is string => Boolean(id));
    if (defaults.length > 0) setPaletteIds(defaults);
  }, [isDefault, contentCategories, paletteIds.length]);

  useEffect(() => {
    if (!needsField) {
      setFieldCategory('');
      return;
    }
    if (fieldOptions.length > 0 && !fieldCategory) {
      setFieldCategory(fieldOptions[0]!.value);
    }
  }, [needsField, fieldOptions, fieldCategory]);

  useEffect(() => {
    if (!needsVariant) {
      setExerciseVariant('');
      return;
    }
    if (variants.length > 0) {
      const stillValid = variants.some((variant) => variant.value === exerciseVariant);
      if (!stillValid) setExerciseVariant(variants[0]!.value);
    } else {
      setExerciseVariant('');
    }
  }, [needsVariant, variants, exerciseVariant]);

  useEffect(() => {
    if (isDefault) {
      if (!deviceKind) setDeviceKind('XC');
      return;
    }
    setDeviceKind('');
  }, [isDefault, deviceKind]);

  useEffect(() => {
    if (selectedXcDevice?.deviceName && !xcDeviceName) {
      setXcDeviceName(selectedXcDevice.deviceName);
    }
  }, [selectedXcDevice, xcDeviceName]);

  useEffect(() => {
    setXcScreens((current) => {
      const next = { ...current };
      for (const screenKey of XC_SCREEN_KEYS) {
        const route = next[screenKey];
        if (route?.categoryId && !paletteIds.includes(route.categoryId)) {
          next[screenKey] = { categoryId: '' };
        }
      }
      return next;
    });
    setHdRows((rows) =>
      rows.map((row) =>
        row.categoryId && !paletteIds.includes(row.categoryId)
          ? { ...row, categoryId: '', playlistKey: undefined }
          : row,
      ),
    );
  }, [paletteIds]);

  function togglePalette(categoryId: string) {
    setPaletteIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  function updateXcScreen(screenKey: string, patch: Partial<ScreenRoute>) {
    setXcScreens((current) => ({
      ...current,
      [screenKey]: {
        ...(current[screenKey] ?? { categoryId: '' }),
        ...patch,
      },
    }));
  }

  function updateHdRow(id: string, patch: Partial<HdPlayerRow>) {
    setHdRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addHdRow() {
    if (hdRows.length >= HD226_MAX_PLAYERS) {
      showToast({
        title: `Maximum ${HD226_MAX_PLAYERS} HD226 players per deployment`,
        variant: 'error',
      });
      return;
    }
    setHdRows((rows) => [...rows, createHdRow()]);
  }

  function removeHdRow(id: string) {
    setHdRows((rows) => (rows.length <= 1 ? rows : rows.filter((row) => row.id !== id)));
  }

  function routeValid(categoryId: string, playlistKey?: string): boolean {
    if (!categoryId || !paletteIds.includes(categoryId)) return false;
    const category = findCategoryById(contentCategories, categoryId);
    if (category && categoryRequiresProgramPicker(category.scope)) {
      return Boolean(playlistKey);
    }
    return true;
  }

  function step1Valid(): boolean {
    if (!deploymentType) return false;
    if (isDefault) {
      if (paletteIds.length === 0) return false;
      if (needsField && !fieldCategory) return false;
      if (needsVariant && !exerciseVariant) return false;
      return true;
    }
    if (isTouchscreen) {
      // Fixed categories — Field/Variant required so BY_FIELD playlists resolve.
      if (needsField && !fieldCategory) return false;
      if (needsVariant && !exerciseVariant) return false;
      return true;
    }
    return true;
  }

  function step2Valid(): boolean {
    if (!isDefault) {
      return Boolean(xcPairingId);
    }

    if (deviceKind === 'XC') {
      if (!xcPairingId) return false;
      return XC_SCREEN_KEYS.every((screenKey) => {
        const route = xcScreens[screenKey];
        return routeValid(route?.categoryId ?? '', route?.playlistKey);
      });
    }

    if (deviceKind === 'HD') {
      if (hdRows.length < 1) return false;
      const pairingIds = hdRows.map((row) => row.pairingId);
      if (pairingIds.some((id) => !id)) return false;
      if (new Set(pairingIds).size !== pairingIds.length) return false;
      return hdRows.every((row) => routeValid(row.categoryId, row.playlistKey));
    }

    return false;
  }

  function canGoNext(): boolean {
    if (step === 1) return step1Valid();
    if (step === 2) return step2Valid();
    if (step === 3) return true;
    return siteContactValid();
  }

  function siteContactValid(): boolean {
    const email = ownerEmail.trim();
    if (!ownerName.trim() || !email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function buildSiteContact() {
    return {
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      ...(siteAddress.trim() ? { siteAddress: siteAddress.trim() } : {}),
      ...(ownerPhone.trim() ? { ownerPhone: ownerPhone.trim() } : {}),
    };
  }

  function resetForm() {
    setStep(1);
    setPaletteIds([]);
    setFieldCategory('');
    setExerciseVariant('');
    setRotationStartDate(new Date());
    setDeviceKind('XC');
    setXcPairingId('');
    setXcDeviceName('');
    setXcScreens({
      SCREEN_1: { categoryId: '' },
      SCREEN_2: { categoryId: '' },
      SCREEN_3: { categoryId: '' },
    });
    setHdRows([createHdRow()]);
    setBrandingUiMode('none');
    setCompanyName('');
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setOwnerName('');
    setOwnerEmail('');
    setSiteAddress('');
    setOwnerPhone('');
  }

  function toApiBrandingMode(mode: BrandingUiMode): BrandingMode {
    if (mode === 'platform') return 'PLATFORM_DEFAULT';
    if (mode === 'custom') return 'CUSTOM';
    return 'NONE';
  }

  async function handleDeploy() {
    if (!step1Valid() || !step2Valid()) {
      showToast({ title: 'Complete configuration and device steps first', variant: 'error' });
      return;
    }
    if (!siteContactValid()) {
      showToast({
        title: 'Owner name and a valid email are required',
        variant: 'error',
      });
      return;
    }

    const dateStr = rotationStartDate ? format(rotationStartDate, 'yyyy-MM-dd') : undefined;
    const brandingMode = toApiBrandingMode(brandingUiMode);
    const siteContact = buildSiteContact();

    setIsSubmitting(true);
    try {
      let brandingId: string | undefined;

      if (brandingMode === 'CUSTOM') {
        if (!logoFile && !companyName.trim()) {
          showToast({
            title: 'Custom branding requires a brand name or logo',
            variant: 'error',
          });
          setIsSubmitting(false);
          return;
        }
        const branding = await createBranding({
          brandName: companyName.trim() || undefined,
          logo: logoFile ?? undefined,
        });
        brandingId = branding.id;
      }

      if (isDefault && deviceKind === 'HD') {
        const screens = buildDeploymentScreens(hdRows.length);
        const members = hdRows.map((row, index) => {
          const device = hdDevices.find((entry) => entry.pairingId === row.pairingId);
          return {
            memberKey: screens[index]!.memberKey,
            pairingId: row.pairingId,
            deviceName: device?.deviceName ?? screens[index]!.label,
          };
        });

        const payload: RegisterClusterPayload = {
          hardwareProfile: 'HD226',
          members,
          deploymentType,
          ...(fieldCategory ? { fieldCategory } : {}),
          ...(exerciseVariant ? { exerciseVariant } : {}),
          rotationStartDate: dateStr,
          brandingMode,
          brandingId,
          screenCategories: screenCategoryPayload,
          siteContact,
        };

        const result = await registerDeployment(payload);
        showToast({
          title: result.message || 'Deployment registered',
          variant: 'success',
        });
        onSuccess?.(result.message || 'Deployment registered');
        resetForm();
        return;
      }

      if (!xcPairingId && !(isDefault && deviceKind === 'HD')) {
        showToast({ title: 'Select a claimed device', variant: 'error' });
        setIsSubmitting(false);
        return;
      }

      const payload: RegisterSinglePayload = {
        pairingId: xcPairingId,
        deploymentType,
        ...(fieldCategory ? { fieldCategory } : {}),
        ...(exerciseVariant ? { exerciseVariant } : {}),
        rotationStartDate: dateStr,
        deviceName: xcDeviceName.trim()
          ? xcDeviceName.trim()
          : (selectedClaimedDevice?.deviceName ?? undefined),
        hardwareProfile:
          selectedClaimedDevice?.model ?? (isDefault ? 'XC4055' : 'XT2145'),
        brandingMode,
        brandingId,
        screenCategories: isDefault ? screenCategoryPayload : undefined,
        siteContact,
      };

      const result = await registerDeployment(payload);
      showToast({
        title: result.message || 'Deployment registered',
        message: result.data.apiToken
          ? 'API token was issued — store it securely; it is shown once.'
          : undefined,
        variant: 'success',
      });
      onSuccess?.(result.message || 'Deployment registered');
      resetForm();
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to register deployment'),
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderCategoryProgramPickers(args: {
    categoryId: string;
    playlistKey?: string;
    onCategoryChange: (categoryId: string) => void;
    onPlaylistChange: (playlistKey?: string) => void;
  }) {
    const category = findCategoryById(contentCategories, args.categoryId);
    const showProgram =
      category && categoryRequiresProgramPicker(category.scope);
    const programOptions = playlistOptionsForCategory(category);

    return (
      <div className="space-y-2">
        <Dropdown
          options={[
            { value: '', label: 'Select category…' },
            ...paletteOptions,
          ]}
          value={args.categoryId}
          onChange={(value) => args.onCategoryChange(value)}
          fullWidth
          disabled={contentCategoriesLoading || paletteOptions.length === 0}
        />
        {showProgram && (
          <Dropdown
            options={[
              { value: '', label: 'Select program…' },
              ...programOptions,
            ]}
            value={args.playlistKey ?? ''}
            onChange={(value) => args.onPlaylistChange(value || undefined)}
            fullWidth
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DeploymentStepper currentStep={step} totalSteps={TOTAL_STEPS} />

      {step === 1 && (
        <div className={cn(CARD_SURFACE_CLASS, 'space-y-4 p-4 sm:p-5')}>
          <SectionLabel className="block">Step 1 — Configuration</SectionLabel>

          <div>
            <p className="mb-1 text-xs font-medium text-content-muted">Deployment type</p>
            <Dropdown
              options={types.map((type) => ({ value: type.value, label: type.label }))}
              value={deploymentType}
              onChange={setDeploymentType}
              fullWidth
              disabled={typesLoading}
            />
          </div>

          {isDefault ? (
            <>
              <div className="space-y-2 rounded-lg border border-surface-border p-3">
                <div>
                  <p className="text-body-sm font-medium text-content-primary">
                    Content categories for this deployment
                  </p>
                  <p className="text-caption text-content-secondary">
                    Check the categories you want available. Field / Variant appear only when a
                    selected category needs them (e.g. Phase 1).
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {palette.map((category) => {
                    const checked = paletteIds.includes(category.id);
                    return (
                      <label
                        key={category.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-body-sm',
                          checked
                            ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                            : 'border-surface-border bg-surface-muted/20 text-content-secondary',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-600"
                          checked={checked}
                          onChange={() => togglePalette(category.id)}
                        />
                        <span className="font-medium">{paletteLabel(category)}</span>
                      </label>
                    );
                  })}
                </div>
                {contentCategoriesLoading && (
                  <p className="text-caption text-content-muted">Loading categories…</p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-surface-border bg-surface-muted/20 p-3 text-body-sm text-content-secondary">
              Touchscreen deployments use the fixed system categories (Default, Start Here, Phase
              1, Phase 2, Full Program). Choose Field and Variant below so Fitness/Golf playlists
              resolve to the correct videos.
            </div>
          )}

          {needsField && (
            <div>
              <p className="mb-1 text-xs font-medium text-content-muted">Field category</p>
              <Dropdown
                options={fieldOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={fieldCategory}
                onChange={(value) => {
                  setFieldCategory(value);
                  setExerciseVariant('');
                }}
                fullWidth
                disabled={fieldLoading}
              />
            </div>
          )}

          {needsVariant && (
            <div>
              <p className="mb-1 text-xs font-medium text-content-muted">Exercise variant</p>
              <Dropdown
                options={variants.map((variant) => ({
                  value: variant.value,
                  label: variant.label,
                }))}
                value={exerciseVariant}
                onChange={setExerciseVariant}
                fullWidth
                disabled={variantsLoading || !fieldCategory}
              />
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium text-content-muted">Rotation start date</p>
            <DatePicker value={rotationStartDate} onChange={setRotationStartDate} />
            {rotationStartDate && (
              <p className="mt-1 text-caption text-content-secondary">
                {formatDateLabel(rotationStartDate)}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={cn(CARD_SURFACE_CLASS, 'space-y-4 p-4 sm:p-5')}>
          <SectionLabel className="block">Step 2 — Device</SectionLabel>
          <p className="text-body-sm text-content-secondary">
            Assign claimed (not yet deployed) devices and map each output to a category from Step
            1.
          </p>

          {isDefault ? (
            <>
              <div>
                <p className="mb-1 text-xs font-medium text-content-muted">Device type</p>
                <Dropdown
                  options={[
                    { value: 'XC', label: 'XC4055 (3 screens)' },
                    { value: 'HD', label: 'HD226 (1 player per screen)' },
                  ]}
                  value={deviceKind}
                  onChange={(value) => setDeviceKind(value as DeviceHardwareKind)}
                  fullWidth
                />
              </div>

              {deviceKind === 'XC' && (
                <div className="space-y-3 rounded-lg border border-surface-border p-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-content-muted">XC4055 device</p>
                    <Dropdown
                      options={[
                        { value: '', label: 'Select claimed XC device…' },
                        ...xcDevices.map((device) => ({
                          value: device.pairingId ?? '',
                          label: deviceOptionLabel(device),
                        })),
                      ]}
                      value={xcPairingId}
                      onChange={(value) => {
                        setXcPairingId(value);
                        setXcDeviceName('');
                      }}
                      fullWidth
                    />
                    {xcDevices.length === 0 && (
                      <p className="mt-1 text-caption text-status-warning">
                        No claimed XC4055 devices available.
                      </p>
                    )}
                  </div>

                  {selectedXcDevice && (
                    <Input
                      label="Device name (optional)"
                      placeholder={selectedXcDevice.deviceName ?? 'Gym Screen'}
                      value={xcDeviceName}
                      onChange={(event) => setXcDeviceName(event.target.value)}
                    />
                  )}

                  {XC_SCREEN_KEYS.map((screenKey, index) => (
                    <div key={screenKey} className="space-y-2 rounded-md border border-surface-border/70 p-2">
                      <p className="text-xs font-medium text-content-muted">
                        Screen {index + 1}
                      </p>
                      {renderCategoryProgramPickers({
                        categoryId: xcScreens[screenKey]?.categoryId ?? '',
                        playlistKey: xcScreens[screenKey]?.playlistKey,
                        onCategoryChange: (categoryId) =>
                          updateXcScreen(screenKey, {
                            categoryId,
                            playlistKey: undefined,
                          }),
                        onPlaylistChange: (playlistKey) =>
                          updateXcScreen(screenKey, { playlistKey }),
                      })}
                    </div>
                  ))}
                </div>
              )}

              {deviceKind === 'HD' && (
                <div className="space-y-3">
                  {hdRows.map((row, index) => {
                    const usedPairingIds = new Set(
                      hdRows
                        .filter((entry) => entry.id !== row.id && entry.pairingId)
                        .map((entry) => entry.pairingId),
                    );
                    const available = hdDevices.filter(
                      (device) =>
                        !usedPairingIds.has(device.pairingId ?? '') ||
                        device.pairingId === row.pairingId,
                    );
                    const screen = buildDeploymentScreens(hdRows.length)[index];

                    return (
                      <div
                        key={row.id}
                        className="space-y-2 rounded-lg border border-surface-border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-body-sm font-medium text-content-primary">
                            {screen?.label ?? `Player ${index + 1}`} ·{' '}
                            {screen?.clusterLabel ?? `DEVICE_${String.fromCharCode(65 + index)}`}
                          </p>
                          {hdRows.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => removeHdRow(row.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-medium text-content-muted">
                            HD226 device
                          </p>
                          <Dropdown
                            options={[
                              { value: '', label: 'Select claimed HD226…' },
                              ...available.map((device) => ({
                                value: device.pairingId ?? '',
                                label: deviceOptionLabel(device),
                              })),
                            ]}
                            value={row.pairingId}
                            onChange={(value) => updateHdRow(row.id, { pairingId: value })}
                            fullWidth
                          />
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-medium text-content-muted">
                            Player screen category
                          </p>
                          {renderCategoryProgramPickers({
                            categoryId: row.categoryId,
                            playlistKey: row.playlistKey,
                            onCategoryChange: (categoryId) =>
                              updateHdRow(row.id, {
                                categoryId,
                                playlistKey: undefined,
                              }),
                            onPlaylistChange: (playlistKey) =>
                              updateHdRow(row.id, { playlistKey }),
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-4"
                    onClick={addHdRow}
                    disabled={hdRows.length >= HD226_MAX_PLAYERS}
                  >
                    Add Device
                  </Button>
                  {hdDevices.length < hdRows.length && (
                    <p className="text-caption text-status-warning">
                      Need {hdRows.length} claimed HD226 devices. Currently: {hdDevices.length}.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3 rounded-lg border border-surface-border p-3">
              <p className="text-body-sm text-content-secondary">
                Touchscreen deployments use a single claimed XT2145 device.
              </p>
              <Dropdown
                options={[
                  { value: '', label: 'Select claimed device…' },
                  ...claimedDevices
                    .filter((device) => (device.model ?? '').toUpperCase().includes('XT2145'))
                    .map((device) => ({
                      value: device.pairingId ?? '',
                      label: deviceOptionLabel(device),
                    })),
                ]}
                value={xcPairingId}
                onChange={setXcPairingId}
                fullWidth
              />
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className={cn(CARD_SURFACE_CLASS, 'space-y-4 p-4 sm:p-5')}>
          <SectionLabel className="block">Step 3 — Preview</SectionLabel>
          <p className="text-body-sm text-content-secondary">
            Videos and rotation for the categories assigned to your selected device screens.
          </p>
          {previewLoading && (
            <p className="text-body-sm text-content-muted">Loading preview…</p>
          )}
          {!previewLoading && previewSlots.length === 0 && (
            <p className="text-body-sm text-content-muted">
              No preview content for this configuration.
            </p>
          )}
          <div className="max-h-[min(70vh,560px)] space-y-4 overflow-y-auto pr-1">
            {previewSlots.map((slot) => (
              <section key={slot.key}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-caption font-semibold uppercase tracking-wide text-content-muted">
                    {slot.label}
                  </p>
                  <div className="flex items-center gap-2">
                    {slot.isRotating && <Badge variant="brand">36-day rotation</Badge>}
                    <Badge variant="success">
                      {slot.items.length} video{slot.items.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
                <ul
                  className={cn(
                    'grid gap-2',
                    slot.isRotating ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2',
                  )}
                >
                  {slot.items.map((item, index) => {
                    const thumbnailUrl = resolveStorageUrl(item.thumbnail);
                    const durationLabel = formatPreviewDuration(item.duration);
                    return (
                      <li
                        key={`${slot.key}-${item.mediaVersionId || item.day}-${index}`}
                        className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface-muted/30 px-3 py-2"
                      >
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-surface-border bg-surface-muted">
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-caption text-content-muted">
                              —
                            </div>
                          )}
                          {slot.isRotating && (
                            <span className="absolute bottom-0 left-0 right-0 bg-brand-600/90 px-1 py-0.5 text-center text-[10px] font-semibold text-white">
                              Day {item.day}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body-sm font-medium text-content-primary">
                            {item.video}
                          </p>
                          <p className="text-caption text-content-secondary">
                            {slot.isRotating ? `Rotation day ${item.day}` : `Day ${item.day}`}
                            {durationLabel ? ` · ${durationLabel}` : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className={cn(CARD_SURFACE_CLASS, 'space-y-4 p-4 sm:p-5')}>
          <SectionLabel className="block">Step 4 — Finalize deployment</SectionLabel>

          <div>
            <p className="mb-1 text-xs font-medium text-content-muted">Branding mode</p>
            <Dropdown
              options={[...brandingOptions]}
              value={brandingUiMode}
              onChange={(value) => setBrandingUiMode(value as BrandingUiMode)}
              fullWidth
            />
          </div>

          {brandingUiMode === 'platform' && platformBranding && (
            <p className="text-body-sm text-content-secondary">
              Using platform default: {platformBranding.brandName}
            </p>
          )}

          {brandingUiMode === 'custom' && (
            <>
              <Input
                label="Brand name"
                placeholder="Acme Fitness"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
              <BrandingLogoUpload
                previewUrl={logoPreviewUrl}
                companyName={companyName}
                onChange={(file, preview) => {
                  setLogoFile(file);
                  setLogoPreviewUrl(preview);
                }}
              />
            </>
          )}

          <div className="space-y-3 border-t border-surface-border pt-4">
            <p className="text-xs font-medium text-content-muted">
              Site owner (offline alerts)
            </p>
            <p className="text-body-sm text-content-secondary">
              Stored on the device record — not a login. Used when the screen goes
              offline during its content prefetch window.
            </p>
            <Input
              label="Owner name"
              placeholder="Alex Morgan"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              required
            />
            <Input
              label="Owner email"
              type="email"
              placeholder="alex@acmegym.com"
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              required
            />
            <Input
              label="Site address"
              placeholder="12 High St, Austin TX"
              value={siteAddress}
              onChange={(event) => setSiteAddress(event.target.value)}
            />
            <Input
              label="Phone (optional)"
              placeholder="+1 555 0100"
              value={ownerPhone}
              onChange={(event) => setOwnerPhone(event.target.value)}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-surface-border bg-surface-muted/20 p-3 text-body-sm text-content-secondary">
            <p>
              <span className="font-medium text-content-primary">Type:</span> {deploymentType}
            </p>
            <p>
              <span className="font-medium text-content-primary">Categories:</span>{' '}
              {isDefault
                ? selectedPaletteCategories
                    .map((category) => paletteLabel(category))
                    .join(', ') || '—'
                : 'Fixed touchscreen categories'}
            </p>
            {((isDefault || isTouchscreen) && (needsField || needsVariant)) && (
              <p>
                <span className="font-medium text-content-primary">Field / Variant:</span>{' '}
                {fieldCategory || '—'} / {exerciseVariant || '—'}
              </p>
            )}
            <p>
              <span className="font-medium text-content-primary">Start:</span>{' '}
              {rotationStartDate ? format(rotationStartDate, 'yyyy-MM-dd') : '—'}
            </p>
            <p>
              <span className="font-medium text-content-primary">Hardware:</span>{' '}
              {isDefault
                ? deviceKind === 'HD'
                  ? `HD226 · ${hdRows.length} player${hdRows.length === 1 ? '' : 's'}`
                  : 'XC4055 · 3 screens'
                : 'XT2145'}
            </p>

            {isDefault && deviceKind === 'XC' && (
              <div className="mt-2 space-y-1 border-t border-surface-border pt-2">
                <p>
                  <span className="font-medium text-content-primary">Device:</span>{' '}
                  {selectedXcDevice?.deviceName || selectedXcDevice?.serialNumber || '—'}
                </p>
                {XC_SCREEN_KEYS.map((screenKey, index) => {
                  const route = xcScreens[screenKey];
                  const category = findCategoryById(contentCategories, route?.categoryId ?? '');
                  const program =
                    route?.playlistKey && category
                      ? category.playlists.find(
                          (playlist) => playlist.playlistKey === route.playlistKey,
                        )?.name
                      : null;
                  return (
                    <p key={screenKey}>
                      <span className="font-medium text-content-primary">
                        Screen {index + 1}:
                      </span>{' '}
                      {category ? paletteLabel(category) : '—'}
                      {program ? ` · ${program}` : ''}
                    </p>
                  );
                })}
              </div>
            )}

            {isDefault && deviceKind === 'HD' && (
              <div className="mt-2 space-y-1 border-t border-surface-border pt-2">
                {hdRows.map((row, index) => {
                  const device = hdDevices.find((entry) => entry.pairingId === row.pairingId);
                  const category = findCategoryById(contentCategories, row.categoryId);
                  const program =
                    row.playlistKey && category
                      ? category.playlists.find(
                          (playlist) => playlist.playlistKey === row.playlistKey,
                        )?.name
                      : null;
                  const screen = buildDeploymentScreens(hdRows.length)[index];
                  return (
                    <p key={row.id}>
                      <span className="font-medium text-content-primary">
                        {screen?.label ?? `Player ${index + 1}`}:
                      </span>{' '}
                      {device?.deviceName || device?.serialNumber || '—'} ·{' '}
                      {category ? paletteLabel(category) : '—'}
                      {program ? ` · ${program}` : ''}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-4"
          disabled={step === 1 || isSubmitting}
          onClick={() => setStep((current) => Math.max(1, current - 1))}
        >
          Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            size="sm"
            className="h-9 px-4"
            disabled={!canGoNext()}
            onClick={() => setStep((current) => Math.min(TOTAL_STEPS, current + 1))}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-9 px-4"
            disabled={isSubmitting || !canGoNext()}
            onClick={() => void handleDeploy()}
          >
            {isSubmitting ? 'Deploying…' : 'Register deployment'}
          </Button>
        )}
      </div>
    </div>
  );
}

export type { DeviceInventoryItem };
