import { useState, type ReactNode } from 'react';
import { Download, FolderDown, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useDownloadStartupFile, useStartupFiles } from '../hooks/useStartupFiles';
import { getApiErrorMessage } from '../services/axios';
import type { StartupFileInfo, StartupProfileId } from '../types/startupFiles';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Modal,
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
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}, ${time}`;
}

function PackageDetails({
  heading,
  file,
  downloading,
  onDownload,
  error,
}: {
  heading?: string;
  file: StartupFileInfo | undefined;
  downloading: boolean;
  onDownload: (profile: StartupProfileId) => void;
  error: string | null;
}) {
  const available = Boolean(file?.available);
  return (
    <div className="flex flex-col gap-4">
      {heading ? <p className="text-body-sm font-medium text-content-primary">{heading}</p> : null}
      <dl className="grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-3">
        <div>
          <dt className="text-content-muted">Package</dt>
          <dd className="mt-1 break-all text-content-primary">{file?.fileName ?? 'Not built yet'}</dd>
        </div>
        <div>
          <dt className="text-content-muted">Size</dt>
          <dd className="mt-1 text-content-primary">{formatBytes(file?.sizeBytes ?? null)}</dd>
        </div>
        <div>
          <dt className="text-content-muted">Updated</dt>
          <dd className="mt-1 text-content-primary">{formatDate(file?.updatedAt ?? null)}</dd>
        </div>
      </dl>
      {error ? <p className="text-body-sm text-status-danger">{error}</p> : null}
      <Button
        type="button"
        fullWidth
        disabled={!file || !available || downloading}
        onClick={() => file && onDownload(file.profile)}
      >
        <Download className="h-4 w-4" />
        {downloading ? 'Saving…' : 'Download Startup Files'}
      </Button>
    </div>
  );
}

function StartupPackageCard({
  title,
  subtitle,
  description,
  ready,
  children,
}: {
  title: string;
  subtitle: string;
  description: ReactNode;
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col self-start">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
            <Package className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold text-content-primary">{title}</h2>
        </div>
        <Badge variant={ready ? 'success' : 'neutral'}>{ready ? 'Ready' : 'Missing'}</Badge>
      </div>
      <p className="mt-4 text-body-sm font-medium text-content-primary">{subtitle}</p>
      <div className="mt-1 space-y-0.5 text-body-sm text-content-muted">{description}</div>
      <CardContent className="mt-5 flex flex-1 flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

function editionLabel(profile: StartupProfileId): string {
  if (profile === 'xt2145-fitness') return 'XT2145 Fitness';
  if (profile === 'xt2145-golf') return 'XT2145 Golf';
  if (profile === 'hd226') return 'HD226';
  return 'Startup package';
}

export default function StartupFiles() {
  const { showToast } = useToast();
  const { data, isLoading, isError, error } = useStartupFiles();
  const downloadMutation = useDownloadStartupFile();
  const [activeProfile, setActiveProfile] = useState<StartupProfileId | null>(null);
  const [pendingProfile, setPendingProfile] = useState<StartupProfileId | null>(null);
  const [downloadErrors, setDownloadErrors] = useState<Partial<Record<StartupProfileId, string>>>(
    {},
  );

  const startDownload = (profile: StartupProfileId) => {
    setPendingProfile(null);
    setActiveProfile(profile);
    setDownloadErrors((prev) => {
      const next = { ...prev };
      delete next[profile];
      return next;
    });
    downloadMutation.mutate(profile, {
      onSuccess: (result) => {
        setActiveProfile(null);
        showToast({
          title: 'Startup package downloaded',
          message: result.packageName,
          variant: 'success',
        });
      },
      onError: (err) => {
        setDownloadErrors((prev) => ({
          ...prev,
          [profile]: getApiErrorMessage(err, 'Download failed'),
        }));
        setActiveProfile(null);
      },
    });
  };

  const handleDownload = (profile: StartupProfileId) => {
    setPendingProfile(profile);
  };

  if (isLoading && !data) {
    return (
      <PageShell title="Startup Files">
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((key) => (
            <Card key={key}>
              <CardContent className="space-y-4 p-6">
                <div className="h-6 w-24 animate-pulse rounded bg-surface-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-surface-muted" />
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

  const files = (data ?? []).filter(
    (file) => file.profile === 'xt2145-fitness' || file.profile === 'xt2145-golf' || file.profile === 'hd226',
  );
  const fitness = files.find((file) => file.profile === 'xt2145-fitness');
  const golf = files.find((file) => file.profile === 'xt2145-golf');
  const hd = files.find((file) => file.profile === 'hd226');
  const anyAvailable = files.some((file) => file.available);

  return (
    <PageShell title="Startup Files">
      <p className="max-w-4xl text-body-sm text-content-muted">
        Download the BrightSign startup files required to initialize each player. Select the
        appropriate player model, download its startup package, and copy the package contents to
        the root of the player&apos;s microSD card.
      </p>

      {!anyAvailable ? (
        <EmptyState message="No packages on R2 yet. Build a release ZIP and deploy it, then refresh." />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <StartupPackageCard
          title="XT2145"
          subtitle="Touchscreen Deployments"
          ready={Boolean(fitness?.available || golf?.available)}
          description={
            <>
              <p>HDMI-1: Bluefin Touchscreen</p>
              <p>HDMI-2: Main Display</p>
              <p>One standardized startup package for all XT2145 players.</p>
            </>
          }
        >
          <PackageDetails
            heading="Fitness"
            file={fitness}
            downloading={activeProfile === 'xt2145-fitness' && downloadMutation.isPending}
            onDownload={handleDownload}
            error={downloadErrors['xt2145-fitness'] ?? null}
          />
          <PackageDetails
            heading="Golf"
            file={golf}
            downloading={activeProfile === 'xt2145-golf' && downloadMutation.isPending}
            onDownload={handleDownload}
            error={downloadErrors['xt2145-golf'] ?? null}
          />
        </StartupPackageCard>

        <StartupPackageCard
          title="HD226"
          subtitle="3-Screen and Custom Deployments"
          ready={Boolean(hd?.available)}
          description={
            <>
              <p>One HD226 player per display.</p>
              <p>One standardized startup package for all HD226 players.</p>
            </>
          }
        >
          <PackageDetails
            file={hd}
            downloading={activeProfile === 'hd226' && downloadMutation.isPending}
            onDownload={handleDownload}
            error={downloadErrors.hd226 ?? null}
          />
        </StartupPackageCard>
      </div>

      <Modal
        open={pendingProfile != null}
        onClose={() => setPendingProfile(null)}
        title="Allow this download?"
        description="Perform6 will save this startup package to your computer. Unzip it and copy the contents to the root of the player's microSD card."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-4"
              onClick={() => setPendingProfile(null)}
            >
              Don't Allow
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 px-4"
              disabled={pendingProfile == null}
              onClick={() => pendingProfile && startDownload(pendingProfile)}
            >
              Allow
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-muted/60 px-3 py-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
            <FolderDown className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-body-sm font-medium text-content-primary">
              {pendingProfile ? editionLabel(pendingProfile) : 'Startup package'}
            </p>
            <p className="truncate text-caption text-content-muted">
              {(pendingProfile === 'xt2145-fitness'
                ? fitness
                : pendingProfile === 'xt2145-golf'
                  ? golf
                  : hd
              )?.fileName ?? 'Startup package'}
            </p>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
