import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDeviceLivePlayback } from '../../hooks/useMonitoring';
import { resolveStorageUrl } from '../../lib/libraryType';
import { resolveScreenOutputLabel } from '../../lib/screenOutputLabels';
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
  deviceModel?: string | null;
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Estimate device playhead, compensating for age of the last telemetry sample.
 * When duration is known, wrap within the media length so looped playback
 * does not display cumulative wall-clock time past the video end.
 */
function estimateSeekSeconds(
  positionMs: number,
  updatedAt: string | null | undefined,
  durationMs?: number | null,
): number {
  let base = Math.max(0, positionMs) / 1000;
  if (updatedAt) {
    const ageSec = (Date.now() - new Date(updatedAt).getTime()) / 1000;
    if (Number.isFinite(ageSec) && ageSec > 0) {
      base += ageSec;
    }
  }
  if (durationMs != null && durationMs > 0) {
    const durationSec = durationMs / 1000;
    if (durationSec > 0) {
      base = base % durationSec;
    }
  }
  return base;
}

function resolvePreviewCopy(screenKey: string, source: string | null | undefined) {
  const key = screenKey.toUpperCase();
  if (source === 'HTML_UI' || key === 'SCREEN_1' || key === 'XT_HDMI_1') {
    return {
      title: 'Touchscreen Background',
      description: 'Background Video Only (UI Not Shown)',
      output: 'Bluefin · HDMI-1',
      contentLabel: null as string | null,
    };
  }
  return {
    title: 'Main Display',
    description: null as string | null,
    output: 'LED · HDMI-2',
    contentLabel: 'Now Playing',
  };
}

export function LiveSyncPreviewModal({
  open,
  onClose,
  deviceId,
  deviceName,
  screenKey,
  fallbackTitle,
  fallbackThumbnail,
  deviceModel,
}: LiveSyncPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSeekKeyRef = useRef<string>('');
  const [techOpen, setTechOpen] = useState(false);

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
  const mediaTitle = screen?.title || fallbackTitle || screenKey;
  const isLive = Boolean(data?.isLive && screen && fileUrl);
  const copy = resolvePreviewCopy(screenKey, screen?.source);
  const outputLabel =
    screen?.output ||
    resolveScreenOutputLabel(screenKey, deviceModel) ||
    copy.output;
  const positionSec = screen
    ? estimateSeekSeconds(screen.positionMs, data?.updatedAt, screen.durationMs)
    : 0;
  const durationSec =
    screen?.durationMs != null && screen.durationMs > 0
      ? screen.durationMs / 1000
      : null;
  const playbackStatus = screen
    ? screen.isPlaying
      ? 'Playing'
      : 'Paused'
    : 'Stopped';

  useEffect(() => {
    if (!open) {
      lastSeekKeyRef.current = '';
      setTechOpen(false);
      return;
    }
    const video = videoRef.current;
    if (!video || !fileUrl || !screen) return;

    const target = estimateSeekSeconds(
      screen.positionMs,
      data?.updatedAt,
      screen.durationMs,
    );
    const seekKey = `${fileUrl}:${Math.round(target / SOFT_RESYNC_DRIFT_SEC)}`;

    const applySeek = () => {
      if (!Number.isFinite(target)) return;
      const htmlDuration = Number.isFinite(video.duration) ? video.duration : null;
      const mediaDuration = durationSec ?? htmlDuration;
      const clamped =
        mediaDuration && mediaDuration > 0
          ? Math.min(Math.max(0, target), Math.max(0, mediaDuration - 0.25))
          : Math.max(0, target);

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
  }, [open, fileUrl, screen, data?.updatedAt, durationSec]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Live Sync Preview"
      description={`${deviceName} · ${outputLabel}${
        copy.description?.includes('Background') ? ' (Background Only)' : ' (Main Display)'
      }`}
      size="lg"
    >
      <ModalBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isLive ? (
            <Badge variant="success">Live Sync · ±{SOFT_RESYNC_DRIFT_SEC}s</Badge>
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

        {copy.contentLabel ? (
          <p className="text-body-sm text-content-secondary">
            {copy.contentLabel}:{' '}
            <span className="font-medium text-content-primary">{mediaTitle}</span>
          </p>
        ) : (
          <div>
            <p className="text-body-sm font-medium text-content-primary">{copy.title}</p>
            {copy.description ? (
              <p className="text-caption text-content-secondary">{copy.description}</p>
            ) : null}
          </div>
        )}

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
              className="video-no-overflow aspect-video w-full bg-black object-contain"
              controls
              controlsList="nodownload noremoteplayback noplaybackrate"
              disablePictureInPicture
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
                {data?.isLive && data.screens.length > 0
                  ? 'Not currently playing on this output.'
                  : 'No live playhead yet. Keep the device online and playing — telemetry updates about every 8 seconds.'}
              </p>
              <p className="text-caption text-content-secondary">{mediaTitle}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-muted/40 px-4 py-3">
          <p className="text-caption font-medium uppercase tracking-wide text-content-muted">
            Primary playback
          </p>
          <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-caption text-content-secondary">Video title</dt>
              <dd className="truncate text-body-sm font-medium text-content-primary">
                {mediaTitle}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-content-secondary">Playback status</dt>
              <dd className="text-body-sm font-medium text-content-primary">{playbackStatus}</dd>
            </div>
            <div>
              <dt className="text-caption text-content-secondary">Playback position</dt>
              <dd className="text-body-sm font-medium text-content-primary">
                {formatClock(positionSec)}
                {durationSec != null ? ` / ${formatClock(durationSec)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-content-secondary">Output</dt>
              <dd className="text-body-sm font-medium text-content-primary">{outputLabel}</dd>
            </div>
            <div>
              <dt className="text-caption text-content-secondary">Playback source</dt>
              <dd className="text-body-sm font-medium text-content-primary">Local SD Card</dd>
            </div>
            {screen?.stage ? (
              <div>
                <dt className="text-caption text-content-secondary">Player stage</dt>
                <dd className="text-body-sm font-medium text-content-primary">{screen.stage}</dd>
              </div>
            ) : null}
          </dl>
          {durationSec == null && screen ? (
            <p className="mt-2 text-caption text-content-muted">
              Duration not reported by the player yet — position is shown within the known media
              length when available, and otherwise may reflect elapsed wall time until firmware
              reports duration.
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-surface-border">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
            onClick={() => setTechOpen((open) => !open)}
            aria-expanded={techOpen}
          >
            <span className="flex items-center gap-2 text-body-sm font-medium text-content-primary">
              {techOpen ? (
                <ChevronDown className="h-4 w-4 text-content-muted" />
              ) : (
                <ChevronRight className="h-4 w-4 text-content-muted" />
              )}
              Technical details
            </span>
          </button>
          {techOpen ? (
            <div className="space-y-1 border-t border-surface-border px-4 py-3 text-caption text-content-secondary">
              <p>
                Sync request ID:{' '}
                <span className="font-mono text-content-primary">
                  {screen?.requestId ?? '—'}
                </span>
              </p>
              <p className="truncate">
                Local media path:{' '}
                <span className="font-mono text-content-primary">{screen?.path ?? '—'}</span>
              </p>
              <p>
                Source:{' '}
                <span className="text-content-primary">{screen?.source ?? '—'}</span>
              </p>
              {screen?.error ? (
                <p className="text-status-error">Error: {screen.error}</p>
              ) : null}
              <p>
                Raw position sample:{' '}
                <span className="text-content-primary">
                  {screen ? `${Math.round(screen.positionMs / 1000)}s` : '—'}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      </ModalBody>
    </Modal>
  );
}
