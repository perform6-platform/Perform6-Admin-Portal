import { useCallback, useEffect, useMemo, useState } from 'react';
import { Folder, HardDrive, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeviceSdFs, useQueueDeviceRemoteCommand } from '../../hooks/useDevices';
import { queryKeys } from '../../lib/queryKeys';
import type { SdFsEntry } from '../../types/monitoring';
import { Button } from '../ui';

export interface DeviceStoragePanelProps {
  deviceId: string | null;
  disabled?: boolean;
  storageUsedBytes?: string | null;
  storageCapacityBytes?: string | null;
  storageUsedPercent?: number;
}

const FOLDER_HINTS: Record<string, string> = {
  'perform6-cache': 'Media cache (HTTP fallback)',
  'perform6-media-pool': 'Media asset pool',
  'perform6-ota-pool': 'OTA package pool',
  assets: 'App assets',
};

function formatBytes(raw: string | number | null | undefined): string {
  if (raw == null || raw === '') return '—';
  const bytes = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function folderRole(name: string): string {
  return FOLDER_HINTS[name] ?? (name.endsWith('.brs') || name.endsWith('.html') || name.endsWith('.txt')
    ? 'Package file'
    : 'On SD card');
}

export function DeviceStoragePanel({
  deviceId,
  disabled,
  storageUsedBytes,
  storageCapacityBytes,
  storageUsedPercent = 0,
}: DeviceStoragePanelProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: queue, isPending: isQueueing } = useQueueDeviceRemoteCommand();
  const [awaitingCommandId, setAwaitingCommandId] = useState<string | null>(null);
  const [entries, setEntries] = useState<SdFsEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const polling = Boolean(awaitingCommandId);
  const { data: sdFs } = useDeviceSdFs(deviceId, {
    enabled: Boolean(deviceId),
    refetchInterval: polling ? 3_000 : 20_000,
  });

  const used = Number(storageUsedBytes ?? 0);
  const capacity = Number(storageCapacityBytes ?? 0);
  const free =
    Number.isFinite(capacity) && capacity > 0 && Number.isFinite(used)
      ? Math.max(0, capacity - used)
      : null;
  const pct =
    capacity > 0 && Number.isFinite(used)
      ? Math.min(100, Math.round((used / capacity) * 100))
      : storageUsedPercent;

  useEffect(() => {
    const latest = sdFs?.latest;
    if (!latest) return;
    if (awaitingCommandId && latest.commandId !== awaitingCommandId) return;
    if (awaitingCommandId && latest.commandId === awaitingCommandId) {
      setAwaitingCommandId(null);
    }
    if (!latest.ok) {
      setError(latest.error || 'Could not list SD folders');
      setStatus(`Failed: ${latest.action}`);
      return;
    }
    if (latest.action === 'SD_LIST') {
      setError(null);
      setEntries(latest.entries ?? []);
      setStatus(`Listed ${latest.entries?.length ?? 0} items on SD:/`);
    }
  }, [sdFs?.latest, awaitingCommandId]);

  const refreshFolders = useCallback(async () => {
    if (!deviceId || disabled) return;
    setError(null);
    setStatus('Queued SD folder list — waiting for next heartbeat (~60s)…');
    try {
      const cmd = await queue({
        deviceId,
        payload: { action: 'SD_LIST', path: 'SD:/' },
      });
      setAwaitingCommandId(cmd.id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices.sdFs(deviceId) });
    } catch {
      setError('Could not queue SD list');
      setStatus(null);
    }
  }, [deviceId, disabled, queue, queryClient]);

  useEffect(() => {
    if (!deviceId || disabled) return;
    // Auto-request once when panel mounts / device comes online.
    if (sdFs?.latest?.action === 'SD_LIST' && sdFs.latest.ok && (sdFs.latest.entries?.length ?? 0) > 0) {
      setEntries(sdFs.latest.entries ?? []);
      return;
    }
    void refreshFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / deviceId only
  }, [deviceId, disabled]);

  const folders = useMemo(
    () =>
      [...entries]
        .filter((e) => e.kind === 'dir' || FOLDER_HINTS[e.name] != null)
        .sort((a, b) => {
          if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    [entries],
  );

  const rootFiles = useMemo(
    () =>
      entries
        .filter((e) => e.kind === 'file' && FOLDER_HINTS[e.name] == null)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 12),
    [entries],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-surface-border bg-surface p-4">
        <div className="mb-3 flex items-center gap-2 text-body-sm font-medium text-content-primary">
          <HardDrive className="h-4 w-4 text-brand-600" />
          SD storage
        </div>
        {capacity > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-caption text-content-secondary">Used</p>
                <p className="text-body-sm font-semibold text-content-primary">
                  {formatBytes(used)}
                </p>
              </div>
              <div>
                <p className="text-caption text-content-secondary">Free</p>
                <p className="text-body-sm font-semibold text-content-primary">
                  {formatBytes(free)}
                </p>
              </div>
              <div>
                <p className="text-caption text-content-secondary">Total</p>
                <p className="text-body-sm font-semibold text-content-primary">
                  {formatBytes(capacity)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand-600 transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-caption text-content-muted">{pct}% used</p>
          </>
        ) : (
          <p className="text-caption text-content-muted">
            Waiting for player heartbeat to report free/total space (needs updated runtime +
            autorun). Folders below still work via remote SD list.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm font-medium text-content-primary">Folders on SD:/</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!deviceId || disabled || isQueueing}
          onClick={() => void refreshFolders()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh folders
        </Button>
      </div>

      {status ? <p className="text-caption text-content-secondary">{status}</p> : null}
      {error ? <p className="text-caption text-danger">{error}</p> : null}

      {folders.length === 0 && rootFiles.length === 0 ? (
        <p className="text-caption text-content-muted">
          No folder list yet — click Refresh (player must be online; result arrives on next
          heartbeat).
        </p>
      ) : (
        <ul className="divide-y divide-surface-border rounded-lg border border-surface-border">
          {folders.map((entry) => (
            <li
              key={`dir-${entry.name}`}
              className="flex items-start gap-3 px-3 py-2.5 text-body-sm"
            >
              <Folder className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-content-primary">{entry.name}</p>
                <p className="text-caption text-content-muted">{folderRole(entry.name)}</p>
              </div>
              {entry.kind === 'file' && entry.size > 0 ? (
                <span className="text-caption text-content-muted">{formatBytes(entry.size)}</span>
              ) : (
                <span className="text-caption text-content-muted">folder</span>
              )}
            </li>
          ))}
          {rootFiles.map((entry) => (
            <li
              key={`file-${entry.name}`}
              className="flex items-start gap-3 px-3 py-2.5 text-body-sm"
            >
              <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-content-primary">{entry.name}</p>
                <p className="text-caption text-content-muted">{folderRole(entry.name)}</p>
              </div>
              <span className="text-caption text-content-muted">{formatBytes(entry.size)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
