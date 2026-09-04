import { useMemo, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import type { Device } from '../../constants/devices';
import { useDevicePlayback } from '../../hooks/useRotation';
import { useDeviceLivePlayback } from '../../hooks/useMonitoring';
import { cn } from '../../lib/cn';
import {
  formatTouchPlaybackState,
  formatTouchSlotLabel,
  isTouchscreenDeployment,
  resolveScreenOutputLabel,
} from '../../lib/screenOutputLabels';
import { resolveStorageUrl } from '../../lib/libraryType';
import type { ManifestSlot } from '../../types/deployments';
import type { TouchUiSnapshot } from '../../types/monitoring';
import { BrightSignDeviceImage } from '../devices/BrightSignDeviceImage';
import { Badge, CARD_SURFACE_CLASS, SectionLabel } from '../ui';
import { LiveSyncPreviewModal } from './LiveSyncPreviewModal';
import { TouchRemoteControls } from './TouchRemoteControls';
import { DeviceRemoteOps } from './DeviceRemoteOps';
import { DeviceStoragePanel } from './DeviceStoragePanel';

export interface DeviceMonitoringPanelProps {
  device: Device | null;
  autoRefresh?: boolean;
  className?: string;
}

interface PlayingEntry {
  key: string;
  group: string;
  label: string;
  video: string;
  thumbnail?: string;
}

function slotEntries(content: Record<string, ManifestSlot> | undefined): PlayingEntry[] {
  if (!content) return [];

  return Object.values(content).flatMap((slot) => {
    const items = slot.items?.length
      ? slot.items
      : slot.metadata?.title
        ? [
            {
              title: slot.metadata.title,
              video: slot.metadata.title,
              thumbnail: slot.metadata.thumbnail,
              mediaVersionId: `${slot.slot}-meta`,
            },
          ]
        : [];

    return items.map((item, index) => ({
      key: `${slot.slot}-${item.mediaVersionId ?? index}`,
      group: slot.libraryType || slot.slot,
      label: slot.label || slot.slot,
      video: item.title || item.video || 'Untitled',
      thumbnail: resolveStorageUrl(item.thumbnail) ?? undefined,
    }));
  });
}

function screenEntries(device: Device): PlayingEntry[] {
  return (device.screens ?? []).map((screen) => ({
    key: screen.screenKey,
    group: resolveScreenOutputLabel(screen.screenKey, device.model),
    label: screen.categoryName || screen.screenKey,
    video: screen.title || 'No video assigned',
    thumbnail: resolveStorageUrl(screen.thumbnail) ?? undefined,
  }));
}

function formatSessionElapsed(sessionStartedAt?: number | null): string | null {
  if (!sessionStartedAt) return null;
  const elapsedSec = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function TouchUiStatus({ touchUi }: { touchUi: TouchUiSnapshot | null | undefined }) {
  if (!touchUi?.currentContent) {
    return (
      <p className="text-body-sm text-content-muted">
        No live Bluefin telemetry yet. Device must be online and on the Home screen.
      </p>
    );
  }

  const slotLabel = formatTouchSlotLabel(touchUi.currentContent.slot);
  const stateLabel = formatTouchPlaybackState(touchUi.playbackState);
  const elapsed = formatSessionElapsed(touchUi.currentContent.sessionStartedAt);

  return (
    <div className="space-y-1">
      <p className="text-body-sm font-medium text-content-primary">
        {stateLabel} · {slotLabel}
      </p>
      {touchUi.currentContent.title ? (
        <p className="truncate text-body-sm text-content-secondary">
          {touchUi.currentContent.title}
        </p>
      ) : null}
      {elapsed ? (
        <p className="text-caption text-content-muted">Session elapsed {elapsed}</p>
      ) : null}
      {touchUi.updatedAt ? (
        <p className="text-caption text-content-muted">
          Updated {new Date(touchUi.updatedAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  );
}

export function DeviceMonitoringPanel({
  device,
  autoRefresh = false,
  className,
}: DeviceMonitoringPanelProps) {
  const [preview, setPreview] = useState<{
    screenKey: string;
    title: string;
    thumbnail?: string;
  } | null>(null);

  const hasFleetScreens = Boolean(device?.screens && device.screens.length > 0);
  const isTouchDevice = isTouchscreenDeployment(device?.deploymentType, device?.model);
  const registeredDeviceId = device?.deviceId ?? (device?.inventoryState === 'registered' ? device.id : null);

  const { data: playback, isLoading, isError } = useDevicePlayback(
    hasFleetScreens ? null : (device?.id ?? null),
    {
      refetchInterval: autoRefresh ? 30_000 : false,
    },
  );

  const { data: livePlayback } = useDeviceLivePlayback(registeredDeviceId, {
    enabled: Boolean(registeredDeviceId && isTouchDevice),
    refetchInterval: 8_000,
  });

  const touchUi = livePlayback?.touchUi ?? device?.touchUi ?? null;

  const currentVideos = useMemo(() => {
    if (!device) return [];
    return hasFleetScreens ? screenEntries(device) : slotEntries(playback?.content);
  }, [device, hasFleetScreens, playback?.content]);

  if (!device) {
    return (
      <div className={cn(CARD_SURFACE_CLASS, 'flex min-h-[480px] items-center justify-center p-6', className)}>
        <p className="text-body-sm text-content-muted">Select a device to view schedule details</p>
      </div>
    );
  }

  const rotationDay = device.rotationDay ?? playback?.rotationDay;
  const dayLabel =
    rotationDay != null
      ? `Day ${rotationDay}`
      : device.currentDay !== '—'
        ? device.currentDay
        : null;

  return (
    <div className={cn(CARD_SURFACE_CLASS, 'p-6 sm:p-6', className)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-content-primary">{device.name}</h2>
          <p className="mt-1 text-body-sm text-content-secondary">{device.location}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={device.status === 'online' ? 'success' : 'danger'} className="shrink-0">
            {device.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
          {device.sdPresent === true && (
            <Badge variant="success">SD card: Present</Badge>
          )}
          {device.sdPresent === false && (
            <Badge variant="warning">SD card: Missing</Badge>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <BrightSignDeviceImage />
        <p className="mt-2 text-body-sm text-content-primary">{device.model}</p>
      </div>

      {isTouchDevice ? (
        <section className="mb-6 rounded-lg border border-surface-border bg-surface-muted/30 p-4 sm:p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <SectionLabel className="mb-1 block">Bluefin touch (HDMI-1)</SectionLabel>
              <TouchUiStatus touchUi={touchUi} />
            </div>
          </div>

          <div className="border-t border-surface-border pt-4">
            <SectionLabel className="mb-3 block">Remote control</SectionLabel>
            <TouchRemoteControls
              deviceId={registeredDeviceId}
              disabled={device.status !== 'online'}
            />
          </div>

          <div className="mt-4 border-t border-surface-border pt-4">
            <SectionLabel className="mb-3 block">Device operations</SectionLabel>
            <DeviceRemoteOps
              deviceId={registeredDeviceId}
              disabled={device.status !== 'online'}
            />
          </div>

          <div className="mt-4 border-t border-surface-border pt-4">
            <SectionLabel className="mb-3 block">Storage</SectionLabel>
            <DeviceStoragePanel
              deviceId={registeredDeviceId}
              disabled={device.status !== 'online'}
              storageUsedBytes={device.storageUsedBytes}
              storageCapacityBytes={device.storageCapacityBytes}
              storageUsedPercent={device.storageUsed}
            />
          </div>
        </section>
      ) : (
        <section className="mb-6 rounded-lg border border-surface-border bg-surface-muted/30 p-4 sm:p-6">
          <SectionLabel className="mb-3 block">Device operations</SectionLabel>
          <DeviceRemoteOps
            deviceId={registeredDeviceId}
            disabled={device.status !== 'online'}
          />
          <div className="mt-6 border-t border-surface-border pt-4">
            <SectionLabel className="mb-3 block">Storage</SectionLabel>
            <DeviceStoragePanel
              deviceId={registeredDeviceId}
              disabled={device.status !== 'online'}
              storageUsedBytes={device.storageUsedBytes}
              storageCapacityBytes={device.storageCapacityBytes}
              storageUsedPercent={device.storageUsed}
            />
          </div>
        </section>
      )}

      <section className="rounded-lg border border-surface-border bg-surface-muted/30 p-4 sm:p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <SectionLabel className="mb-1 block">
              {dayLabel ? `Currently playing on ${dayLabel}` : 'Currently playing'}
            </SectionLabel>
            <p className="text-body-sm text-content-secondary">
              {device.name} · {device.location}
              {playback?.field ? ` · ${playback.field}` : ''}
              {playback?.variant ? ` · ${playback.variant}` : ''}
              {dayLabel ? ` · ${dayLabel}` : ''}
            </p>
            <p className="mt-1 text-caption text-content-muted">
              Click a screen to open a live sync preview (≈8s drift).
            </p>
          </div>
        </div>

        {!hasFleetScreens && isLoading ? (
          <p className="rounded-lg border border-dashed border-surface-border px-4 py-8 text-center text-body-sm text-content-muted">
            Loading playback…
          </p>
        ) : !hasFleetScreens && isError ? (
          <p className="rounded-lg border border-dashed border-surface-border px-4 py-8 text-center text-body-sm text-content-muted">
            Could not load current playback for this device.
          </p>
        ) : currentVideos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-surface-border px-4 py-8 text-center text-body-sm text-content-muted">
            No screen content for today&apos;s rotation.
          </p>
        ) : (
          <ul className="space-y-2">
            {currentVideos.map((entry) => (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() =>
                    setPreview({
                      screenKey: hasFleetScreens ? entry.key : 'SCREEN_1',
                      title: entry.video,
                      thumbnail: entry.thumbnail,
                    })
                  }
                  className="flex w-full items-center gap-4 rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-left transition-colors hover:border-brand-500/40 hover:bg-brand-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35"
                >
                  {entry.thumbnail ? (
                    <img
                      src={entry.thumbnail}
                      alt=""
                      className="h-10 w-14 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-surface-muted text-[10px] text-content-muted">
                      Screen
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-medium text-content-primary">
                      {entry.video}
                    </p>
                    <p className="truncate text-caption text-content-secondary">{entry.label}</p>
                  </div>
                  <Badge variant="neutral" className="shrink-0">
                    {entry.group}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <LiveSyncPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        deviceId={registeredDeviceId}
        deviceName={device.name}
        screenKey={preview?.screenKey ?? ''}
        fallbackTitle={preview?.title}
        fallbackThumbnail={preview?.thumbnail}
      />
    </div>
  );
}
