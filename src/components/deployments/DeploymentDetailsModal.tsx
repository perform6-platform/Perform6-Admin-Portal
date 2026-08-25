import { useMemo } from 'react';
import { useDeployment } from '../../hooks/useDeployments';
import { cn } from '../../lib/cn';
import {
  formatDeploymentAxes,
  formatEnumLabel,
  formatScreenContentLabel,
  formatScreenRoleLabel,
  resolveDeploymentScreens,
} from '../../lib/deploymentDisplay';
import { resolveStorageUrl } from '../../lib/libraryType';
import { Badge, Button, CARD_SURFACE_CLASS, Modal, ModalBody, SectionLabel } from '../ui';

export interface DeploymentDetailsModalProps {
  open: boolean;
  deploymentId: string | null;
  onClose: () => void;
}

function brandingLabel(config?: Record<string, unknown>): string {
  const mode = config?.brandingMode;
  if (mode === 'CUSTOM') return 'Custom';
  if (mode === 'NONE') return 'None';
  return 'Platform default';
}

export function DeploymentDetailsModal({
  open,
  deploymentId,
  onClose,
}: DeploymentDetailsModalProps) {
  const { data: deployment, isLoading, isError } = useDeployment(
    open ? deploymentId : null,
  );

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
            <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
              <SectionLabel className="mb-4 block">Overview</SectionLabel>
              <dl className="divide-y divide-surface-border rounded-lg border border-surface-border">
                <DetailRow label="Name" value={deployment.name || '—'} />
                <DetailRow label="Type" value={formatEnumLabel(deployment.deploymentType)} />
                <DetailRow
                  label={axes.isAxisFree ? 'Content' : 'Field'}
                  value={axes.fieldLabel}
                />
                <DetailRow
                  label={axes.isAxisFree ? 'Program' : 'Variant'}
                  value={axes.variantLabel}
                />
                <DetailRow label="Branding" value={brandingLabel(deployment.config)} />
                <DetailRow
                  label="Devices"
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

            <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
              <SectionLabel className="mb-4 block">Screen → category</SectionLabel>
              {screens.length === 0 ? (
                <p className="rounded-lg border border-dashed border-surface-border px-4 py-6 text-center text-body-sm text-content-muted">
                  No screen assignments on this deployment.
                </p>
              ) : (
                <ul className="divide-y divide-surface-border rounded-lg border border-surface-border">
                  {screens.map((screen) => {
                    const role = formatScreenRoleLabel(screen);
                    return (
                      <li
                        key={screen.screenKey}
                        className="flex items-center justify-between gap-4 px-4 py-4"
                      >
                        <div>
                          <p className="text-body-sm font-medium text-content-primary">
                            {formatEnumLabel(screen.screenKey)}
                          </p>
                          {role ? (
                            <p className="text-caption text-content-muted">
                              Role: {role}
                            </p>
                          ) : null}
                        </div>
                        <Badge variant="brand">
                          {formatScreenContentLabel(screen)}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {deployment.devices && deployment.devices.length > 0 && (
              <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
                <SectionLabel className="mb-4 block">Linked devices</SectionLabel>
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
                    return (
                      <li key={device.id} className="px-4 py-4 text-body-sm text-content-primary">
                        <span className="font-medium">{device.id.slice(0, 8)}…</span>
                        <Badge variant={mode === 'GLOBAL' ? 'brand' : 'neutral'} className="ml-2">
                          {mode === 'GLOBAL' ? 'Global rotation' : 'Custom rotation'}
                        </Badge>
                        {start ? (
                          <span className="ml-2 text-content-secondary">
                            Day 1 {start}
                          </span>
                        ) : mode === 'GLOBAL' ? (
                          <span className="ml-2 text-content-secondary">
                            Awaiting global calendar
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {(logoUrl || branding?.brandName) && (
              <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
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
      <dd className="max-w-[60%] text-right text-body-sm font-medium text-content-primary">
        {value}
      </dd>
    </div>
  );
}
