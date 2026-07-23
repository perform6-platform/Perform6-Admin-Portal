import { PALETTE_SHORT_LABELS } from './deploymentWizard';
import type {
  DeploymentEntity,
  DeploymentScreenSummary,
  ScreenAssignment,
} from '../types/deployments';
import type { ContentCategory } from '../types/categories';

export type ScreenContentLike = {
  screenKey?: string;
  contentSlot?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  playlistKey?: string | null;
  category?: { id?: string; name?: string; slug?: string } | null;
};

/** Humanize enum-like values: FITNESS_WALL → Fitness Wall */
export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatPlaylistKeyLabel(playlistKey: string | null | undefined): string {
  if (!playlistKey) return '';
  return `Program ${playlistKey}`;
}

export function formatCategoryShortLabel(
  categoryName?: string | null,
  categorySlug?: string | null,
): string {
  if (categorySlug && PALETTE_SHORT_LABELS[categorySlug]) {
    return PALETTE_SHORT_LABELS[categorySlug];
  }
  return categoryName?.trim() || '—';
}

/** Resolve screens from detail or list-shaped deployment payloads. */
export function resolveDeploymentScreens(
  deployment: DeploymentEntity | null | undefined,
): ScreenContentLike[] {
  if (!deployment) return [];

  if (Array.isArray(deployment.screens) && deployment.screens.length > 0) {
    return deployment.screens;
  }

  return (deployment.screenAssignments ?? []).map((assignment: ScreenAssignment) => ({
    screenKey: assignment.screenKey,
    contentSlot: assignment.contentSlot,
    categoryId: assignment.categoryId ?? assignment.category?.id ?? null,
    categoryName: assignment.categoryName ?? assignment.category?.name ?? null,
    categorySlug: assignment.categorySlug ?? assignment.category?.slug ?? null,
    playlistKey: assignment.playlistKey ?? null,
  }));
}

/**
 * What actually plays on a screen — category (+ program), not legacy contentSlot.
 * Example: "15 Minutes · Program A"
 */
export function formatScreenContentLabel(screen: ScreenContentLike): string {
  const category = formatCategoryShortLabel(screen.categoryName, screen.categorySlug);
  if (category === '—') {
    return screen.categoryId ? 'Assigned category' : 'Unassigned';
  }
  const program = formatPlaylistKeyLabel(screen.playlistKey);
  return program ? `${category} · ${program}` : category;
}

/** Legacy role only (START_HERE / PHASE_1) — not the playing content. */
export function formatScreenRoleLabel(screen: ScreenContentLike): string | null {
  if (!screen.contentSlot) return null;
  return formatEnumLabel(screen.contentSlot);
}

export interface DeploymentAxesDisplay {
  /** Primary axis / field column */
  fieldLabel: string;
  /** Secondary axis / variant column */
  variantLabel: string;
  /** True when deployment has no Fitness/Golf wall axes */
  isAxisFree: boolean;
  /** Compact subtitle e.g. "15 Min · Program A" or "Fitness · Wall" */
  summary: string;
}

/**
 * Display Field/Variant (or 15 Min / Program) for tables and device panels.
 * Prefers DB field/variant when set; otherwise derives from screen assignments.
 */
export function formatDeploymentAxes(
  deployment: {
    fieldCategory?: string | null;
    exerciseVariant?: string | null;
    screens?: DeploymentScreenSummary[] | null;
    screenAssignments?: ScreenAssignment[] | null;
  } | null | undefined,
  options?: { categories?: ContentCategory[] },
): DeploymentAxesDisplay {
  const field = deployment?.fieldCategory?.trim() || '';
  const variant = deployment?.exerciseVariant?.trim() || '';

    if (field || variant) {
      const fieldLabel = formatEnumLabel(field || null);
      const variantLabel = formatEnumLabel(variant || null);
      return {
        fieldLabel,
        variantLabel,
        isAxisFree: false,
        summary: [fieldLabel, variantLabel].filter((part) => part !== '—').join(' · ') || '—',
      };
    }

  const screens = resolveDeploymentScreens(deployment as DeploymentEntity);
  const assigned = screens.filter((screen) => screen.categoryId || screen.categoryName);

  if (assigned.length === 0) {
    return {
      fieldLabel: '—',
      variantLabel: '—',
      isAxisFree: true,
      summary: '—',
    };
  }

  const enriched = assigned.map((screen) => {
    if (screen.categoryName || screen.categorySlug) return screen;
    const match = options?.categories?.find((category) => category.id === screen.categoryId);
    return {
      ...screen,
      categoryName: match?.name ?? screen.categoryName,
      categorySlug: match?.slug ?? screen.categorySlug,
    };
  });

  const namedOnly = enriched.every(
    (screen) =>
      screen.categorySlug === '15-minutes' ||
      Boolean(screen.playlistKey) ||
      (screen.categoryName ?? '').toLowerCase().includes('15'),
  );

  if (namedOnly) {
    const programs = [
      ...new Set(
        enriched
          .map((screen) => formatPlaylistKeyLabel(screen.playlistKey))
          .filter(Boolean),
      ),
    ];
    const categoryLabel = formatCategoryShortLabel(
      enriched[0]?.categoryName,
      enriched[0]?.categorySlug ?? '15-minutes',
    );
    return {
      fieldLabel: categoryLabel,
      variantLabel: programs.length > 0 ? programs.join(', ') : '—',
      isAxisFree: true,
      summary:
        programs.length > 0 ? `${categoryLabel} · ${programs.join(', ')}` : categoryLabel,
    };
  }

  const labels = [
    ...new Set(enriched.map((screen) => formatScreenContentLabel(screen))),
  ];
  return {
    fieldLabel: labels[0] ?? '—',
    variantLabel: labels.length > 1 ? labels.slice(1).join(', ') : '—',
    isAxisFree: true,
    summary: labels.join(' · ') || '—',
  };
}

/** Device panel / table axes when field/variant may be null. */
export function formatDeviceContentAxes(device: {
  fieldCategory?: string | null;
  exerciseVariant?: string | null;
  screens?: Array<{
    screenKey?: string;
    categoryId?: string | null;
    categoryName?: string | null;
    categorySlug?: string | null;
    playlistKey?: string | null;
  }> | null;
}): DeploymentAxesDisplay {
  return formatDeploymentAxes({
    fieldCategory: device.fieldCategory,
    exerciseVariant: device.exerciseVariant,
    screens: (device.screens ?? []).map((screen, index) => ({
      screenKey: screen.screenKey ?? `SCREEN_${index + 1}`,
      categoryId: screen.categoryId ?? null,
      categoryName: screen.categoryName ?? null,
      categorySlug: screen.categorySlug ?? null,
      playlistKey: screen.playlistKey ?? null,
    })),
  });
}
