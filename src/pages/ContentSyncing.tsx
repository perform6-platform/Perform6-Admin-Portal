import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Badge,
  Dropdown,
  PageTitle,
  Table,
  type TableColumn,
} from '../components/ui';
import { useSyncDeviceDetail, useSyncFleet } from '../hooks/useSyncFleet';
import type { RequiredMediaRow, SyncFleetDeviceRow, SyncFleetStatus } from '../types/sync';

const filterOptions = [
  { value: 'all', label: 'All devices' },
  { value: 'incomplete', label: 'Incomplete only' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
] as const;

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  return formatDistanceToNow(date, { addSuffix: true });
}

function formatBytes(value: string | null | undefined): string {
  if (!value) return '—';
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function deploymentLabel(device: SyncFleetDeviceRow): string {
  const dep = device.deployment;
  if (!dep) return '—';
  return [dep.deploymentType, dep.fieldCategory, dep.exerciseVariant]
    .filter(Boolean)
    .join(' · ') || '—';
}

function windowLabel(device: SyncFleetDeviceRow): string {
  const cw = device.cacheWindow;
  if (cw?.inPrefetchLeadWindow && cw.nextWeekStart) {
    return `Prefetch → ${cw.nextWeekStart}`;
  }
  if (cw?.currentWeekStart) {
    return `Week of ${cw.currentWeekStart}`;
  }
  const from = cw?.rotationDayFrom;
  const to = cw?.rotationDayTo;
  if (from == null || to == null) return '—';
  return `Day ${from}–${to}`;
}

function prefetchLabel(device: SyncFleetDeviceRow): string {
  const ps = device.prefetchStatus;
  if (!ps) return '—';
  if (ps.nextWeek.downloading) {
    return `Next week ${ps.nextWeek.cached}/${ps.nextWeek.expected}`;
  }
  if (ps.currentWeek.complete) return 'Current week ready';
  return `Current ${ps.currentWeek.cached}/${ps.currentWeek.expected}`;
}

function statusBadgeVariant(status: SyncFleetStatus): 'success' | 'danger' | 'warning' | 'neutral' | 'brand' {
  switch (status) {
    case 'COMPLETE':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'DOWNLOADING':
    case 'SYNCING':
      return 'brand';
    default:
      return 'neutral';
  }
}

function mediaStatusVariant(status: RequiredMediaRow['downloadStatus']) {
  switch (status) {
    case 'CACHED':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'DOWNLOADING':
      return 'brand';
    default:
      return 'warning';
  }
}

function DeviceDetailPanel({ deviceId }: { deviceId: string }) {
  const { data, isLoading, isError } = useSyncDeviceDetail(deviceId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-content-secondary">
        Loading sync detail…
      </div>
    );
  }

  if (isError || !data?.device) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-content-secondary">
        No sync detail available.
      </div>
    );
  }

  const device = data.device;
  const requiredMedia = data.requiredMedia ?? [];
  const failedDownloads = data.failedDownloads ?? [];

  const mediaColumns: TableColumn<RequiredMediaRow>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => row.title ?? row.mediaVersionId?.slice(0, 8) ?? '—',
    },
    {
      key: 'weekRole',
      header: 'Week',
      render: (row) => row.weekRole ?? 'current',
    },
    {
      key: 'rotationDay',
      header: 'Rotation Day',
      render: (row) => (row.rotationDay != null ? `Day ${row.rotationDay}` : '—'),
    },
    { key: 'fileSize', header: 'Size', render: (row) => formatBytes(row.fileSize) },
    {
      key: 'downloadStatus',
      header: 'Status',
      render: (row) => (
        <Badge variant={mediaStatusVariant(row.downloadStatus)}>{row.downloadStatus ?? 'MISSING'}</Badge>
      ),
    },
    {
      key: 'bytesDownloaded',
      header: 'Downloaded',
      render: (row) => formatBytes(row.bytesDownloaded),
    },
    {
      key: 'errorMessage',
      header: 'Error',
      render: (row) => row.errorMessage ?? '—',
    },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">
            {device.deviceName ?? device.serialNumber ?? device.deviceId}
          </h2>
          <p className="text-sm text-content-secondary">{deploymentLabel(device)}</p>
        </div>
        <Badge variant={statusBadgeVariant(device.status)}>{device.status ?? 'IDLE'}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg bg-surface-muted p-4">
          <p className="text-caption text-content-secondary">Progress</p>
          <p className="text-lg font-semibold">
            {device.cachedCount ?? 0}/{device.expectedCount ?? 0} ({device.progressPercent ?? 0}%)
          </p>
        </div>
        <div className="rounded-lg bg-surface-muted p-4">
          <p className="text-caption text-content-secondary">Rotation</p>
          <p className="text-lg font-semibold">
            {device.rotationDay != null ? `Day ${device.rotationDay}` : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-surface-muted p-4">
          <p className="text-caption text-content-secondary">Window</p>
          <p className="text-lg font-semibold">{windowLabel(device)}</p>
        </div>
        <div className="rounded-lg bg-surface-muted p-4">
          <p className="text-caption text-content-secondary">Prefetch</p>
          <p className="text-lg font-semibold">{prefetchLabel(device)}</p>
        </div>
        <div className="rounded-lg bg-surface-muted p-4">
          <p className="text-caption text-content-secondary">Last sync</p>
          <p className="text-lg font-semibold">{formatLastSync(device.lastSyncAt)}</p>
        </div>
      </div>

      {device.prefetchStatus?.previousWeekHeld && (
        <p className="text-body-sm text-content-secondary">
          Previous week is held on device until the next week finishes downloading.
        </p>
      )}

      {device.activeDownload?.mediaVersionId && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm dark:border-brand-600/30 dark:bg-brand-600/10">
          Downloading{' '}
          <span className="font-mono text-xs">
            {device.activeDownload.mediaVersionId.slice(0, 8)}…
          </span>
          {' · '}
          {formatBytes(device.activeDownload.bytesDownloaded)}
          {device.activeDownload.totalBytes
            ? ` / ${formatBytes(device.activeDownload.totalBytes)}`
            : ''}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-content-primary">
          Required media (SD perform6-cache + weekly prefetch)
        </h3>
        <Table
          columns={mediaColumns}
          data={requiredMedia}
          rowKey={(row) => row.mediaVersionId}
          emptyMessage="No media in cache window."
        />
      </div>

      {failedDownloads.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-content-primary">Recent failures</h3>
          <p className="mb-2 text-caption text-content-secondary">
            Final failures after automatic retries. Run{' '}
            <span className="font-medium">Sync Now</span> to try again. Status refreshes while items
            are Missing or Failed.
          </p>
          <ul className="space-y-2 text-sm text-content-secondary">
            {failedDownloads.slice(0, 5).map((item) => {
              const title =
                requiredMedia.find((row) => row.mediaVersionId === item.mediaVersionId)?.title ??
                null;
              return (
                <li
                  key={`${item.syncJobId}-${item.mediaVersionId}-${item.createdAt}`}
                  className="rounded-lg border border-danger/20 bg-danger/5 p-2"
                >
                  <div className="font-medium text-content-primary">
                    {title ?? 'Unknown title'}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-content-muted">
                    {item.mediaVersionId?.slice(0, 8)}…
                  </div>
                  {item.errorMessage ? (
                    <div className="mt-1 text-caption text-danger">{item.errorMessage}</div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {requiredMedia.some((row) => row.downloadStatus === 'FAILED' || row.downloadStatus === 'MISSING') && (
        <p className="text-caption text-content-muted">
          Missing/Failed rows clear after the device finishes download and reports success (auto-refresh
          every few seconds).
        </p>
      )}
    </div>
  );
}

export default function ContentSyncing() {
  const [filter, setFilter] = useState<(typeof filterOptions)[number]['value']>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch, isFetching } = useSyncFleet();

  const devices = data?.devices ?? [];

  const filteredDevices = useMemo(() => {
    if (filter === 'incomplete') {
      return devices.filter((d) => d.expectedCount > 0 && d.progressPercent < 100);
    }
    if (filter === 'online') return devices.filter((d) => d.isOnline);
    if (filter === 'offline') return devices.filter((d) => !d.isOnline);
    return devices;
  }, [devices, filter]);

  const selectedDevice = useMemo(() => {
    if (selectedDeviceId) {
      return filteredDevices.find((d) => d.deviceId === selectedDeviceId) ?? null;
    }
    return filteredDevices[0] ?? null;
  }, [filteredDevices, selectedDeviceId]);

  const columns: TableColumn<SyncFleetDeviceRow>[] = [
    {
      key: 'serialNumber',
      header: 'Device',
      render: (row) => (
        <button
          type="button"
          className="text-left font-medium text-brand-600 hover:underline dark:text-brand-400"
          onClick={() => setSelectedDeviceId(row.deviceId)}
        >
          {row.serialNumber ?? row.deviceName ?? row.deviceId?.slice(0, 8) ?? '—'}
        </button>
      ),
    },
    { key: 'deployment', header: 'Deployment', render: (row) => deploymentLabel(row) },
    {
      key: 'rotationDay',
      header: 'Rotation Day',
      render: (row) => (row.rotationDay != null ? `Day ${row.rotationDay}` : '—'),
    },
    { key: 'cacheWindow', header: 'Window', render: (row) => windowLabel(row) },
    {
      key: 'prefetch',
      header: 'Prefetch',
      render: (row) => prefetchLabel(row),
    },
    {
      key: 'synced',
      header: 'Synced',
      render: (row) => `${row.cachedCount}/${row.expectedCount}`,
    },
    {
      key: 'progressPercent',
      header: 'Progress',
      render: (row) => `${row.progressPercent}%`,
    },
    {
      key: 'lastSyncAt',
      header: 'Last Sync',
      render: (row) => formatLastSync(row.lastSyncAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.isOnline ? 'success' : 'neutral'}>{row.isOnline ? 'Online' : 'Offline'}</Badge>
          <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <PageTitle>Content Syncing</PageTitle>
          {data?.summary && (
            <p className="mt-1 text-sm text-content-secondary">
              {data.summary.complete} complete · {data.summary.incomplete} incomplete ·{' '}
              {data.summary.downloading} downloading
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Dropdown
            options={[...filterOptions]}
            value={filter}
            onChange={(value) => setFilter(value as (typeof filterOptions)[number]['value'])}
            className="w-full sm:w-auto"
          />
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-surface-border px-4 py-2 text-sm text-content-secondary hover:bg-surface-muted"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredDevices}
        emptyMessage={isLoading ? 'Loading fleet sync status…' : isError ? 'Failed to load sync fleet.' : 'No devices found.'}
        onRowClick={(row) => setSelectedDeviceId(row.deviceId)}
        selectedRowKey={selectedDevice?.deviceId}
        rowKey={(row) => row.deviceId}
      />

      {selectedDevice && <DeviceDetailPanel deviceId={selectedDevice.deviceId} />}
    </div>
  );
}
