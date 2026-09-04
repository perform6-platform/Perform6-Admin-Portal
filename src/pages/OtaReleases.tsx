import { useMemo, useState } from 'react';
import { CloudUpload, Radio, Rocket } from 'lucide-react';
import { useDeployRelease, useOtaFleet, usePublishRelease, useReleases } from '../hooks/useReleases';
import { useRetryDeviceOta } from '../hooks/useDevices';
import { useStartupFiles } from '../hooks/useStartupFiles';
import { getApiErrorMessage } from '../services/axios';
import type { AppRelease, OtaFleetDeviceRow } from '../types/releases';
import type { StartupProfileId } from '../types/startupFiles';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dropdown,
  EmptyState,
  Input,
  PageShell,
  Switch,
} from '../components/ui';
import { useToast } from '../context/ToastContext';

const profileOptions = [
  { value: 'xt2145', label: 'XT2145 (touch + LED)' },
  { value: 'xc4055', label: 'XC4055 (triple HDMI)' },
  { value: 'hd226', label: 'HD226 (cluster)' },
];

function formatBytes(raw: string | number | null): string {
  if (raw == null) return '—';
  const bytes = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatOtaDetail(row: OtaFleetDeviceRow): string {
  const parts: string[] = [];
  if (row.otaCurrentPath) parts.push(row.otaCurrentPath);
  if (row.otaBytesDownloaded != null && row.otaBytesTotal != null && row.otaBytesTotal > 0) {
    parts.push(`${formatBytes(row.otaBytesDownloaded)} / ${formatBytes(row.otaBytesTotal)}`);
  }
  if (row.otaError) parts.push(row.otaError);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function otaStatusLabel(row: OtaFleetDeviceRow): string {
  switch (row.otaStatus) {
    case 'UP_TO_DATE':
      return 'Up to date';
    case 'UPDATE_PENDING':
      return 'Update pending';
    case 'DOWNLOADING':
      return row.otaTotalCount
        ? `Updating ${row.otaDoneCount ?? 0}/${row.otaTotalCount}`
        : 'Updating';
    case 'REBOOTING':
      return 'Rebooting';
    case 'FAILED':
      return 'Update failed';
    case 'NO_RELEASE':
      return 'No live release';
    default:
      return row.otaStatus ?? '—';
  }
}

function otaStatusVariant(
  status: string | null,
): 'success' | 'danger' | 'warning' | 'neutral' | 'brand' {
  switch (status) {
    case 'UP_TO_DATE':
      return 'success';
    case 'DOWNLOADING':
    case 'REBOOTING':
      return 'brand';
    case 'FAILED':
      return 'danger';
    case 'UPDATE_PENDING':
      return 'warning';
    default:
      return 'neutral';
  }
}

function ReleaseRow({
  release,
  publishing,
  onPublish,
}: {
  release: AppRelease;
  publishing: boolean;
  onPublish: (id: string) => void;
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 font-medium text-content-primary">{release.version}</td>
      <td className="px-4 py-3 text-content-muted">{release.model ?? 'All'}</td>
      <td className="px-4 py-3">
        {release.isActive ? (
          <Badge variant="success">Live (OTA)</Badge>
        ) : (
          <Badge variant="neutral">Draft</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-content-muted">{formatBytes(release.fileSize)}</td>
      <td className="px-4 py-3 text-content-muted">{formatDate(release.createdAt)}</td>
      <td className="max-w-xs px-4 py-3 text-body-sm text-content-muted">
        {release.releaseNotes?.trim() || '—'}
      </td>
      <td className="px-4 py-3 text-right">
        {!release.isActive ? (
          <Button
            type="button"
            size="sm"
            disabled={publishing}
            onClick={() => onPublish(release.id)}
          >
            <Radio className="h-4 w-4" />
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        ) : (
          <span className="text-body-sm text-content-muted">Live — install from fleet below</span>
        )}
      </td>
    </tr>
  );
}

export default function OtaReleases() {
  const { showToast } = useToast();
  const { data: releases, isLoading, isError, error } = useReleases();
  const { data: otaFleet } = useOtaFleet();
  const { data: startupFiles, refetch: refetchStartupFiles } = useStartupFiles();
  const deployMutation = useDeployRelease();
  const publishMutation = usePublishRelease();
  const retryOtaMutation = useRetryDeviceOta();

  const [version, setVersion] = useState('');
  const [profile, setProfile] = useState<StartupProfileId>('xt2145');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const activeRelease = useMemo(
    () => (releases ?? []).find((release) => release.isActive) ?? null,
    [releases],
  );

  const startupByProfile = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of startupFiles ?? []) {
      if (entry.available && entry.fileName) {
        map.set(entry.profile, entry.fileName);
      }
    }
    return map;
  }, [startupFiles]);

  const handleDeploy = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!version.trim()) {
      showToast({ title: 'Version is required (e.g. 1.0.53)', variant: 'error' });
      return;
    }
    if (!file) {
      showToast({
        title: 'Select the release ZIP (npm run release:zip:xt2145)',
        variant: 'error',
      });
      return;
    }

    try {
      const result = await deployMutation.mutateAsync({
        version: version.trim(),
        profile,
        releaseNotes: releaseNotes.trim() || undefined,
        publish: publishNow,
        file,
      });
      await refetchStartupFiles();
      showToast({
        title: publishNow
          ? `v${result.release.version} is live — ${result.startup.filesUploaded} files on ${result.startup.source}`
          : `v${result.release.version} uploaded — publish when ready`,
        variant: 'success',
      });
      setVersion('');
      setReleaseNotes('');
      setFile(null);
    } catch (err) {
      showToast({
        title: getApiErrorMessage(err, 'OTA deploy failed'),
        variant: 'error',
      });
    }
  };

  const handlePublish = async (releaseId: string) => {
    setPublishingId(releaseId);
    try {
      const published = await publishMutation.mutateAsync(releaseId);
      showToast({
        title: `Version ${published.version} is now live for OTA`,
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: getApiErrorMessage(err, 'Failed to publish release'),
        variant: 'error',
      });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <PageShell title="OTA Releases">
      <p className="text-body-sm text-content-muted">
        One-step deploy: upload the BrightSign release ZIP — files go to server/R2, version is
        registered, and devices update on their next sync.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-brand-600" />
              Live OTA version
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeRelease ? (
              <>
                <p className="text-2xl font-semibold text-content-primary">
                  v{activeRelease.version}
                </p>
                <p className="text-body-sm text-content-muted">
                  Model: {activeRelease.model ?? 'All profiles'} · Published{' '}
                  {formatDate(activeRelease.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-body-sm text-content-muted">No live release yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4 text-brand-600" />
              Packages on server
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profileOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center justify-between text-body-sm"
              >
                <span className="font-medium text-content-primary">{option.label}</span>
                <span className="text-content-muted">
                  {startupByProfile.get(option.value as StartupProfileId) ?? '—'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device update status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {otaFleet ? (
            <>
              <div className="flex flex-wrap gap-3 text-body-sm text-content-muted">
                <span>
                  Live: <strong className="text-content-primary">v{otaFleet.liveVersion ?? '—'}</strong>
                </span>
                <span>{otaFleet.summary.upToDate} up to date</span>
                <span>{otaFleet.summary.updatePending} pending</span>
                <span>{otaFleet.summary.updating} updating now</span>
                {otaFleet.summary.failed > 0 ? (
                  <span className="text-status-danger">{otaFleet.summary.failed} failed</span>
                ) : null}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-body-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-content-muted">
                    <tr>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">Online</th>
                      <th className="px-4 py-3">Current</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">OTA status</th>
                      <th className="px-4 py-3">Detail</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otaFleet.devices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-content-muted">
                          No active devices registered yet.
                        </td>
                      </tr>
                    ) : (
                      otaFleet.devices.map((row) => (
                        <tr key={row.deviceId} className="border-t border-slate-100">
                          <td className="px-4 py-3">
                            <div className="font-medium text-content-primary">
                              {row.deviceName || row.serialNumber || row.deviceId}
                            </div>
                            {row.model ? (
                              <div className="text-xs text-content-muted">{row.model}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={row.isOnline ? 'success' : 'neutral'}>
                              {row.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {row.runtimeVersion ? `v${row.runtimeVersion}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {row.targetVersion ? `v${row.targetVersion}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={otaStatusVariant(row.otaStatus)}>
                              {otaStatusLabel(row)}
                            </Badge>
                          </td>
                          <td className="max-w-xs px-4 py-3 text-xs text-content-muted">
                            {formatOtaDetail(row)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(row.otaStatus === 'FAILED' ||
                              row.otaStatus === 'UPDATE_PENDING' ||
                              row.otaStatus === 'DOWNLOADING' ||
                              row.updateAvailable) && (
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  row.otaStatus === 'FAILED' ||
                                  row.otaStatus === 'UPDATE_PENDING'
                                    ? 'primary'
                                    : 'outline'
                                }
                                disabled={!row.isOnline || retryOtaMutation.isPending}
                                title={
                                  row.isOnline
                                    ? 'Install published OTA on this player (media not mixed)'
                                    : 'Device must be online'
                                }
                                onClick={() => {
                                  retryOtaMutation.mutate(
                                    { deviceId: row.deviceId, reboot: false },
                                    {
                                      onSuccess: () =>
                                        showToast({
                                          title: 'Install OTA queued',
                                          description:
                                            'Package install starts on next heartbeat (~60s). Media sync is not mixed in.',
                                          variant: 'success',
                                        }),
                                      onError: (err) =>
                                        showToast({
                                          title: 'Install OTA failed',
                                          description: getApiErrorMessage(
                                            err,
                                            'Could not queue OTA install',
                                          ),
                                          variant: 'error',
                                        }),
                                    },
                                  );
                                }}
                              >
                                <Rocket className="h-4 w-4" />
                                {row.otaStatus === 'FAILED' ? 'Retry install' : 'Install OTA'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-body-sm text-content-muted">Loading device OTA status…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deploy OTA update</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="mb-4 list-decimal space-y-1 pl-5 text-body-sm text-content-muted">
            <li>
              Build ZIP:{' '}
              <code className="rounded bg-surface-muted px-1">npm run release:zip:xt2145</code>{' '}
              (in Perform6-Device-Runtime)
            </li>
            <li>Upload the ZIP below — same version as in the filename (e.g. 1.0.53)</li>
            <li>
              On each device below, click <strong>Install OTA</strong> when you are ready (not
              automatic — keeps media downloads separate)
            </li>
          </ol>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void handleDeploy(event)}>
            <Input
              label="Version"
              placeholder="1.0.53"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              required
            />
            <div className="space-y-1">
              <label className="text-body-sm font-medium text-content-primary">Hardware</label>
              <Dropdown
                options={profileOptions}
                value={profile}
                onChange={(value) => setProfile(value as StartupProfileId)}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-body-sm font-medium text-content-primary">Release notes</label>
              <textarea
                value={releaseNotes}
                onChange={(event) => setReleaseNotes(event.target.value)}
                rows={2}
                placeholder="Optional — what changed in this build"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-body-sm font-medium text-content-primary">
                Release ZIP (required)
              </label>
              <input
                type="file"
                accept=".zip,application/zip"
                required
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-body-sm text-content-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-700"
              />
              <p className="text-body-sm text-content-muted">
                Use{' '}
                <code className="rounded bg-surface-muted px-1">
                  perform6-{profile}-{version || 'x.x.x'}.zip
                </code>{' '}
                from the build output folder.
              </p>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={publishNow} onChange={setPublishNow} />
              <span className="text-body-sm text-content-primary">
                Publish immediately (devices get this version on sync)
              </span>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={deployMutation.isPending}>
                {deployMutation.isPending ? 'Deploying…' : 'Deploy OTA update'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Release history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-body-sm text-content-muted">Loading releases…</p>
          ) : isError ? (
            <p className="p-6 text-body-sm text-status-danger">
              {getApiErrorMessage(error, 'Failed to load releases')}
            </p>
          ) : !releases?.length ? (
            <EmptyState message="No releases yet. Deploy your first update above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-body-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-content-muted">
                  <tr>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">ZIP size</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((release) => (
                    <ReleaseRow
                      key={release.id}
                      release={release}
                      publishing={publishingId === release.id && publishMutation.isPending}
                      onPublish={(id) => void handlePublish(id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
