import type { ContentCategoryId } from './contentPlayback';

export type { ContentCategoryId };

export type ContentTypeFilter = 'all' | 'videos';

export type ContentMediaType = 'video' | 'image' | 'document';

export interface ContentItem {
  id: string;
  title: string;
  mediaType: ContentMediaType;
  categoryId: ContentCategoryId;
  rotationDay?: number;
  duration?: string;
  dateLabel: string;
  format: string;
  thumbnailUrl: string;
  videoUrl?: string;
  /** Active media version id from API — required for POST /rotation. */
  mediaVersionId?: string;
  libraryType?: string;
  /** Custom category program id when not a system library. */
  programId?: string;
  /** Backend media workflow status. */
  status?: 'READY' | 'PROCESSING' | 'FAILED' | 'ARCHIVED' | string;
  updatedAt?: string;
}

export const defaultContentThumbnail =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">
      <rect fill="#e5e7eb" width="480" height="270"/>
      <text x="240" y="140" text-anchor="middle" fill="#9ca3af" font-family="system-ui,sans-serif" font-size="16">No thumbnail</text>
    </svg>`,
  );

/** Play URL from media API only — no sample / mock fallback. */
export function getContentVideoUrl(item: ContentItem): string | null {
  if (item.mediaType !== 'video') return null;
  return item.videoUrl?.trim() || null;
}

export const contentTypeTabs: { value: ContentTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Content' },
];

import { allContentCategories } from './contentPlayback';

export const contentCategories = allContentCategories;

export const contentCategoryFilterOptions = [
  { value: 'all', label: 'All Categories' },
  ...contentCategories.map((category) => ({ value: category.id, label: category.label })),
];

export const contentTypeFilterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'video', label: 'Video' },
];

export const contentSortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];
