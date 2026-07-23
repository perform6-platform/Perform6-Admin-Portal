import type { ContentItem } from '../../constants/contentLibrary';
import { formatProgramTypeLabel, formatVideosDuration } from '../../lib/deploymentHelpers';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS, SectionLabel } from '../ui';
import { VideoThumbnailWithBranding } from './VideoThumbnailWithBranding';

export interface DeploymentContentSummaryProps {
  programTypeLabel: string;
  contentLabel: string;
  videos: ContentItem[];
  brandingLogoUrl?: string | null;
  companyName?: string;
  className?: string;
}

export function DeploymentContentSummary({
  programTypeLabel,
  contentLabel,
  videos,
  brandingLogoUrl,
  companyName,
  className,
}: DeploymentContentSummaryProps) {
  const videoLabel = videos.length === 1 ? '1 Video' : `${videos.length} Videos`;
  const thumbnailUrl = videos[0]?.thumbnailUrl;

  return (
    <aside className={cn(CARD_SURFACE_CLASS, 'flex h-full flex-col p-4 sm:p-5', className)}>
      <SectionLabel className="mb-4 block">Content Summary</SectionLabel>

      <dl className="space-y-0 divide-y divide-surface-border">
        <SummaryRow label="Program Type" value={formatProgramTypeLabel(programTypeLabel)} />
        <SummaryRow label="Content" value={contentLabel} />
        <SummaryRow label="Videos" value={videoLabel} />
        <SummaryRow label="Duration" value={formatVideosDuration(videos)} />
      </dl>

      {thumbnailUrl && (
        <VideoThumbnailWithBranding
          thumbnailUrl={thumbnailUrl}
          brandingLogoUrl={brandingLogoUrl}
          companyName={companyName}
          className="mt-4 overflow-hidden rounded-lg border border-surface-border"
          imageClassName="aspect-video w-full"
          logoClassName="h-5 w-5 sm:h-6 sm:w-6"
          nameClassName="text-[10px] sm:text-xs"
          overlayClassName="left-2 top-2 gap-1.5 px-1.5 py-1"
        />
      )}
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 first:pt-0">
      <dt className="text-caption text-content-secondary">{label}</dt>
      <dd className="text-right text-body-sm font-medium text-content-primary">{value}</dd>
    </div>
  );
}
