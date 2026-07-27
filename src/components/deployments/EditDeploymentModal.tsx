import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Input, Modal, ModalBody, SectionLabel } from '../ui';
import {
  useCategoryVariants,
  useDeployment,
  useUpdateDeployment,
} from '../../hooks/useDeployments';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../context/ToastContext';
import {
  formatEnumLabel,
  resolveDeploymentScreens,
} from '../../lib/deploymentDisplay';
import { DEFAULT_DEPLOYMENT_SCREENS } from '../../lib/screenCategoryDefaults';
import {
  categoryRequiresProgramPicker,
  deploymentRequiresField,
  deploymentRequiresVariant,
  findCategoryById,
  playlistOptionsForCategory,
} from '../../lib/deploymentWizard';
import { getApiErrorMessage } from '../../services/axios';
import type {
  BrandingMode,
  DeploymentEntity,
  UpdateDeploymentPayload,
} from '../../types/deployments';
import type { ContentCategory } from '../../types/categories';

export interface EditDeploymentModalProps {
  open: boolean;
  deployment: DeploymentEntity | null;
  onClose: () => void;
  onSaved?: () => void;
}

type ScreenRoute = { categoryId: string; playlistKey?: string };

const brandingOptions = [
  { value: 'PLATFORM_DEFAULT', label: 'Platform default' },
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'NONE', label: 'None' },
];

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
  const { data: detail } = useDeployment(open && deployment ? deployment.id : null);
  const { data: contentCategories = [] } = useCategories();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldCategory, setFieldCategory] = useState('');
  const [exerciseVariant, setExerciseVariant] = useState('');
  const [brandingMode, setBrandingMode] = useState<BrandingMode>('PLATFORM_DEFAULT');
  const [brandingId, setBrandingId] = useState('');
  const [screenRoutes, setScreenRoutes] = useState<Record<string, ScreenRoute>>({});

  const source = detail ?? deployment;
  const showScreenEditor = isDefaultDeployment(source?.deploymentType);

  const editorScreens = useMemo(() => {
    const fromSource = resolveDeploymentScreens(source).filter(
      (screen): screen is typeof screen & { screenKey: string } =>
        Boolean(screen.screenKey),
    );
    if (fromSource.length > 0) {
      return fromSource.map((screen) => ({
        screenKey: screen.screenKey,
        label: formatEnumLabel(screen.screenKey),
      }));
    }
    return DEFAULT_DEPLOYMENT_SCREENS.map((screen) => ({
      screenKey: screen.screenKey,
      label: screen.label,
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
      contentCategories.map((category) => ({
        value: category.id,
        label: `${category.name}${category.isSystem ? '' : ' (custom)'}`,
      })),
    [contentCategories],
  );

  useEffect(() => {
    if (!source || !open) return;
    setName(source.name ?? '');
    setDescription(
      typeof source.description === 'string' ? source.description : '',
    );
    setFieldCategory(source.fieldCategory ?? '');
    setExerciseVariant(source.exerciseVariant ?? '');
    const mode = source.config?.brandingMode;
    setBrandingMode(
      mode === 'CUSTOM' || mode === 'NONE' || mode === 'PLATFORM_DEFAULT'
        ? mode
        : 'PLATFORM_DEFAULT',
    );
    const linkedBrandingId = source.branding?.[0]?.id;
    setBrandingId(typeof linkedBrandingId === 'string' ? linkedBrandingId : '');

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
  }, [source, open, editorScreens]);

  const screensValid =
    !showScreenEditor ||
    editorScreens.every((screen) => {
      const route = screenRoutes[screen.screenKey];
      return routeValid(contentCategories, route?.categoryId ?? '', route?.playlistKey);
    });

  const axesValid =
    (!needsField || Boolean(fieldCategory)) &&
    (!needsVariant || Boolean(exerciseVariant));

  const canSave = screensValid && axesValid;

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

  async function handleSave() {
    if (!deployment || !canSave) return;

    const payload: UpdateDeploymentPayload = {
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      brandingMode,
      brandingId:
        brandingMode === 'CUSTOM' && brandingId.trim()
          ? brandingId.trim()
          : undefined,
    };

    if (needsField && fieldCategory) {
      payload.fieldCategory = fieldCategory;
    } else if (showScreenEditor) {
      // Clear stale Fitness/Wall when screens no longer need an axis (e.g. 15 Minutes only).
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
      description="Update content, branding, screens, or display name."
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
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Deployment name"
          />
          <Input
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes"
          />

          {needsField && (
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">
                Field category
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
                Exercise variant
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
                placeholder={fieldCategory ? 'Select variant' : 'Select field first'}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">
              Branding mode
            </label>
            <Dropdown
              fullWidth
              value={brandingMode}
              onChange={(value) => setBrandingMode(value as BrandingMode)}
              options={brandingOptions}
            />
          </div>

          {brandingMode === 'CUSTOM' && (
            <Input
              label="Branding ID"
              value={brandingId}
              onChange={(event) => setBrandingId(event.target.value)}
              placeholder="UUID from branding upload"
            />
          )}

          {showScreenEditor && (
            <div className="space-y-4 rounded-lg border border-surface-border p-4">
              <SectionLabel className="block">Screen content</SectionLabel>
              <p className="text-caption text-content-secondary">
                Change which parent category (and program, when needed) plays on each screen.
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
                          { value: '', label: 'Select program…' },
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
        </div>
      </ModalBody>
    </Modal>
  );
}
