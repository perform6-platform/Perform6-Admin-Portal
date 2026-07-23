import { ImagePlus, X } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import { cn } from '../../lib/cn';
import { Button, SectionLabel } from '../ui';

const acceptedLogoTypes =
  'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg';

export interface BrandingLogoUploadProps {
  previewUrl: string | null;
  companyName?: string;
  onChange: (file: File | null, previewUrl: string | null) => void;
  className?: string;
}

export function BrandingLogoUpload({
  previewUrl,
  companyName,
  onChange,
  className,
}: BrandingLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    onChange(file, url);
  }

  function clear() {
    onChange(null, null);
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <SectionLabel className="mb-1 block">Company logo</SectionLabel>
        <p className="text-body-sm text-content-secondary">
          Upload a logo for custom branding. Required when branding mode is Custom.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedLogoTypes}
        className="sr-only"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="flex items-center gap-4 rounded-lg border border-surface-border bg-surface-muted/30 p-3">
          <div className="relative h-16 w-28 overflow-hidden rounded-md border border-surface-border bg-surface">
            <img src={previewUrl} alt="" className="h-full w-full object-contain" />
            {companyName?.trim() && (
              <div className="absolute left-1.5 top-1.5 max-w-[calc(100%-0.75rem)] truncate rounded bg-white/95 px-1 py-0.5 text-[8px] font-semibold text-p6-gray-950 shadow-sm">
                {companyName.trim()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-content-primary">Logo ready</p>
            <p className="text-caption text-content-secondary">Will be uploaded on deploy.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5 px-3"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
          <button
            type="button"
            aria-label="Remove branding logo"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-muted hover:text-content-primary"
            onClick={clear}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border',
            'bg-surface-muted/20 px-4 py-8 text-center transition-colors hover:border-brand-500/30 hover:bg-brand-50/30 dark:hover:bg-brand-600/10',
          )}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-600 dark:text-brand-400">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="text-body-sm font-medium text-content-primary">Upload company logo</span>
          <span className="text-caption text-content-muted">PNG, JPG, WebP or SVG</span>
        </button>
      )}
    </div>
  );
}
