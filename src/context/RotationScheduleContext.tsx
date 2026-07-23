import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ContentCategoryId } from '../constants/contentPlayback';
import { getPlaybackCategoryForContent } from '../constants/contentPlayback';
import type { DeploymentScheduleEntry } from '../constants/deployments';
import {
  createInitialRotationSchedule,
  getRotationRowForDay,
  getScheduleColumnForCategory,
  toScheduleVideoName,
  type RotationScheduleColumnKey,
  type RotationScheduleRow,
} from '../constants/rotationSchedule';
import { useRotationPrograms } from '../hooks/useRotation';
import { usesRotationForPlayback } from '../lib/deploymentHelpers';
import { mapRotationProgramsToScheduleRows } from '../lib/rotationMapper';
import {
  applyVideoAssignmentsToSchedule,
  type VideoAssignment,
} from '../lib/rotationAssignments';
import type { Program } from '../types/content';

export interface DeploymentSchedulePayload {
  entries: DeploymentScheduleEntry[];
}

interface RotationScheduleContextValue {
  rows: RotationScheduleRow[];
  programs: Program[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  getRowByDay: (day: number) => RotationScheduleRow | undefined;
  updateDayRow: (day: number, updates: Partial<Record<RotationScheduleColumnKey, string>>) => void;
  applyDeploymentToSchedule: (payload: DeploymentSchedulePayload) => void;
  applyRotationAssignments: (assignments: VideoAssignment[]) => void;
  resetSchedule: () => void;
}

function applyDeploymentToScheduleRows(
  rows: RotationScheduleRow[],
  entriesByCategory: Map<ContentCategoryId, DeploymentScheduleEntry[]>,
): RotationScheduleRow[] {
  return rows.map((row) => {
    const updates: Partial<Record<RotationScheduleColumnKey, string>> = {};

    entriesByCategory.forEach((entries, categoryId) => {
      const playbackCategory = getPlaybackCategoryForContent(categoryId);
      const column = getScheduleColumnForCategory(categoryId);
      const usesRotation = usesRotationForPlayback(playbackCategory);

      if (!usesRotation) {
        const videoName = toScheduleVideoName(entries[0]?.videoTitle ?? '');
        if (videoName) updates[column] = videoName;
        return;
      }

      const dayEntry = entries.find((entry) => entry.day === row.day);
      if (dayEntry) {
        updates[column] = toScheduleVideoName(dayEntry.videoTitle);
      }
    });

    return Object.keys(updates).length > 0 ? { ...row, ...updates } : row;
  });
}

const RotationScheduleContext = createContext<RotationScheduleContextValue | null>(null);

export function RotationScheduleProvider({ children }: { children: ReactNode }) {
  const { data: programs, isLoading, isError } = useRotationPrograms();
  const [rows, setRows] = useState<RotationScheduleRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (programs) {
      setRows(mapRotationProgramsToScheduleRows(programs));
    }
  }, [programs]);

  const getRowByDay = useCallback(
    (day: number) => getRotationRowForDay(day, rows),
    [rows],
  );

  const updateDayRow = useCallback(
    (day: number, updates: Partial<Record<RotationScheduleColumnKey, string>>) => {
      setRows((current) =>
        current.map((row) => (row.day === day ? { ...row, ...updates } : row)),
      );
    },
    [],
  );

  const applyDeploymentToSchedule = useCallback((payload: DeploymentSchedulePayload) => {
    setRows((current) => {
      const entriesByCategory = new Map<ContentCategoryId, DeploymentScheduleEntry[]>();

      payload.entries.forEach((entry) => {
        const existing = entriesByCategory.get(entry.categoryId) ?? [];
        entriesByCategory.set(entry.categoryId, [...existing, entry]);
      });

      return applyDeploymentToScheduleRows(current, entriesByCategory);
    });
  }, []);

  const applyRotationAssignments = useCallback((assignments: VideoAssignment[]) => {
    setRows((current) => applyVideoAssignmentsToSchedule(current, assignments));
  }, []);

  const resetSchedule = useCallback(() => {
    if (programs) {
      setRows(mapRotationProgramsToScheduleRows(programs));
      return;
    }
    setRows(createInitialRotationSchedule());
  }, [programs]);

  const value = useMemo(
    () => ({
      rows,
      programs,
      isLoading,
      isError,
      isEditing,
      setIsEditing,
      getRowByDay,
      updateDayRow,
      applyDeploymentToSchedule,
      applyRotationAssignments,
      resetSchedule,
    }),
    [
      rows,
      programs,
      isLoading,
      isError,
      isEditing,
      getRowByDay,
      updateDayRow,
      applyDeploymentToSchedule,
      applyRotationAssignments,
      resetSchedule,
    ],
  );

  return (
    <RotationScheduleContext.Provider value={value}>{children}</RotationScheduleContext.Provider>
  );
}

export function useRotationSchedule() {
  const context = useContext(RotationScheduleContext);
  if (!context) {
    throw new Error('useRotationSchedule must be used within RotationScheduleProvider');
  }
  return context;
}
