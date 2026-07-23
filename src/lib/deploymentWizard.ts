import type { CategoryScope, ContentCategory } from '../types/categories';

export const TOUCHSCREEN_CATEGORY_SLUGS = [
  'default',
  'start-here',
  'phase-1',
  'phase-2',
  'full-program',
] as const;

/** Fixed system categories used by TOUCHSCREEN_DEPLOYMENT (XT2145). */
export function touchscreenCategoryIds(categories: ContentCategory[]): string[] {
  return TOUCHSCREEN_CATEGORY_SLUGS.map(
    (slug) => categories.find((category) => category.slug === slug)?.id,
  ).filter((id): id is string => Boolean(id));
}

export function isTouchscreenDeployment(type: string): boolean {
  return type === 'TOUCHSCREEN_DEPLOYMENT';
}

export function isDefaultDeploymentType(type: string): boolean {
  return type === 'DEFAULT_DEPLOYMENT';
}

export const HD226_MIN_PLAYERS = 1;
export const HD226_MAX_PLAYERS = 10;

export const XC_SCREEN_KEYS = ['SCREEN_1', 'SCREEN_2', 'SCREEN_3'] as const;

export const PALETTE_SLUG_ORDER = [
  'start-here',
  'default',
  'phase-1',
  'phase-2',
  'full-program',
  '15-minutes',
] as const;

export const PALETTE_SHORT_LABELS: Record<string, string> = {
  'start-here': 'Start',
  default: 'Default',
  'phase-1': 'Phase 1',
  'phase-2': 'Phase 2',
  'full-program': 'Full Program',
  '15-minutes': '15 Min',
};

export interface DeploymentScreenDefinition {
  screenKey: string;
  label: string;
  clusterLabel: string;
  memberKey: string;
}

export function buildDeploymentScreens(playerCount: number): DeploymentScreenDefinition[] {
  const count = Math.max(HD226_MIN_PLAYERS, Math.min(playerCount, HD226_MAX_PLAYERS));
  return Array.from({ length: count }, (_, index) => {
    const screenNumber = index + 1;
    const letter = String.fromCharCode(65 + index);
    return {
      screenKey: `SCREEN_${screenNumber}`,
      label: `Screen ${screenNumber}`,
      clusterLabel: `Player ${letter} (DEVICE_${letter})`,
      memberKey: `DEVICE_${letter}`,
    };
  });
}

export function categoryRequiresField(scope: CategoryScope): boolean {
  return scope === 'BY_FIELD' || scope === 'BY_FIELD_AND_VARIANT';
}

export function categoryRequiresVariant(scope: CategoryScope): boolean {
  return scope === 'BY_FIELD_AND_VARIANT';
}

export function categoryRequiresProgramPicker(scope: CategoryScope): boolean {
  return scope === 'BY_NAMED_PLAYLIST';
}

export function deploymentRequiresField(
  categories: ContentCategory[],
  selectedCategoryIds: string[],
): boolean {
  const selected = categories.filter((category) => selectedCategoryIds.includes(category.id));
  return selected.some((category) => categoryRequiresField(category.scope));
}

export function deploymentRequiresVariant(
  categories: ContentCategory[],
  selectedCategoryIds: string[],
): boolean {
  const selected = categories.filter((category) => selectedCategoryIds.includes(category.id));
  return selected.some((category) => categoryRequiresVariant(category.scope));
}

export function findCategoryById(
  categories: ContentCategory[],
  categoryId: string,
): ContentCategory | undefined {
  return categories.find((category) => category.id === categoryId);
}

export function playlistOptionsForCategory(category: ContentCategory | undefined) {
  if (!category || category.scope !== 'BY_NAMED_PLAYLIST') return [];
  return [...(category.playlists ?? [])]
    .sort((a, b) => (a.playlistKey ?? a.name).localeCompare(b.playlistKey ?? b.name))
    .map((playlist) => ({
      value: playlist.playlistKey ?? playlist.id,
      label: playlist.name,
    }));
}

/** Ordered content palette for deployment wizard checkboxes. */
export function buildCategoryPalette(categories: ContentCategory[]): ContentCategory[] {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const ordered: ContentCategory[] = [];

  for (const slug of PALETTE_SLUG_ORDER) {
    const match = bySlug.get(slug);
    if (match) ordered.push(match);
  }

  for (const category of categories) {
    if (!PALETTE_SLUG_ORDER.includes(category.slug as (typeof PALETTE_SLUG_ORDER)[number])) {
      ordered.push(category);
    }
  }

  return ordered;
}

export function paletteLabel(category: ContentCategory): string {
  return PALETTE_SHORT_LABELS[category.slug] ?? category.name;
}

export function isXcModel(model: string | null | undefined): boolean {
  return (model ?? '').toUpperCase().includes('XC4055');
}

export function isHdModel(model: string | null | undefined): boolean {
  return (model ?? '').toUpperCase().includes('HD226');
}
