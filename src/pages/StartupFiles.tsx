import { useState } from 'react';
import { Download, Package } from 'lucide-react';
import { useDownloadStartupFile, useStartupFiles } from '../hooks/useStartupFiles';
import { getApiErrorMessage } from '../services/axios';
import type { StartupFileInfo, StartupProfileId } from '../types/startupFiles';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageShell,
} from '../components/ui';

function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StartupFileCard({
  file,
  downloading,
  onDownload,
  error,
}: {
  file: StartupFileInfo;
  downloading: boolean;
  onDownload: (profile: StartupProfileId) => void;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
            {file.label}
          </CardTitle>
          <p className="mt-1 text-body-sm text-content-muted">{file.description}</p>
        </div>
        <Badge variant={file.available ? 'success' : 'neutral'}>
          {file.available ? 'Ready' : 'Missing'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 gap-2 text-body-sm sm:grid-cols-2">
          <div>
            <dt className="text-content-muted">Package</dt>
            <dd className="mt-0.5 break-all font-medium text-content-primary">
              {file.fileName ?? 'Not built yet'}
            </dd>
          </div>
          <div>
            <dt className="text-content-muted">Type</dt>
            <dd className="mt-0.5 font-medium text-content-primary">
              {file.packageKind === 'folder'
                ? 'Folder'
                : file.packageKind === 'zip'
                  ? 'ZIP'
                  : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-content-muted">Size</dt>
            <dd className="mt-0.5 font-medium text-content-primary">
              {formatBytes(file.sizeBytes)}
            </dd>
          </div>
          <div>
            <dt className="text-content-muted">Source</dt>
            <dd className="mt-0.5 font-medium text-content-primary">
              {file.source === 'r2' ? 'Cloudflare R2' : 'Local disk'}
            </dd>
          </div>
          <div>
            <dt className="text-content-muted">Updated</dt>
            <dd className="mt-0.5 font-medium text-content-primary">
              {formatDate(file.updatedAt)}
            </dd>
          </div>
        </dl>

        {error ? <p className="text-body-sm text-status-danger">{error}</p> : null}

        <Button
          type="button"
          disabled={!file.available || downloading}
          onClick={() => onDownload(file.profile)}
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Saving folder…' : 'Download folder'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StartupFiles() {
  const { data, isLoading, isError, error } = useStartupFiles();
  const downloadMutation = useDownloadStartupFile();
  const [activeProfile, setActiveProfile] = useState<StartupProfileId | null>(null);
  const [downloadErrors, setDownloadErrors] = useState<Partial<Record<StartupProfileId, string>>>(
    {},
  );

  const handleDownload = (profile: StartupProfileId) => {
    setActiveProfile(profile);
    setDownloadErrors((prev) => {
      const next = { ...prev };
      delete next[profile];
      return next;
    });
    downloadMutation.mutate(profile, {
      onSuccess: () => {
        setActiveProfile(null);
      },
      onError: (err) => {
        const aborted =
          err instanceof DOMException &&
          (err.name === 'AbortError' || err.name === 'NotAllowedError');
        if (aborted) {
          setActiveProfile(null);
          return;
        }
        setDownloadErrors((prev) => ({
          ...prev,
          [profile]: getApiErrorMessage(err, 'Download failed'),
        }));
        setActiveProfile(null);
      },
    });
  };

  if (isLoading && !data) {
    return (
      <PageShell title="Startup Files">
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Card key={key}>
              <CardContent className="space-y-3 p-6">
                <div className="h-6 w-24 animate-pulse rounded bg-surface-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
                <div className="h-10 w-32 animate-pulse rounded bg-surface-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell title="Startup Files">
        <Card>
          <CardContent className="p-6">
            <p className="text-body-sm text-status-danger">
              {getApiErrorMessage(error, 'Failed to load startup files')}
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const files = data ?? [];
  const anyAvailable = files.some((f) => f.available);

  return (
    <PageShell title="Startup Files">
      <p className="text-body-sm text-content-muted">
        Download BrightSign startup folders (XT2145, XC4055, HD226). Packages are served from
        Cloudflare R2 when the API uses <span className="font-mono">STORAGE_DRIVER=r2</span>. Pick
        a parent folder once — a ready package like{' '}
        <span className="font-mono text-content-primary">perform6-xt2145-0.1.0</span> is saved.
        Copy that folder&apos;s contents to the SD card root.
      </p>

      {!anyAvailable ? (
        <EmptyState message="No packages on R2/local. From device/perform6-touchscreen run npm run release:zip:all (builds + uploads to R2), then refresh." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {files.map((file) => (
          <StartupFileCard
            key={file.profile}
            file={file}
            downloading={activeProfile === file.profile && downloadMutation.isPending}
            onDownload={handleDownload}
            error={downloadErrors[file.profile] ?? null}
          />
        ))}
      </div>
    </PageShell>
  );
}
