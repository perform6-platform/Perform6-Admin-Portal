import { useEffect, useMemo, useState } from 'react';
import {
  ChevronUp,
  FileText,
  Folder,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeviceSdFs, useQueueDeviceRemoteCommand } from '../../hooks/useDevices';
import { queryKeys } from '../../lib/queryKeys';
import type { SdFsEntry } from '../../types/monitoring';
import { Button, ConfirmModal, Input } from '../ui';

export interface DeviceSdBrowserProps {
  deviceId: string | null;
  disabled?: boolean;
}

function joinSdPath(dir: string, name: string): string {
  const base = dir.replace(/\/+$/, '') || 'SD:';
  return `${base}/${name}`;
}

function parentSdPath(path: string): string {
  const normalized = path.replace(/\/+$/, '');
  if (normalized === 'SD:' || normalized === 'SD:/' || normalized.length <= 4) {
    return 'SD:/';
  }
  const idx = normalized.lastIndexOf('/');
  if (idx <= 3) return 'SD:/';
  return normalized.slice(0, idx) || 'SD:/';
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeviceSdBrowser({ deviceId, disabled }: DeviceSdBrowserProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: queue, isPending: isQueueing } = useQueueDeviceRemoteCommand();
  const [path, setPath] = useState('SD:/');
  const [awaitingCommandId, setAwaitingCommandId] = useState<string | null>(null);
  const [entries, setEntries] = useState<SdFsEntry[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileEncoding, setFileEncoding] = useState<'utf8' | 'base64'>('utf8');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [writeName, setWriteName] = useState('');

  const polling = Boolean(awaitingCommandId);
  const { data: sdFs } = useDeviceSdFs(deviceId, {
    enabled: Boolean(deviceId),
    refetchInterval: polling ? 3000 : 15_000,
  });

  useEffect(() => {
    const latest = sdFs?.latest;
    if (!latest) return;
    if (awaitingCommandId && latest.commandId !== awaitingCommandId) return;

    if (awaitingCommandId && latest.commandId === awaitingCommandId) {
      setAwaitingCommandId(null);
    }

    if (!latest.ok) {
      setError(latest.error || 'SD operation failed');
      setStatus(`Failed: ${latest.action}`);
      return;
    }

    setError(null);
    if (latest.action === 'SD_LIST') {
      setEntries(latest.entries ?? []);
      if (latest.path) {
        const listed = latest.path.replace(/\/+$/, '') || 'SD:';
        setPath(`${listed}/`);
      }
      setStatus(`Listed ${latest.entries?.length ?? 0} items`);
      setFilePath(null);
      setFileContent('');
    } else if (latest.action === 'SD_READ') {
      setFilePath(latest.path);
      setFileContent(latest.content ?? '');
      setFileEncoding(latest.encoding === 'base64' ? 'base64' : 'utf8');
      setStatus(`Read ${latest.path} (${formatBytes(latest.sizeBytes ?? 0)})`);
    } else if (latest.action === 'SD_WRITE') {
      setStatus(`Wrote ${latest.path}`);
      void refreshList();
    } else if (latest.action === 'SD_DELETE') {
      setStatus(`Deleted ${latest.path}`);
      if (filePath === latest.path) {
        setFilePath(null);
        setFileContent('');
      }
      void refreshList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshList uses path/queue
  }, [sdFs?.latest, awaitingCommandId]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [entries]);

  const busy = disabled || !deviceId || isQueueing || Boolean(awaitingCommandId);

  async function queueFs(
    action: 'SD_LIST' | 'SD_READ' | 'SD_WRITE' | 'SD_DELETE',
    opts?: { path?: string; content?: string; encoding?: string },
  ) {
    if (!deviceId || disabled) return;
    setError(null);
    setStatus(`Queued ${action}… (delivered on next heartbeat ~60s)`);
    const cmd = await queue({
      deviceId,
      payload: {
        action,
        path: opts?.path ?? path,
        content: opts?.content,
        encoding: opts?.encoding,
      },
    });
    setAwaitingCommandId(cmd.id);
    void queryClient.invalidateQueries({ queryKey: queryKeys.devices.sdFs(deviceId) });
  }

  // Auto-list SD:/ once when panel opens (device online).
  useEffect(() => {
    if (!deviceId || disabled) return;
    if (entries.length > 0 || awaitingCommandId) return;
    if (sdFs?.latest?.action === 'SD_LIST' && sdFs.latest.ok) return;
    void queueFs('SD_LIST', { path: 'SD:/' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on open
  }, [deviceId, disabled]);

  async function refreshList(targetPath = path) {
    await queueFs('SD_LIST', { path: targetPath });
  }

  async function openDir(name: string) {
    const next = joinSdPath(path, name);
    setPath(next.endsWith('/') ? next : `${next}/`);
    await queueFs('SD_LIST', { path: next });
  }

  async function openFile(name: string) {
    const full = joinSdPath(path, name);
    await queueFs('SD_READ', { path: full });
  }

  async function saveFile() {
    if (!filePath) return;
    await queueFs('SD_WRITE', {
      path: filePath,
      content: fileContent,
      encoding: fileEncoding,
    });
  }

  async function createOrOverwrite() {
    const name = writeName.trim();
    if (!name) {
      setError('Enter a file name');
      return;
    }
    const full = joinSdPath(path, name);
    setFilePath(full);
    await queueFs('SD_WRITE', {
      path: full,
      content: fileContent.length > 0 ? fileContent : '\n',
      encoding: 'utf8',
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="min-w-[12rem] flex-1 font-mono text-xs"
          disabled={busy}
          aria-label="SD path"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void refreshList()}
        >
          <RefreshCw className="h-4 w-4" />
          List
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || path === 'SD:/' || path === 'SD:'}
          onClick={() => {
            const parent = parentSdPath(path);
            setPath(parent.endsWith('/') ? parent : `${parent}/`);
            void refreshList(parent);
          }}
        >
          <ChevronUp className="h-4 w-4" />
          Up
        </Button>
      </div>

      <p className="text-caption text-content-muted">
        Remote SD access (mini-DWS). Commands run after the next device heartbeat.
        Text/small files only (max 32KB). Big packages use OTA. Reboot after changing
        <span className="font-mono">autorun.brs</span>.
        {sdFs?.pending ? ` Pending: ${sdFs.pending.action}.` : ''}
        {status ? ` ${status}` : ''}
      </p>

      {error ? <p className="text-caption text-status-danger">{error}</p> : null}

      <div className="max-h-56 overflow-auto rounded-md border border-surface-border bg-surface-base">
        {sortedEntries.length === 0 ? (
          <p className="p-3 text-caption text-content-muted">
            {awaitingCommandId || sdFs?.pending
              ? 'Waiting for device heartbeat to return SD listing…'
              : 'No listing yet — opening this panel queues List SD:/ (device must be online).'}
          </p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {sortedEntries.map((entry) => (
              <li
                key={`${entry.kind}:${entry.name}`}
                className="flex items-center gap-2 px-3 py-2 text-body-sm"
              >
                {entry.kind === 'dir' ? (
                  <Folder className="h-4 w-4 shrink-0 text-brand-600" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-content-muted" />
                )}
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-content-primary hover:underline disabled:no-underline"
                  disabled={busy}
                  onClick={() =>
                    void (entry.kind === 'dir' ? openDir(entry.name) : openFile(entry.name))
                  }
                >
                  {entry.name}
                </button>
                <span className="shrink-0 text-caption text-content-muted">
                  {entry.kind === 'dir' ? 'dir' : formatBytes(entry.size)}
                </span>
                {entry.kind === 'file' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={busy}
                    onClick={() => setDeletePath(joinSdPath(path, entry.name))}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 rounded-md border border-surface-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption text-content-secondary">
            {filePath ? (
              <>
                Editing <span className="font-mono text-content-primary">{filePath}</span>
                {fileEncoding === 'base64' ? ' (base64)' : ''}
              </>
            ) : (
              'Open a file to read, or write a new name below'
            )}
          </span>
          {filePath ? (
            <Button type="button" size="sm" disabled={busy} onClick={() => void saveFile()}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          ) : null}
        </div>
        <textarea
          className="min-h-[8rem] w-full rounded-md border border-surface-border bg-surface-base p-2 font-mono text-xs text-content-primary"
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          disabled={busy}
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={writeName}
            onChange={(e) => setWriteName(e.target.value)}
            placeholder="new-file.brs"
            className="max-w-[14rem] font-mono text-xs"
            disabled={busy}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void createOrOverwrite()}
          >
            Write as new name
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deletePath)}
        onClose={() => setDeletePath(null)}
        onConfirm={() => {
          const target = deletePath;
          setDeletePath(null);
          if (target) void queueFs('SD_DELETE', { path: target });
        }}
        title="Delete SD file?"
        description={
          deletePath
            ? `Permanently delete ${deletePath} on the player SD card.`
            : 'Delete this file?'
        }
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
