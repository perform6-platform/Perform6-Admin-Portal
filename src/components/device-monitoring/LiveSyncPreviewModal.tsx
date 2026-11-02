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

interface PreviewLatch {
  mediaKey: string;
  pauseOffsetSec: number;
  /** Unwrapped playhead, used so resume can subtract pause time. */
  frozenSec: number | null;
  /** Position shown in the preview. Held still while the device reports paused. */
  displaySec: number | null;
  wasPlaying: boolean;
}

function previewMediaKey(screen: {
  mediaVersionId?: string | null;
  path?: string | null;
  requestId?: string | null;
}): string {
  return `${screen.mediaVersionId ?? ''}|${screen.path ?? ''}|${screen.requestId ?? ''}`;
}

/**
 * Playhead for the preview. While the device is playing, sample age is added and
 * a known duration wraps the displayed time. While paused, the last playhead is
 * held: later samples are ignored, so a wall-clock position cannot walk or loop.
 * Pause time observed while this preview is open is removed on resume.
 */
function stepPreviewPlayhead(
  latch: PreviewLatch,
  sample: {
    positionMs: number;
    isPlaying: boolean;
    durationMs?: number | null;
    mediaVersionId?: string | null;
    path?: string | null;
    requestId?: string | null;
  },
  updatedAt: string | null | undefined,
  nowMs: number,
): number {
  const key = previewMediaKey(sample);
  if (latch.mediaKey !== key) {
    latch.mediaKey = key;
    latch.pauseOffsetSec = 0;
    latch.frozenSec = null;
    latch.displaySec = null;
    latch.wasPlaying = false;
  }

  const positionSec = Math.max(0, sample.positionMs) / 1000;
  let ageSec = 0;
  if (sample.isPlaying && updatedAt) {
    const age = (nowMs - new Date(updatedAt).getTime()) / 1000;
    if (Number.isFinite(age) && age > 0 && age < 30) ageSec = age;
  }
  const durationSec =
    sample.durationMs != null && sample.durationMs > 0 ? sample.durationMs / 1000 : null;

  const wrap = (value: number) =>
    durationSec && durationSec > 0 ? value % durationSec : value;

  if (!sample.isPlaying) {
    if (latch.displaySec == null) {
      const base = Math.max(0, positionSec - latch.pauseOffsetSec);
      latch.frozenSec = base;
      latch.displaySec = wrap(base);
    }
    latch.wasPlaying = false;
    return latch.displaySec;
  }

  if (!latch.wasPlaying && latch.frozenSec != null) {
    latch.pauseOffsetSec = positionSec + ageSec - latch.frozenSec;
  }
  let unwrapped = positionSec + ageSec - latch.pauseOffsetSec;
  if (!Number.isFinite(unwrapped) || unwrapped < 0) unwrapped = 0;
  latch.frozenSec = unwrapped;
  latch.wasPlaying = true;
  latch.displaySec = wrap(unwrapped);
  return latch.displaySec;
}

function formatPlaybackResolution(
  resolution: string | null | undefined,
  frameRate: number | null | undefined,
  output: string | null | undefined,
): string {
  const source = `${resolution ?? ''} ${output ?? ''}`;
  const dims = source.match(/(\d{3,5})\s*[x×]\s*(\d{3,5})/i);
  if (!dims) return '—';
  const fpsFromRate =
    frameRate != null && Number.isFinite(frameRate) && frameRate > 0
      ? Math.round(frameRate)
      : null;
  const fpsFromText = source.match(/[x×]\s*\d{3,5}\s*[x×]\s*(\d{2,3})\s*p/i)?.[1];
  const fps = fpsFromRate ?? (fpsFromText ? Number(fpsFromText) : null);
  const size = `${Number(dims[1])} × ${Number(dims[2])}`;
  return fps ? `${size} · ${fps}p` : size;
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
  const latchRef = useRef<PreviewLatch>({
    mediaKey: '',
    pauseOffsetSec: 0,
    frozenSec: null,
    displaySec: null,
    wasPlaying: false,
  });
  const [techOpen, setTechOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { data, isLoading, isError, isFetching } = useDeviceLivePlayback(deviceId, {
    enabled: open && Boolean(deviceId),
    refetchInterval: open ? POLL_MS : false,
  });

  useEffect(() => {
    if (!open) {
      latchRef.current = {
        mediaKey: '',
        pauseOffsetSec: 0,
        frozenSec: null,
        displaySec: null,
        wasPlaying: false,
      };
      return;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

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
  const isXt = (deviceModel ?? '').toUpperCase() === 'XT2145';
  const isHdmi1 =
    screen?.source === 'HTML_UI' ||
    screenKey.toUpperCase() === 'SCREEN_1' ||
    screenKey.toUpperCase() === 'XT_HDMI_1';
  const previewSubheading = isXt
    ? `${deviceName} · ${isHdmi1 ? 'HDMI-1 (Background Only)' : 'HDMI-2 (Main Display)'}`
    : `${deviceName} · ${outputLabel}${
        copy.description?.includes('Background') ? ' (Background Only)' : ' (Main Display)'
      }`;
  const positionSec = screen
    ? stepPreviewPlayhead(latchRef.current, screen, data?.updatedAt, nowMs)
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
    const video = videoRef.current;
    if (!open || !video || screen?.isPlaying !== false) return;
    video.pause();
  }, [open, screen, nowMs]);

  useEffect(() => {
    if (!open) {
      lastSeekKeyRef.current = '';
      setTechOpen(false);
      return;
    }
    const video = videoRef.current;
    if (!video || !fileUrl || !screen) return;

    const target = positionSec;
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
  }, [open, fileUrl, screen, data?.updatedAt, durationSec, positionSec]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Live Sync Preview"
      description={previewSubheading}
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
              autoPlay={screen?.isPlaying === true}
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
              <dt className="text-caption text-content-secondary">Resolution</dt>
              <dd className="text-body-sm font-medium text-content-primary">
                {formatPlaybackResolution(screen?.resolution, screen?.frameRate, screen?.output)}
              </dd>
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
