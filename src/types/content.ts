import type { MediaVersion } from './media';

export type ContentCategoryId = 'FITNESS' | 'GOLF' | string;

export interface SessionMedia {
  mediaVersion: MediaVersion;
}

export interface ProgramSession {
  id: string;
  programId?: string;
  dayNumber: number;
  title: string;
  description?: string | null;
  mediaVersionId?: string | null;
  mediaVersion?: MediaVersion | null;
  sessionMedia?: SessionMedia | SessionMedia[] | null;
}

export interface Program {
  id: string;
  name: string;
  libraryType: string | null;
  description: string | null;
  durationMinutes: number | null;
  cycleDays: number | null;
  isRotating: boolean;
  sessions?: ProgramSession[];
}

export interface CategoryContent {
  category: ContentCategoryId;
  label: string;
  primaryLibrary: string;
  programs: Program[];
}
