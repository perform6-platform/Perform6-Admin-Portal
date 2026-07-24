import type { ContentItem } from '../constants/contentLibrary';
import type { ContentCategoryId } from '../constants/contentPlayback';
import { getPlaybackCategoryForContent } from '../constants/contentPlayback';
import type { Program, ProgramSession } from '../types/content';
import {
  getScheduleColumnForCategory,
  toScheduleVideoName,
  type RotationScheduleColumnKey,
  type RotationScheduleRow,
} from '../constants/rotationSchedule';
import { usesRotationForPlayback } from './deploymentHelpers';
import { getSessionMediaVersionId, normalizeRotationPrograms } from './rotationMapper';
import { libraryTypeToCategory } from './libraryType';
export interface VideoAssignment {
  categoryId: ContentCategoryId;
  videoTitle: string;
  included: boolean;
  day: number;
}

export interface VideoAssignmentState {
  included: boolean;
  day: number;
}

const columnCategoryMap: Record<RotationScheduleColumnKey, ContentCategoryId> = {
  defaultFitness: 'default-fitness',
  defaultGolf: 'default-golf',
  startHereFitness: 'start-here-fitness',
  startHereGolf: 'start-here-golf',
  phase1FitnessWall: 'phase-1-fitness-wall',
  phase1FitnessNoWall: 'phase-1-fitness-no-wall',
  phase1GolfWall: 'phase-1-golf-wall',
  phase1GolfNoWall: 'phase-1-golf-no-wall',
  phase2: 'phase-2',
  fullProgram: 'full-program',
};

export function getVideoAssignmentKey(categoryId: ContentCategoryId, videoTitle: string): string {
  return `${categoryId}::${videoTitle}`;
}

function findVideoDayInSchedule(
  rows: RotationScheduleRow[],
  column: RotationScheduleColumnKey,
  videoTitle: string,
): number | undefined {
  const normalized = toScheduleVideoName(videoTitle);
  const match = rows.find((row) => toScheduleVideoName(String(row[column])) === normalized);
  return match?.day;
}

export function getScheduledVideosForCategory(
  rows: RotationScheduleRow[],
  categoryId: ContentCategoryId,
  getVideosByCategory: (categoryId: ContentCategoryId) => ContentItem[],
): { video: ContentItem; day: number }[] {
  const column = getScheduleColumnForCategory(categoryId);
  const playbackCategory = getPlaybackCategoryForContent(categoryId);
  const usesRotation = usesRotationForPlayback(playbackCategory);
  const videos = getVideosByCategory(categoryId);

  if (!usesRotation) {
    const staticValue = rows[0] ? toScheduleVideoName(String(rows[0][column])) : '';
    const match = videos.find((video) => toScheduleVideoName(video.title) === staticValue);
    return match ? [{ video: match, day: 1 }] : [];
  }

  return videos.flatMap((video) => {
    const day = findVideoDayInSchedule(rows, column, video.title);
    return day ? [{ video, day }] : [];
  });
}

function findVideoForSession(
  videos: ContentItem[],
  session: ProgramSession,
): ContentItem | undefined {
  const mediaVersionId = getSessionMediaVersionId(session);
  if (mediaVersionId) {
    const byVersion = videos.find((video) => video.mediaVersionId === mediaVersionId);
    if (byVersion) return byVersion;
  }

  const normalizedSessionTitle = toScheduleVideoName(session.title);
  return videos.find((video) => toScheduleVideoName(video.title) === normalizedSessionTitle);
}

/** Build UI assignment state directly from GET /rotation programs (matches by mediaVersionId). */
export function buildVideoAssignmentsFromPrograms(
  programs: Program[] | unknown,
  getVideosByCategory: (categoryId: ContentCategoryId) => ContentItem[],
): Record<string, VideoAssignmentState> {
  const assignments: Record<string, VideoAssignmentState> = {};
  const normalizedPrograms = Array.isArray(programs)
    ? programs
    : normalizeRotationPrograms(programs);

  Object.values(columnCategoryMap).forEach((categoryId) => {
    getVideosByCategory(categoryId).forEach((video) => {
      assignments[getVideoAssignmentKey(categoryId, video.title)] = {
        included: false,
        day: video.rotationDay ?? 1,
      };
    });
  });

  for (const program of normalizedPrograms) {
    const categoryId =
      libraryTypeToCategory(program.libraryType) ??
      (program.libraryType ? null : (program.id as ContentCategoryId));
    if (!categoryId) continue;

    // Seed assignment slots for videos already uploaded into this category.
    getVideosByCategory(categoryId).forEach((video) => {
      const key = getVideoAssignmentKey(categoryId, video.title);
      if (!assignments[key]) {
        assignments[key] = {
          included: false,
          day: video.rotationDay ?? 1,
        };
      }
    });

    const videos = getVideosByCategory(categoryId);
    const sessions: ProgramSession[] = Array.isArray(program.sessions) ? program.sessions : [];

    if (program.isRotating) {
      for (const session of sessions) {
        // Cleared days keep a session row with null media — do not revive via title match.
        if (!getSessionMediaVersionId(session)) continue;
        const video = findVideoForSession(videos, session);
        if (!video) continue;
        const dayNumber = Number(session.dayNumber);
        assignments[getVideoAssignmentKey(categoryId, video.title)] = {
          included: true,
          day: Number.isFinite(dayNumber) && dayNumber > 0 ? dayNumber : 1,
        };
      }
      continue;
    }

    const session = sessions.find((entry: ProgramSession) => entry.dayNumber === 1) ?? sessions[0];
    if (!session || !getSessionMediaVersionId(session)) continue;
    const video = findVideoForSession(videos, session);
    if (!video) continue;
    assignments[getVideoAssignmentKey(categoryId, video.title)] = {
      included: true,
      day: 1,
    };
  }

  return assignments;
}

export function buildVideoAssignmentsFromSchedule(
  rows: RotationScheduleRow[],
  getVideosByCategory: (categoryId: ContentCategoryId) => ContentItem[],
): Record<string, VideoAssignmentState> {
  const assignments: Record<string, VideoAssignmentState> = {};

  Object.entries(columnCategoryMap).forEach(([columnKey, categoryId]) => {
    const column = columnKey as RotationScheduleColumnKey;
    const playbackCategory = getPlaybackCategoryForContent(categoryId);
    const usesRotation = usesRotationForPlayback(playbackCategory);
    const videos = getVideosByCategory(categoryId);

    videos.forEach((video) => {
      const key = getVideoAssignmentKey(categoryId, video.title);
      const scheduledDay = findVideoDayInSchedule(rows, column, video.title);

      if (usesRotation) {
        assignments[key] = {
          included: scheduledDay !== undefined,
          day: scheduledDay ?? video.rotationDay ?? 1,
        };
      } else {
        const staticValue = rows[0] ? toScheduleVideoName(String(rows[0][column])) : '';
        assignments[key] = {
          included: staticValue === toScheduleVideoName(video.title),
          day: 1,
        };
      }
    });
  });

  return assignments;
}

export function applyVideoAssignmentsToSchedule(
  rows: RotationScheduleRow[],
  assignments: VideoAssignment[],
): RotationScheduleRow[] {
  const byCategory = new Map<ContentCategoryId, VideoAssignment[]>();

  assignments.forEach((assignment) => {
    const existing = byCategory.get(assignment.categoryId) ?? [];
    byCategory.set(assignment.categoryId, [...existing, assignment]);
  });

  let nextRows = rows.map((row) => ({ ...row }));

  byCategory.forEach((categoryAssignments, categoryId) => {
    const column = getScheduleColumnForCategory(categoryId);
    const playbackCategory = getPlaybackCategoryForContent(categoryId);
    const usesRotation = usesRotationForPlayback(playbackCategory);

    if (!usesRotation) {
      const selected = categoryAssignments.find((assignment) => assignment.included);
      if (!selected) return;

      const videoName = toScheduleVideoName(selected.videoTitle);
      nextRows = nextRows.map((row) => ({ ...row, [column]: videoName }));
      return;
    }

    nextRows = nextRows.map((row) => ({
      ...row,
      [column]: '',
    }));

    categoryAssignments
      .filter((assignment) => assignment.included)
      .forEach((assignment) => {
        const videoName = toScheduleVideoName(assignment.videoTitle);
        nextRows = nextRows.map((row) =>
          row.day === assignment.day ? { ...row, [column]: videoName } : row,
        );
      });
  });

  return nextRows;
}
