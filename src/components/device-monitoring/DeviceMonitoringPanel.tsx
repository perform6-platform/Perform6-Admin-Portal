import { useState } from 'react';
import { Monitor } from 'lucide-react';
import type { Device } from '../../constants/devices';
import { useDevicePlayback } from '../../hooks/useRotation';
import { cn } from '../../lib/cn';
import { resolveStorageUrl } from '../../lib/libraryType';
import type { ManifestSlot } from '../../types/deployments';
import { BrightSignDeviceImage } from '../devices/BrightSignDeviceImage';
import { Badge, CARD_SURFACE_CLASS, SectionLabel } from '../ui';
import { LiveSyncPreviewModal } from './LiveSyncPreviewModal';

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
    group: screen.screenKey,
    label: screen.categoryName || screen.screenKey,
    video: screen.title || 'No video assigned',
    thumbnail: resolveStorageUrl(screen.thumbnail) ?? undefined,
  }));
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
  const { data: playback, isLoading, isError } = useDevicePlayback(
    hasFleetScreens ? null : (device?.id ?? null),
    {
      refetchInterval: autoRefresh ? 30_000 : false,
    },
  );

  if (!device) {
    return (
      <div className={cn(CARD_SURFACE_CLASS, 'flex min-h-[480px] items-center justify-center p-6', className)}>
        <p className="text-body-sm text-content-muted">Select a device to view schedule details</p>
      </div>
    );
  }

  const rotationDay = device.rotationDay ?? playback?.rotationDay;
  const currentVideos = hasFleetScreens
    ? screenEntries(device)
    : slotEntries(playback?.content);
  const dayLabel =
    rotationDay != null
      ? `Day ${rotationDay}`
      : device.currentDay !== '—'
        ? device.currentDay
        : null;

  const registeredDeviceId = device.deviceId ?? (device.inventoryState === 'registered' ? device.id : null);

  return (
    <div className={cn(CARD_SURFACE_CLASS, 'p-5 sm:p-6', className)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">{device.name}</h2>
          <p className="mt-1 text-body-sm text-content-secondary">{device.location}</p>
        </div>
        <Badge variant={device.status === 'online' ? 'success' : 'danger'} className="shrink-0">
          {device.status === 'online' ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <BrightSignDeviceImage />
        <p className="mt-2 text-body-sm font-semibold text-content-primary">{device.model}</p>
      </div>

      <section className="rounded-lg border border-surface-border bg-surface-muted/30 p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
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
                      // Fleet rows use real SCREEN_* keys; slot fallback maps to HDMI SCREEN_1.
                      screenKey: hasFleetScreens ? entry.key : 'SCREEN_1',
                      title: entry.video,
                      thumbnail: entry.thumbnail,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-lg border border-surface-border bg-surface-card px-3 py-2.5 text-left transition-colors hover:border-brand-500/40 hover:bg-brand-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35"
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
                    {entry.group.replace(/_/g, ' ')}
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
