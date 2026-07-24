import type { ContentItem } from '../constants/contentLibrary';
import {
  contentCategoryGroups,
  type CategoryGroup,
  type ContentCategoryId,
  type PlaybackCategoryId,
} from '../constants/contentPlayback';
import type {
  RotationBulkPayload,
  RotationBulkSection,
} from '../types/rotation';
import { categoryToLibraryType } from './libraryType';
import type { VideoAssignment } from './rotationAssignments';

function getSectionCategoryIds(
  section: PlaybackCategoryId,
  groups: CategoryGroup[] = contentCategoryGroups,
): ContentCategoryId[] {
  const group = groups.find((entry) => entry.playbackCategory === section);
  return group?.children.map((child) => child.id) ?? [];
}

export function filterAssignmentsForGroup(
  group: CategoryGroup,
  assignments: VideoAssignment[],
): VideoAssignment[] {
  const ids = new Set(group.children.map((child) => child.id));
  return assignments.filter((assignment) => ids.has(assignment.categoryId));
}

/** Prefer programId on the child (API playlist id); fall back to child.id when UUID. */
export function resolvePlaylistProgramId(
  group: CategoryGroup,
  categoryId: ContentCategoryId,
): string | null {
  const child = group.children.find((entry) => entry.id === categoryId);
  if (!child) return null;
  if (child.programId) return child.programId;
  if (/^[0-9a-f-]{36}$/i.test(child.id)) return child.id;
  return null;
}

function findMediaVersionId(
  items: ContentItem[],
  categoryId: ContentCategoryId,
  videoTitle: string,
): string | null {
  const item = items.find(
    (entry) =>
      entry.categoryId === categoryId &&
      entry.title === videoTitle &&
      (!entry.status || entry.status === 'READY'),
  );
  return item?.mediaVersionId ?? null;
}

function buildSingleLibraryPayload(
  section: 'default' | 'start-here',
  sectionAssignments: VideoAssignment[],
  items: ContentItem[],
  groups: CategoryGroup[],
): RotationBulkPayload {
  const categoryIds = getSectionCategoryIds(section, groups);

  return {
    libraries: categoryIds.map((categoryId) => {
      const selected = sectionAssignments.find(
        (assignment) => assignment.categoryId === categoryId && assignment.included,
      );
      const mediaVersionId = selected
        ? findMediaVersionId(items, categoryId, selected.videoTitle)
        : null;

      return {
        libraryType: categoryToLibraryType(categoryId),
        mediaVersionId,
      };
    }),
  };
}

function buildRotatingLibraryPayload(
  section: 'phase-1' | 'phase-2' | 'full-program',
  sectionAssignments: VideoAssignment[],
  items: ContentItem[],
  groups: CategoryGroup[],
): RotationBulkPayload {
  const categoryIds = getSectionCategoryIds(section, groups);

  return {
    libraries: categoryIds.map((categoryId) => ({
      libraryType: categoryToLibraryType(categoryId),
      // Full desired set for this library (may be []). Backend clears days not listed.
      assignments: sectionAssignments
        .filter((assignment) => assignment.categoryId === categoryId && assignment.included)
        .map((assignment) => {
          const mediaVersionId = findMediaVersionId(items, categoryId, assignment.videoTitle);
          if (!mediaVersionId) return null;
          return { dayNumber: assignment.day, mediaVersionId };
        })
        .filter((entry): entry is { dayNumber: number; mediaVersionId: string } => entry !== null),
    })),
  };
}

export function filterAssignmentsForSection(
  section: PlaybackCategoryId,
  assignments: VideoAssignment[],
  groups: CategoryGroup[] = contentCategoryGroups,
): VideoAssignment[] {
  const sectionCategoryIds = getSectionCategoryIds(section, groups);
  return assignments.filter((assignment) => sectionCategoryIds.includes(assignment.categoryId));
}

export function buildRotationBulkPayload(
  section: RotationBulkSection,
  assignments: VideoAssignment[],
  items: ContentItem[],
  groups: CategoryGroup[] = contentCategoryGroups,
): RotationBulkPayload {
  const sectionCategoryIds = getSectionCategoryIds(section, groups);
  const sectionAssignments = assignments.filter((assignment) =>
    sectionCategoryIds.includes(assignment.categoryId),
  );

  if (section === 'default' || section === 'start-here') {
    return buildSingleLibraryPayload(section, sectionAssignments, items, groups);
  }

  return buildRotatingLibraryPayload(section, sectionAssignments, items, groups);
}

/** Build PATCH /rotation/programs/:id payload for a custom category child. */
export function buildCustomProgramRotationPayload(
  categoryId: ContentCategoryId,
  assignments: VideoAssignment[],
  items: ContentItem[],
): { assignments: Array<{ dayNumber: number; mediaVersionId: string }> } {
  const dayAssignments = assignments
    .filter((assignment) => assignment.categoryId === categoryId && assignment.included)
    .map((assignment) => {
      const mediaVersionId = findMediaVersionId(items, categoryId, assignment.videoTitle);
      if (!mediaVersionId) return null;
      return { dayNumber: assignment.day, mediaVersionId };
    })
    .filter((entry): entry is { dayNumber: number; mediaVersionId: string } => entry !== null);

  return { assignments: dayAssignments };
}
