import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface VideoThumbnailWithBrandingProps {
  thumbnailUrl?: string;
  brandingLogoUrl?: string | null;
  companyName?: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  logoClassName?: string;
  nameClassName?: string;
  overlayClassName?: string;
  placeholder?: ReactNode;
}

export function VideoThumbnailWithBranding({
  thumbnailUrl,
  brandingLogoUrl,
  companyName,
  className,
  imageClassName,
  placeholderClassName,
  logoClassName,
  nameClassName,
  overlayClassName,
  placeholder,
}: VideoThumbnailWithBrandingProps) {
  const showBranding = Boolean(brandingLogoUrl || companyName?.trim());

  return (
    <div className={cn('relative shrink-0 overflow-hidden', className)}>
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className={cn('h-full w-full object-cover', imageClassName)} />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center border border-dashed border-surface-border bg-surface-muted text-caption text-content-muted',
            placeholderClassName,
          )}
        >
          {placeholder ?? 'No preview'}
        </div>
      )}
      {showBranding && (
        <div
          className={cn(
            'absolute left-1 top-1 flex max-w-[calc(100%-0.5rem)] items-center gap-1 rounded bg-white/95 px-2 py-0.5 shadow-sm',
            overlayClassName,
          )}
        >
          {brandingLogoUrl && (
            <img
              src={brandingLogoUrl}
              alt=""
              className={cn('h-4 w-4 shrink-0 rounded object-contain', logoClassName)}
            />
          )}
          {companyName?.trim() && (
            <span
              className={cn(
                'truncate text-[9px] font-medium leading-none text-p6-gray-950 sm:text-[10px]',
                nameClassName,
              )}
            >
              {companyName.trim()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
