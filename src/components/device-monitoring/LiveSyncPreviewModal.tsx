import { useEffect, useMemo, useRef } from 'react';
import { useDeviceLivePlayback } from '../../hooks/useMonitoring';
import { resolveStorageUrl } from '../../lib/libraryType';
import { Badge, Modal, ModalBody } from '../ui';

const SOFT_RESYNC_DRIFT_SEC = 8;
const POLL_MS = 8_000;

export interface LiveSyncPreviewModalProps {
  open: boolean;
  onClose: () => void;
  deviceId: string | null;
  deviceName: string;
  screenKey: string;
  fallbackTitle?: string;
  fallbackThumbnail?: string;
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Estimate device playhead, compensating for age of the last telemetry sample.
 */
function estimateSeekSeconds(positionMs: number, updatedAt: string | null | undefined): number {
  const base = Math.max(0, positionMs) / 1000;
  if (!updatedAt) return base;
  const ageSec = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  if (!Number.isFinite(ageSec) || ageSec < 0) return base;
  return base + ageSec;
}

export function LiveSyncPreviewModal({
  open,
  onClose,
  deviceId,
  deviceName,
  screenKey,
  fallbackTitle,
  fallbackThumbnail,
}: LiveSyncPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSeekKeyRef = useRef<string>('');

  const { data, isLoading, isError, isFetching } = useDeviceLivePlayback(deviceId, {
    enabled: open && Boolean(deviceId),
    refetchInterval: open ? POLL_MS : false,
  });

  const screen = useMemo(
    () => data?.screens.find((entry) => entry.screenKey === screenKey) ?? null,
    [data?.screens, screenKey],
  );

  const fileUrl = resolveStorageUrl(screen?.fileUrl) ?? screen?.fileUrl ?? null;
  const thumbnail =
    resolveStorageUrl(screen?.thumbnailUrl) ??
    screen?.thumbnailUrl ??
    fallbackThumbnail ??
    null;
  const title = screen?.title || fallbackTitle || screenKey;
  const isLive = Boolean(data?.isLive && screen && fileUrl);

  useEffect(() => {
    if (!open) {
      lastSeekKeyRef.current = '';
      return;
    }
    const video = videoRef.current;
    if (!video || !fileUrl || !screen) return;

    const target = estimateSeekSeconds(screen.positionMs, data?.updatedAt);
    const seekKey = `${fileUrl}:${Math.round(target / SOFT_RESYNC_DRIFT_SEC)}`;

    const applySeek = () => {
      if (!Number.isFinite(target)) return;
      const duration = Number.isFinite(video.duration) ? video.duration : null;
      const clamped =
        duration && duration > 0 ? Math.min(Math.max(0, target), Math.max(0, duration - 0.25)) : Math.max(0, target);

      const drift = Math.abs(video.currentTime - clamped);
      const mediaChanged = lastSeekKeyRef.current.split(':')[0] !== fileUrl;
      if (mediaChanged || drift > SOFT_RESYNC_DRIFT_SEC) {
        video.currentTime = clamped;
        lastSeekKeyRef.current = seekKey;
      }
      if (screen.isPlaying) void video.play().catch(() => {});
      else video.pause();
    };

    if (video.readyState >= 1) applySeek();
    else {
      const onMeta = () => applySeek();
      video.addEventListener('loadedmetadata', onMeta, { once: true });
      return () => video.removeEventListener('loadedmetadata', onMeta);
    }
  }, [open, fileUrl, screen, data?.updatedAt]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Live sync preview"
      description={`${deviceName} · ${screenKey.replace(/_/g, ' ')}`}
      size="lg"
    >
      <ModalBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isLive ? (
            <Badge variant="success">Live · ±{SOFT_RESYNC_DRIFT_SEC}s sync</Badge>
          ) : (
            <Badge variant="warning">Waiting for device telemetry</Badge>
          )}
          {isFetching && !isLoading ? (
            <span className="text-caption text-content-muted">Refreshing…</span>
          ) : null}
          {data?.updatedAt ? (
            <span className="text-caption text-content-muted">
              Last device report{' '}
              {data.ageMs != null ? `${Math.max(0, Math.round(data.ageMs / 1000))}s` : '—'} ago
            </span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-lg border border-surface-border bg-black">
          {isLoading ? (
            <div className="flex aspect-video items-center justify-center text-body-sm text-content-muted">
              Loading playhead…
            </div>
          ) : isError ? (
            <div className="flex aspect-video items-center justify-center px-4 text-center text-body-sm text-content-muted">
              Could not load live playback for this device.
            </div>
          ) : fileUrl ? (
            <video
              ref={videoRef}
              key={fileUrl}
              src={fileUrl}
              className="aspect-video w-full bg-black object-contain"
              controls
              playsInline
              muted
              autoPlay={screen?.isPlaying ?? true}
              poster={thumbnail ?? undefined}
            />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center">
              {thumbnail ? (
                <img src={thumbnail} alt="" className="h-24 w-40 rounded object-cover opacity-80" />
              ) : null}
              <p className="text-body-sm text-content-muted">
                No live playhead yet. Keep the device online and playing — telemetry updates about
                every 8 seconds.
              </p>
              <p className="text-caption text-content-secondary">{title}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-muted/40 px-4 py-2">
          <p className="truncate text-body-sm font-medium text-content-primary">{title}</p>
          <p className="mt-0.5 text-caption text-content-secondary">
            {screen
              ? `Device position ~${formatClock(estimateSeekSeconds(screen.positionMs, data?.updatedAt))} · ${
                  screen.isPlaying ? 'Playing' : 'Paused'
                }`
              : 'Open this preview while the BrightSign player is active to sync from the same moment.'}
          </p>
        </div>
      </ModalBody>
    </Modal>
  );
}
