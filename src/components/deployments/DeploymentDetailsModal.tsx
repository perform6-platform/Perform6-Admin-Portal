import { useMemo } from 'react';
import { useDeployment } from '../../hooks/useDeployments';
import { useGlobalRotationSettings } from '../../hooks/useRotation';
import {
  formatBrandingModeLabel,
  formatCategoryShortLabel,
  formatDeploymentAxes,
  formatDeploymentDisplayName,
  formatDeploymentTypeLabel,
  formatPlaylistKeyLabel,
  formatPortalDate,
  formatRotationScheduleLabel,
  resolveDeploymentRotationMode,
  resolveDeploymentScreens,
  resolveLinkedDeviceName,
} from '../../lib/deploymentDisplay';
import { cn } from '../../lib/cn';
import {
  CATEGORY_DROPDOWN_SLUG_ORDER,
  formatDeviceScreenLabel,
  isTouchscreenDeployment,
  PALETTE_SHORT_LABELS,
} from '../../lib/deploymentWizard';
import { resolveStorageUrl } from '../../lib/libraryType';
import { useCategories } from '../../hooks/useCategories';
import { Badge, Button, Modal, ModalBody, SectionLabel } from '../ui';

export interface DeploymentDetailsModalProps {
  open: boolean;
  deploymentId: string | null;
  onClose: () => void;
}

function categoryAssignmentLabel(screen: {
  categoryName?: string | null;
  categorySlug?: string | null;
  playlistKey?: string | null;
}): string {
  const category = formatCategoryShortLabel(screen.categoryName, screen.categorySlug);
  const zone = formatPlaylistKeyLabel(screen.playlistKey);
  if (category === '—') return zone || 'Unassigned';
  return zone ? `${category} · ${zone}` : category;
}

export function DeploymentDetailsModal({
  open,
  deploymentId,
  onClose,
}: DeploymentDetailsModalProps) {
  const { data: deployment, isLoading, isError } = useDeployment(
    open ? deploymentId : null,
  );
  const { data: globalRotation } = useGlobalRotationSettings();
  const { data: contentCategories = [] } = useCategories();

  const screens = useMemo(
    () => resolveDeploymentScreens(deployment),
    [deployment],
  );

  const assignedCategoryIds = useMemo(
    () => new Set(screens.map((screen) => screen.categoryId).filter(Boolean)),
    [screens],
  );

  const orderedCategories = useMemo(() => {
    const bySlug = new Map(contentCategories.map((category) => [category.slug, category]));
    const ordered = CATEGORY_DROPDOWN_SLUG_ORDER.map((slug) => bySlug.get(slug)).filter(
      (category): category is NonNullable<typeof category> => Boolean(category),
    );
    for (const category of contentCategories) {
      if (!CATEGORY_DROPDOWN_SLUG_ORDER.includes(category.slug as (typeof CATEGORY_DROPDOWN_SLUG_ORDER)[number])) {
        ordered.push(category);
      }
    }
    return ordered;
  }, [contentCategories]);
  const axes = useMemo(
    () => formatDeploymentAxes(deployment),
    [deployment],
  );
  const branding = deployment?.branding?.[0];
  const logoUrl =
    branding && typeof branding.logoUrl === 'string'
      ? resolveStorageUrl(branding.logoUrl)
      : null;
  const isTouchscreen = isTouchscreenDeployment(deployment?.deploymentType ?? '');
  const rotationMode = resolveDeploymentRotationMode(deployment);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deployment details"
      description={deployment?.name}
      size="xl"
      className="max-h-[min(92vh,860px)]"
      footer={
        <Button type="button" size="sm" className="h-9 px-4" onClick={onClose}>
          Close
        </Button>
      }
    >
      <ModalBody className="space-y-4">
        {isLoading ? (
          <p className="text-body-sm text-content-muted">Loading deployment…</p>
        ) : isError || !deployment ? (
          <p className="text-body-sm text-content-muted">Failed to load deployment details.</p>
        ) : (
          <>
            <section>
              <SectionLabel className="mb-4 block">Overview</SectionLabel>
              <dl className="divide-y divide-surface-border rounded-lg border border-surface-border">
                <DetailRow
                  label="Name"
                  value={formatDeploymentDisplayName(deployment)}
                />
                <DetailRow
                  label="Deployment Type"
                  value={formatDeploymentTypeLabel(deployment.deploymentType)}
                />
                <DetailRow label="Content Type" value={axes.fieldLabel} />
                <DetailRow label="Environment" value={axes.variantLabel} />
                <DetailRow
                  label="Rotation Schedule"
                  value={
                    rotationMode ? formatRotationScheduleLabel(rotationMode) : '—'
                  }
                />
                <DetailRow
                  label="Branding"
                  value={formatBrandingModeLabel(undefined, deployment.config)}
                />
                <DetailRow
                  label="Linked Devices"
                  value={String(deployment.devices?.length ?? 0)}
                />
                <DetailRow
                  label="Description"
                  value={
                    typeof deployment.description === 'string' && deployment.description.trim()
                      ? deployment.description
                      : '—'
                  }
                />
                <DetailRow
                  label="Facility Location"
                  value={deployment.siteContact?.location?.trim() || '—'}
                />
                <DetailRow
                  label="Contact Name"
                  value={deployment.siteContact?.ownerName?.trim() || '—'}
                />
                <DetailRow
                  label="Contact Email"
                  value={deployment.siteContact?.ownerEmail?.trim() || '—'}
                />
                <DetailRow
                  label="Facility Time Zone"
                  value={deployment.siteContact?.timezone?.trim() || '—'}
                />
              </dl>
            </section>

            {orderedCategories.length > 0 ? (
              <section>
                <SectionLabel className="mb-4 block">Categories</SectionLabel>
                <ul className="space-y-1 rounded-lg border border-surface-border px-4 py-3">
                  {orderedCategories.map((category) => {
                    const selected = assignedCategoryIds.has(category.id);
                    return (
                      <li
                        key={category.id}
                        className={cn(
                          'text-body-sm font-medium',
                          selected
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-content-primary',
                        )}
                      >
                        {PALETTE_SHORT_LABELS[category.slug] ?? category.name}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section>
              <SectionLabel className="mb-4 block">
                {isTouchscreen ? 'Content Category Assignments' : 'Device · Screen → Category'}
              </SectionLabel>
              {screens.length === 0 ? (
                <p className="rounded-lg border border-dashed border-surface-border px-4 py-6 text-center text-body-sm text-content-muted">
                  No screen assignments on this deployment.
                </p>
              ) : (
                <ul className="divide-y divide-surface-border rounded-lg border border-surface-border">
                  {screens.map((screen, index) => (
                    <li
                      key={screen.screenKey ?? `screen-${index}`}
                      className="flex items-center justify-between gap-4 px-4 py-4"
                    >
                      <div>
                        <p className="text-body-sm font-medium text-content-primary">
                          {isTouchscreen
                            ? categoryAssignmentLabel(screen)
                            : formatDeviceScreenLabel(index)}
                        </p>
                      </div>
                      <Badge variant="brand">
                        {isTouchscreen
                          ? formatCategoryShortLabel(
                              screen.categoryName,
                              screen.categorySlug,
                            )
                          : categoryAssignmentLabel(screen)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {deployment.devices && deployment.devices.length > 0 && (
              <section>
                <SectionLabel className="mb-4 block">Linked Devices</SectionLabel>
                <ul className="divide-y divide-surface-border rounded-lg border border-surface-border">
                  {deployment.devices.map((device) => {
                    const mode =
                      typeof device.rotationMode === 'string'
                        ? device.rotationMode
                        : 'DEVICE';
                    const start =
                      (typeof device.effectiveRotationStartDate === 'string'
                        ? device.effectiveRotationStartDate
                        : null) ??
                      (typeof device.rotationStartDate === 'string'
                        ? device.rotationStartDate
                        : null);
                    const globalStart = globalRotation?.globalRotationStartDate ?? null;
                    const deviceName = resolveLinkedDeviceName(device);
                    return (
                      <li key={device.id} className="space-y-1 px-4 py-4 text-body-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-content-primary">{deviceName}</span>
                          <span className="text-caption text-content-muted">{device.id}</span>
                          <Badge variant={mode === 'GLOBAL' ? 'brand' : 'neutral'}>
                            {formatRotationScheduleLabel(mode)}
                          </Badge>
                        </div>
                        {mode === 'GLOBAL' ? (
                          <p className="text-content-secondary">
                            Global Rotation Start Date:{' '}
                            {formatPortalDate(globalStart ?? start)}
                          </p>
                        ) : (
                          <p className="text-content-secondary">
                            Rotation Start Date: {formatPortalDate(start)}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {(logoUrl || branding?.brandName) && (
              <section>
                <SectionLabel className="mb-4 block">Branding</SectionLabel>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-12 w-12 rounded object-contain border border-surface-border bg-white"
                    />
                  )}
                  <p className="text-body-sm text-content-primary">
                    {branding?.brandName || 'Custom branding'}
                  </p>
                </div>
              </section>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <dt className="text-body-sm text-content-secondary">{label}</dt>
      <dd className="text-right text-body-sm font-medium text-content-primary">{value}</dd>
    </div>
  );
}
