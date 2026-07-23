import { ROTATION_DAYS } from '../constants/contentPlayback';
import {
  buildVideoRow,
  getScheduleColumnForCategory,
  toScheduleVideoName,
  type RotationScheduleRow,
} from '../constants/rotationSchedule';
import type { Program, ProgramSession } from '../types/content';
import type { GlobalRotation } from '../types/rotation';
import { libraryTypeToCategory } from './libraryType';

/** Coerce API payloads into a Program[] — avoids crashes when shape differs after PATCH. */
export function normalizeRotationPrograms(data: unknown): Program[] {
  if (Array.isArray(data)) return data as Program[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.programs)) return record.programs as Program[];
    if (Array.isArray(record.data)) return record.data as Program[];
  }
  return [];
}

export function getSessionMediaVersionId(session: ProgramSession): string | null {
  if (session.mediaVersionId) return session.mediaVersionId;
  if (session.mediaVersion?.id) return session.mediaVersion.id;

  const media = session.sessionMedia;
  if (media && !Array.isArray(media) && media.mediaVersion?.id) {
    return media.mediaVersion.id;
  }
  if (Array.isArray(media) && media[0]?.mediaVersion?.id) {
    return media[0].mediaVersion.id;
  }

  return null;
}

function sessionDisplayTitle(session: ProgramSession): string {
  const media = session.sessionMedia;
  if (media && !Array.isArray(media) && media.mediaVersion?.title) {
    return media.mediaVersion.title;
  }
  if (Array.isArray(media) && media[0]?.mediaVersion?.title) {
    return media[0].mediaVersion.title;
  }
  return session.title ?? '';
}

/** Map GET /rotation programs into the 36-day schedule table rows. */
export function mapRotationProgramsToScheduleRows(programs: Program[] | unknown): RotationScheduleRow[] {
  const rows = Array.from({ length: ROTATION_DAYS }, (_, index) => buildVideoRow(index + 1));
  const normalizedPrograms = normalizeRotationPrograms(programs);

  for (const program of normalizedPrograms) {
    const categoryId = libraryTypeToCategory(program.libraryType);
    if (!categoryId) continue;

    const column = getScheduleColumnForCategory(categoryId);
    const sessions = program.sessions ?? [];

    if (program.isRotating) {
      for (const session of sessions) {
        const row = rows.find((entry) => entry.day === session.dayNumber);
        if (!row) continue;
        const title = toScheduleVideoName(sessionDisplayTitle(session));
        if (title) row[column] = title;
      }
      continue;
    }

    const session = sessions.find((entry) => entry.dayNumber === 1) ?? sessions[0];
    if (!session) continue;
    const title = toScheduleVideoName(sessionDisplayTitle(session));
    if (!title) continue;
    rows.forEach((row) => {
      row[column] = title;
    });
  }

  return rows;
}

/** Map GET /rotation/day/:day or /rotation/current libraries into one schedule row. */
export function mapGlobalRotationToScheduleRow(
  globalRotation: GlobalRotation,
  day: number,
): RotationScheduleRow {
  const row = buildVideoRow(day);

  for (const library of globalRotation.libraries) {
    const categoryId = libraryTypeToCategory(library.libraryType);
    if (!categoryId) continue;

    const column = getScheduleColumnForCategory(categoryId);
    const session = library.sessions[0];
    if (!session) continue;

    const title = toScheduleVideoName(sessionDisplayTitle(session));
    if (title) row[column] = title;
  }

  return row;
}
