import type { Program, ProgramSession } from './content';
import type { PlaybackManifest } from './deployments';

export type RotationBulkSection =
  | 'default'
  | 'start-here'
  | 'phase-1'
  | 'phase-2'
  | 'full-program';

export interface RotationBulkSingleLibrary {
  libraryType: string;
  mediaVersionId: string | null;
}

export interface RotationBulkDayAssignment {
  dayNumber: number;
  mediaVersionId: string;
}

export interface RotationBulkRotatingLibrary {
  libraryType: string;
  assignments: RotationBulkDayAssignment[];
}

export interface RotationBulkSinglePayload {
  libraries: RotationBulkSingleLibrary[];
}

export interface RotationBulkRotatingPayload {
  libraries: RotationBulkRotatingLibrary[];
}

export type RotationBulkPayload = RotationBulkSinglePayload | RotationBulkRotatingPayload;

export interface ProgramRotationPatchPayload {
  assignments: Array<{ dayNumber: number; mediaVersionId: string | null }>;
}

export interface CreateRotationSessionPayload {
  programId: string;
  dayNumber: number;
  title: string;
  mediaVersionId: string;
  sortOrder?: number;
}

export interface UpdateRotationSessionPayload {
  title?: string;
  dayNumber?: number;
  mediaVersionId?: string;
  sortOrder?: number;
}

/** PATCH /rotation/devices/:deviceId/start-date */
export interface SetRotationStartDatePayload {
  rotationStartDate: string;
}

export interface DeviceRotationStartDate {
  deviceId: string;
  rotationStartDate: string;
  rotationDay: number;
}

/** GET /rotation/devices/:deviceId/current */
export interface DeviceCurrentRotation {
  deviceId: string;
  rotationStartDate: string;
  rotationDay: number;
  deployment: {
    deploymentType: string;
    fieldCategory: string;
    exerciseVariant: string;
  };
}

/** GET /rotation/current — legacy global. */
export interface GlobalRotation {
  rotationDay: number;
  epoch: string;
  cacheDays: number;
  libraries: Array<{
    libraryType: string;
    programId: string;
    rotationDay: number | null;
    sessions: ProgramSession[];
  }>;
}

/** GET /rotation/:category/day/:day */
export interface CategoryRotationDay {
  category: string;
  programId: string;
  day: number;
  session: ProgramSession | null;
}

export type RotationPrograms = Program[];
export type { PlaybackManifest };
