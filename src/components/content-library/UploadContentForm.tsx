import { format } from 'date-fns';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { ContentCategoryId, ContentItem } from '../../constants/contentLibrary';
import { defaultContentThumbnail } from '../../constants/contentLibrary';
import { getFullCategoryLabel, getUploadCategoryInfo, ROTATION_DAYS } from '../../constants/contentPlayback';
import { cn } from '../../lib/cn';
import { Button, Input } from '../ui';
import { CARD_SURFACE_CLASS } from '../ui/cardStyles';

const defaultThumbnail = defaultContentThumbnail;
const acceptedVideoTypes = 'video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm';
const acceptedThumbnailTypes = 'image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp';
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
/** Must match backend MEDIA_UPLOAD_MAX_BYTES (1.5 GB). */
const MAX_VIDEO_BYTES = Math.floor(1.5 * 1024 * 1024 * 1024);

export interface UploadContentPayload {
  title: string;
  categoryId: ContentCategoryId;
  rotationDay?: number;
  file: File;
  /** Optional custom thumbnail — if omitted, backend auto-generates from video. */
  thumbnail?: File;
}

export interface UploadContentFormProps {
  categoryId: ContentCategoryId;
  onCancel: () => void;
  onSubmit?: (payload: UploadContentPayload) => void | Promise<void>;
  embedded?: boolean;
  formId?: string;
  onReadyChange?: (ready: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

function formatVideoDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? 'MP4';
}

function inferRotationDayFromTitle(title: string): number {
  const dayPaddedMatch = title.match(/(?:^|_)(\d{2})(?:_|\.)/);
  if (dayPaddedMatch) {
    const day = Number.parseInt(dayPaddedMatch[1]!, 10);
    if (day >= 1 && day <= ROTATION_DAYS) return day;
  }

  const dayMatch = title.toUpperCase().match(/DAY\s*(\d+)/);
  if (dayMatch) {
    const day = Number.parseInt(dayMatch[1]!, 10);
    if (day >= 1 && day <= ROTATION_DAYS) return day;
  }

  return 1;
}

async function readVideoMetadata(file: File): Promise<{ duration?: string; thumbnailUrl: string }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const duration = formatVideoDuration(video.duration);
        video.currentTime = Math.min(0.5, video.duration > 0 ? video.duration / 3 : 0);
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 480;
            canvas.height = video.videoHeight || 270;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve({ duration, thumbnailUrl: canvas.toDataURL('image/jpeg', 0.82) });
          } catch {
            resolve({ duration, thumbnailUrl: defaultThumbnail });
          }
        };
      };

      video.onerror = () => resolve({ thumbnailUrl: defaultThumbnail });
      video.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function buildContentItemFromUpload(
  payload: UploadContentPayload,
  id: string,
): Promise<ContentItem> {
  const metadata = await readVideoMetadata(payload.file);
  const thumbnailUrl = payload.thumbnail
    ? URL.createObjectURL(payload.thumbnail)
    : metadata.thumbnailUrl;

  return {
    id,
    title: payload.title.trim() || payload.file.name,
    mediaType: 'video',
    categoryId: payload.categoryId,
    rotationDay: payload.rotationDay,
    duration: metadata.duration,
    dateLabel: format(new Date(), 'd MMM yyyy'),
    format: getFileExtension(payload.file.name),
    thumbnailUrl,
    videoUrl: URL.createObjectURL(payload.file),
  };
}

export function UploadContentForm({
  categoryId,
  onCancel,
  onSubmit,
  embedded = false,
  formId = 'upload-content-form',
  onReadyChange,
  onSubmittingChange,
}: UploadContentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryInfo = getUploadCategoryInfo(categoryId, 1);
  const categoryLabel = getFullCategoryLabel(categoryId);

  useEffect(() => {
    setTitle('');
    setFile(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setThumbnailError(null);
    setFileError(null);
    setIsSubmitting(false);
    onReadyChange?.(false);
    onSubmittingChange?.(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  }, [categoryId, onReadyChange, onSubmittingChange]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFileError(null);

    if (selected && selected.size > MAX_VIDEO_BYTES) {
      setFile(null);
      onReadyChange?.(false);
      setFileError('Video must be 1.5 GB or smaller');
      event.target.value = '';
      return;
    }

    setFile(selected);
    onReadyChange?.(Boolean(selected));
    if (selected && !title.trim()) {
      setTitle(selected.name.replace(/\.[^.]+$/, ''));
    }
  }

  function handleThumbnailChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = '';
    setThumbnailError(null);

    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setThumbnailError('Thumbnail must be PNG, JPEG, or WebP');
      return;
    }

    if (selected.size > MAX_THUMBNAIL_BYTES) {
      setThumbnailError('Thumbnail must be 5 MB or smaller');
      return;
    }

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(selected);
    setThumbnailPreview(URL.createObjectURL(selected));
  }

  function clearThumbnail() {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(null);
    setThumbnailPreview(null);
    setThumbnailError(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    const uploadTitle = title.trim() || file.name;
    const parsedDay = inferRotationDayFromTitle(uploadTitle);
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await onSubmit?.({
        title: uploadTitle,
        categoryId,
        rotationDay: categoryInfo.usesRotation ? parsedDay : undefined,
        file,
        thumbnail: thumbnail ?? undefined,
      });
      setTitle('');
      setFile(null);
      clearThumbnail();
      onReadyChange?.(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn(
        'space-y-4',
        !embedded && cn(CARD_SURFACE_CLASS, 'mb-4 border-brand-200/60 p-4 sm:p-5 dark:border-brand-600/30'),
      )}
    >
      {!embedded && (
        <div>
          <p className="text-body-sm font-medium text-content-primary">Upload to {categoryLabel}</p>
          <p className="mt-0.5 text-caption text-content-secondary">
            Add a title and video file for this category.
          </p>
        </div>
      )}

      <Input
        label="Title"
        placeholder="Video title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />

      <div>
        <label className="mb-1 block text-xs font-medium text-content-muted">Video file</label>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedVideoTypes}
          onChange={handleFileChange}
          className="sr-only"
          id={`upload-content-file-${categoryId}`}
          required
        />
        <label
          htmlFor={`upload-content-file-${categoryId}`}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed',
            'border-surface-border bg-surface-muted px-4 py-8 text-center transition-colors',
            'hover:border-brand-500/40 hover:bg-brand-50/30 dark:hover:bg-brand-600/10',
          )}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-600 dark:text-brand-400">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-body-sm font-medium text-content-primary">
            {file ? file.name : 'Choose a video file'}
          </span>
          <span className="text-caption text-content-muted">MP4, MOV, or WebM · max 1.5 GB</span>
        </label>
        {fileError && (
          <p className="mt-1.5 text-caption text-red-600 dark:text-red-400">{fileError}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-content-muted">
          Thumbnail <span className="font-normal text-content-muted">(optional)</span>
        </label>
        <p className="mb-2 text-caption text-content-secondary">
          Upload a custom image, or leave empty — a frame from the video will be used automatically.
        </p>
        <input
          ref={thumbnailInputRef}
          type="file"
          accept={acceptedThumbnailTypes}
          onChange={handleThumbnailChange}
          className="sr-only"
          id={`upload-content-thumbnail-${categoryId}`}
        />

        {thumbnailPreview ? (
          <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-muted/30 p-3">
            <img
              src={thumbnailPreview}
              alt=""
              className="h-16 w-28 shrink-0 rounded-md border border-surface-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium text-content-primary">
                {thumbnail?.name}
              </p>
              <p className="text-caption text-content-secondary">Custom thumbnail ready</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-3"
              onClick={() => thumbnailInputRef.current?.click()}
            >
              Replace
            </Button>
            <button
              type="button"
              aria-label="Remove thumbnail"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-muted hover:text-content-primary"
              onClick={clearThumbnail}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={`upload-content-thumbnail-${categoryId}`}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed',
              'border-surface-border bg-surface-muted/20 px-4 py-6 text-center transition-colors',
              'hover:border-brand-500/40 hover:bg-brand-50/30 dark:hover:bg-brand-600/10',
            )}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-600 dark:text-brand-400">
              <ImagePlus className="h-4 w-4" />
            </span>
            <span className="text-body-sm font-medium text-content-primary">
              Choose thumbnail image
            </span>
            <span className="text-caption text-content-muted">PNG, JPEG, or WebP — max 5 MB</span>
          </label>
        )}

        {thumbnailError && (
          <p className="mt-1.5 text-caption text-status-danger">{thumbnailError}</p>
        )}
      </div>

      {!embedded && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="h-9 px-4" disabled={!file || isSubmitting}>
            {isSubmitting ? 'Uploading…' : 'Upload video'}
          </Button>
        </div>
      )}
    </form>
  );
}
