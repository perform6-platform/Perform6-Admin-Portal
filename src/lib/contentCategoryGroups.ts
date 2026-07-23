import type { ContentCategory, CategoryPlaylist } from '../types/categories';
import {
  contentCategoryGroups as systemContentCategoryGroups,
  type CategoryGroup,
  type ContentCategoryId,
  type PlaybackCategoryId,
  type SystemContentCategoryId,
  type SystemPlaybackCategoryId,
} from '../constants/contentPlayback';
import { LIBRARY_TYPE_TO_CATEGORY } from './libraryType';

const SYSTEM_SLUG_ORDER = [
  'default',
  'start-here',
  'phase-1',
  'phase-2',
  'full-program',
  '15-minutes',
] as const;

const SLUG_TO_PLAYBACK: Record<string, SystemPlaybackCategoryId> = {
  default: 'default',
  'start-here': 'start-here',
  'phase-1': 'phase-1',
  'phase-2': 'phase-2',
  'full-program': 'full-program',
};

export function playlistAxisLabel(
  fieldCategory: string | null | undefined,
  exerciseVariant: string | null | undefined,
  playlistKey?: string | null,
): string {
  if (playlistKey) return `Program ${playlistKey}`;
  if (!fieldCategory) return 'All deployments';
  const fieldLabel = fieldCategory === 'FITNESS' ? 'Fitness' : 'Golf';
  if (!exerciseVariant) return fieldLabel;
  const variantLabel = exerciseVariant === 'WALL' ? 'Wall' : 'No Wall';
  return `${fieldLabel} (${variantLabel})`;
}

function playlistChildId(playlist: CategoryPlaylist): ContentCategoryId {
  if (playlist.libraryType) {
    return (
      (LIBRARY_TYPE_TO_CATEGORY[playlist.libraryType] as SystemContentCategoryId | undefined) ??
      (playlist.id as ContentCategoryId)
    );
  }
  return playlist.id as ContentCategoryId;
}

function sortCategories(categories: ContentCategory[]): ContentCategory[] {
  return [...categories].sort((a, b) => {
    const aIdx = SYSTEM_SLUG_ORDER.indexOf(a.slug as (typeof SYSTEM_SLUG_ORDER)[number]);
    const bIdx = SYSTEM_SLUG_ORDER.indexOf(b.slug as (typeof SYSTEM_SLUG_ORDER)[number]);
    if (a.isSystem && b.isSystem && aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function categoryToGroup(category: ContentCategory): CategoryGroup {
  const playbackCategory: PlaybackCategoryId = category.isSystem
    ? (SLUG_TO_PLAYBACK[category.slug] ?? 'custom')
    : 'custom';

  const playlists = [...(category.playlists ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    groupKey: category.id,
    playbackCategory,
    label: category.name,
    isSystem: category.isSystem,
    parentCategoryId: category.id,
    scope: category.scope,
    children: playlists.map((playlist) => ({
      id: playlistChildId(playlist),
      label: playlistAxisLabel(
        playlist.fieldCategory,
        playlist.exerciseVariant,
        playlist.playlistKey,
      ),
      programId: playlist.id,
    })),
  };
}

/** Build sidebar/rotation groups from parent content categories + nested playlists. */
export function buildContentCategoryGroups(
  apiCategories: ContentCategory[] | undefined,
): CategoryGroup[] {
  if (!apiCategories?.length) {
    return systemContentCategoryGroups.map((group) => ({
      ...group,
      groupKey: group.groupKey ?? group.playbackCategory,
      children: group.children.map((child) => ({ ...child })),
    }));
  }

  return sortCategories(apiCategories).map(categoryToGroup);
}

export function resolveCategoryKeyFromApiCategory(
  category: ContentCategory,
): ContentCategoryId {
  return category.id as ContentCategoryId;
}

export function isUuidCategoryId(categoryId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    categoryId,
  );
}

export function getCategoryLabelFromGroups(
  groups: CategoryGroup[],
  categoryId: ContentCategoryId,
): string {
  for (const group of groups) {
    const child = group.children.find((entry) => entry.id === categoryId);
    if (!child) continue;
    if (group.children.length === 1) return group.label;
    return `${group.label} — ${child.label}`;
  }
  return categoryId;
}

export function findGroupByKey(
  groups: CategoryGroup[],
  groupKey: string,
): CategoryGroup | undefined {
  return groups.find((group) => group.groupKey === groupKey);
}

export function scopePlaylistCount(scope: string): number {
  switch (scope) {
    case 'GLOBAL':
      return 1;
    case 'BY_FIELD':
      return 2;
    case 'BY_FIELD_AND_VARIANT':
      return 4;
    case 'BY_NAMED_PLAYLIST':
      return 4;
    default:
      return 1;
  }
}

export function scopeLabel(scope: string): string {
  switch (scope) {
    case 'GLOBAL':
      return 'Global (1 playlist)';
    case 'BY_FIELD':
      return 'By field (Fitness / Golf)';
    case 'BY_FIELD_AND_VARIANT':
      return 'By field + variant (4 playlists)';
    case 'BY_NAMED_PLAYLIST':
      return 'Named programs (A–D)';
    default:
      return scope;
  }
}
