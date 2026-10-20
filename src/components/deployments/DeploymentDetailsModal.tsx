import { useMemo } from 'react';
import { useDeployment } from '../../hooks/useDeployments';
import { useGlobalRotationSettings } from '../../hooks/useRotation';
import {
  formatBrandingModeLabel,
  formatCategoryShortLabel,
  formatDeploymentAxes,
  formatDeploymentTypeLabel,
  formatPlaylistKeyLabel,
  formatPortalDate,
  formatRotationScheduleLabel,
  resolveDeploymentRotationMode,
  resolveDeploymentScreens,
} from '../../lib/deploymentDisplay';
import { isTouchscreenDeployment } from '../../lib/deploymentWizard';
import { resolveStorageUrl } from '../../lib/libraryType';
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

  const screens = useMemo(
    () => resolveDeploymentScreens(deployment),
    [deployment],
  );
  const axes = useMemo(
    () => formatDeploymentAxes(deployment),
    [deployment],
  );
  const branding = deployment?.branding?.[0];
  const logoUrl =
    branding && typeof branding.logoUrl === 'string'
      ? resolveStorageUrl(branding.logoUrl)
      : null;
  const isTouchscreen = isTouchscreenDeployment(deployment?.deploymentType);
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
                <DetailRow label="Name" value={deployment.name || '—'} />
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
              </dl>
            </section>

            <section>
              <SectionLabel className="mb-4 block">
                {isTouchscreen ? 'Content Category Assignments' : 'Screen → Category'}
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
                            : `Screen ${index + 1}`}
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
                    const deviceName =
                      typeof device.deviceName === 'string' && device.deviceName.trim()
                        ? device.deviceName
                        : typeof device.serialNumber === 'string' && device.serialNumber.trim()
                          ? device.serialNumber
                          : device.id.slice(0, 8);
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
