import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Dropdown, PageTitle } from '../components/ui';
import { useDeviceLogs } from '../hooks/useDeviceLogs';
import { useDevices } from '../hooks/useDevices';
import type { DeviceLogLevel, DeviceLogRow, DeviceLogSource } from '../services/deviceLogs.api';

const levelOptions = [
  { value: '', label: 'All levels' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARN', label: 'Warn' },
  { value: 'ERROR', label: 'Error' },
];

const sourceOptions = [
  { value: '', label: 'All sources' },
  { value: 'JS', label: 'JavaScript' },
  { value: 'AUTORUN', label: 'Autorun (perform6-led.log)' },
];

function levelClass(level: DeviceLogLevel): string {
  if (level === 'ERROR') return 'text-red-600';
  if (level === 'WARN') return 'text-amber-600';
  return 'text-slate-600';
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCurrentLogsCsv(rows: DeviceLogRow[]): void {
  const headers = ['Time', 'Device', 'Serial', 'Level', 'Source', 'Message'];
  const lines = rows.map((row) =>
    [
      new Date(row.createdAt).toISOString(),
      row.deviceName || row.deviceId || row.pairingId || '',
      row.serialNumber || '',
      row.level,
      row.source,
      row.message,
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(','),
  );
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.href = url;
  link.download = `perform6-device-logs-${stamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DeviceLogs() {
  const [deviceId, setDeviceId] = useState('');
  const [level, setLevel] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');

  const { data: devicesData } = useDevices({ state: 'registered', page: 1, limit: 100 });
  const deviceOptions = useMemo(() => {
    const items = devicesData?.items ?? [];
    return [
      { value: '', label: 'All devices' },
      ...items
        .filter((device) => device.deviceId)
        .map((device) => ({
          value: device.deviceId!,
          label: device.deviceName || device.serialNumber || device.deviceId!,
        })),
    ];
  }, [devicesData]);

  const query = {
    deviceId: deviceId || undefined,
    level: (level || undefined) as DeviceLogLevel | undefined,
    source: (source || undefined) as DeviceLogSource | undefined,
    search: search.trim() || undefined,
    page: 1,
    limit: 200,
  };

  const { data, isLoading, isFetching } = useDeviceLogs(query);
  const rows = data?.items ?? [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <PageTitle>Device Logs</PageTitle>
          <p className="text-sm text-slate-500">
            Remote player logs (`[Perform6]` JS console + `perform6-led.log` autorun tail). OTA lines
            include file path and byte progress — search{' '}
            <code className="rounded bg-slate-100 px-1">OTA</code>. Refreshes every 3s.
            {isFetching && !isLoading ? ' Updating…' : ''}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 self-start"
          disabled={rows.length === 0 || isLoading}
          onClick={() => downloadCurrentLogsCsv(rows)}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Dropdown options={deviceOptions} value={deviceId} onChange={setDeviceId} />
          <Dropdown options={levelOptions} value={level} onChange={setLevel} />
          <Dropdown options={sourceOptions} value={source} onChange={setSource} />
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search e.g. OTA, manifest, prefetch"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-72"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading logs…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No logs yet. Pairing-stage logs appear once the player is ONLINE; registered
                    devices also upload on heartbeat/sync.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-slate-800">
                        {row.deviceName ||
                          row.serialNumber ||
                          row.deviceId ||
                          (row.pairingId ? `Pairing ${row.pairingId.slice(0, 8)}…` : '—')}
                      </div>
                      {row.serialNumber && row.deviceName ? (
                        <div className="text-slate-500">{row.serialNumber}</div>
                      ) : null}
                      {!row.deviceId && row.pairingId ? (
                        <div className="text-slate-400">pre-register</div>
                      ) : null}
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium ${levelClass(row.level)}`}>
                      {row.level}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.source}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-800">{row.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
