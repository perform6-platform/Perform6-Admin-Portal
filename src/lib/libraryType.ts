import type { ContentCategoryId, SystemContentCategoryId } from '../constants/contentPlayback';
import type { LibraryType } from '../types/media';
import { isUuidCategoryId } from './contentCategoryGroups';

/** Map frontend sidebar category → backend libraryType enum (system only). */
export const CATEGORY_TO_LIBRARY_TYPE: Record<SystemContentCategoryId, LibraryType> = {
  'default-fitness': 'DEFAULT_FITNESS',
  'default-golf': 'DEFAULT_GOLF',
  'start-here-fitness': 'START_HERE_FITNESS',
  'start-here-golf': 'START_HERE_GOLF',
  'phase-1-fitness-wall': 'FITNESS_WALL',
  'phase-1-fitness-no-wall': 'FITNESS_NO_WALL',
  'phase-1-golf-wall': 'GOLF_WALL',
  'phase-1-golf-no-wall': 'GOLF_NO_WALL',
  'phase-2': 'PHASE_2',
  'full-program': 'FULL_PROGRAM',
};

export const LIBRARY_TYPE_TO_CATEGORY: Record<string, SystemContentCategoryId> =
  Object.fromEntries(
    Object.entries(CATEGORY_TO_LIBRARY_TYPE).map(([category, libraryType]) => [
      libraryType,
      category as SystemContentCategoryId,
    ]),
  ) as Record<string, SystemContentCategoryId>;

export function isSystemContentCategoryId(id: string): id is SystemContentCategoryId {
  return Object.prototype.hasOwnProperty.call(CATEGORY_TO_LIBRARY_TYPE, id);
}

export function categoryToLibraryType(categoryId: ContentCategoryId): LibraryType {
  if (!isSystemContentCategoryId(categoryId)) {
    throw new Error(`No libraryType for custom category ${categoryId}`);
  }
  return CATEGORY_TO_LIBRARY_TYPE[categoryId];
}

export function libraryTypeToCategory(
  libraryType: string | null | undefined,
): SystemContentCategoryId | null {
  if (!libraryType) return null;
  return LIBRARY_TYPE_TO_CATEGORY[libraryType] ?? null;
}

/** Resolve upload fields for Content Library — system uses libraryType, custom uses programId. */
export function resolveMediaUploadTarget(categoryId: ContentCategoryId): {
  libraryType?: LibraryType;
  programId?: string;
} {
  if (isSystemContentCategoryId(categoryId)) {
    return { libraryType: CATEGORY_TO_LIBRARY_TYPE[categoryId] };
  }
  if (isUuidCategoryId(categoryId)) {
    return { programId: categoryId };
  }
  throw new Error(`Unknown content category: ${categoryId}`);
}

export function resolveStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Multer incoming placeholders / local absolute paths are not browser-loadable.
  if (
    path.startsWith('file:') ||
    path.includes('/incoming/') ||
    path.includes('\\incoming\\')
  ) {
    return null;
  }
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1')
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
