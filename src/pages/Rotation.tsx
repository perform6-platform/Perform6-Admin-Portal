import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RotationPhasePanel } from '../components/rotation/RotationPhasePanel';
import { GlobalRotationSettingsPanel } from '../components/rotation/GlobalRotationSettingsPanel';
import { Button, PageTitle } from '../components/ui';
import type { ContentCategoryId } from '../constants/contentPlayback';
import { useContent } from '../context/ContentContext';
import { useRotationSchedule } from '../context/RotationScheduleContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { usePatchRotationBulk, usePatchRotationProgram } from '../hooks/useRotation';
import { cn } from '../lib/cn';
import { buildContentCategoryGroups } from '../lib/contentCategoryGroups';
import {
  buildCustomProgramRotationPayload,
  buildRotationBulkPayload,
  filterAssignmentsForGroup,
  resolvePlaylistProgramId,
} from '../lib/rotationBulkPayload';
import { normalizeRotationPrograms } from '../lib/rotationMapper';
import {
  buildVideoAssignmentsFromPrograms,
  getVideoAssignmentKey,
  type VideoAssignment,
  type VideoAssignmentState,
} from '../lib/rotationAssignments';
import { getApiErrorMessage } from '../services/axios';
import type { RotationBulkSection } from '../types/rotation';

const ACTIVE_GROUP_STORAGE_KEY = 'perform6.rotation.activeGroupKey';

function readStoredGroupKey(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_GROUP_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredGroupKey(key: string) {
  try {
    sessionStorage.setItem(ACTIVE_GROUP_STORAGE_KEY, key);
  } catch {
    // ignore storage failures
  }
}

function assignmentsEqual(
  a: Record<string, VideoAssignmentState>,
  b: Record<string, VideoAssignmentState>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = a[key];
    const right = b[key];
    if (!left && !right) continue;
    if (!left || !right) return false;
    if (left.included !== right.included) return false;
    if ((left.day ?? null) !== (right.day ?? null)) return false;
  }
  return true;
}

export default function Rotation() {
  const navigate = useNavigate();
  const { getVideosByCategory, items } = useContent();
  const { programs, applyRotationAssignments } = useRotationSchedule();
  const { showToast } = useToast();
  const { data: apiCategories = [] } = useCategories();
  const categoryGroups = useMemo(
    () => buildContentCategoryGroups(apiCategories),
    [apiCategories],
  );
  const { mutateAsync: patchBulk, isPending: isSavingBulk } = usePatchRotationBulk();
  const { mutateAsync: patchProgram, isPending: isSavingProgram } = usePatchRotationProgram();
  const isSaving = isSavingBulk || isSavingProgram;
  const [activeGroupKey, setActiveGroupKey] = useState<string>(
    () => readStoredGroupKey() ?? 'default',
  );
  const [assignments, setAssignments] = useState<Record<string, VideoAssignmentState>>({});
  const [savedBaseline, setSavedBaseline] = useState<Record<string, VideoAssignmentState>>({});
  const skipNextProgramsSyncRef = useRef(false);

  const isDirty = useMemo(
    () => !assignmentsEqual(assignments, savedBaseline),
    [assignments, savedBaseline],
  );

  useEffect(() => {
    if (!programs) return;
    if (skipNextProgramsSyncRef.current) {
      skipNextProgramsSyncRef.current = false;
      return;
    }
    if (!Array.isArray(programs) && normalizeRotationPrograms(programs).length === 0) return;
    const next = buildVideoAssignmentsFromPrograms(programs, getVideosByCategory);
    setAssignments(next);
    setSavedBaseline(next);
  }, [programs, getVideosByCategory]);

  useEffect(() => {
    if (categoryGroups.some((group) => group.groupKey === activeGroupKey)) {
      writeStoredGroupKey(activeGroupKey);
      return;
    }
    const stored = readStoredGroupKey();
    if (stored && categoryGroups.some((group) => group.groupKey === stored)) {
      setActiveGroupKey(stored);
      return;
    }
    if (categoryGroups[0]) setActiveGroupKey(categoryGroups[0].groupKey);
  }, [categoryGroups, activeGroupKey]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const activeGroup = useMemo(
    () => categoryGroups.find((group) => group.groupKey === activeGroupKey),
    [activeGroupKey, categoryGroups],
  );

  const confirmLeaveIfDirty = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(
      'You have unsaved rotation changes. Leave this page without saving?',
    );
  }, [isDirty]);

  const selectGroup = useCallback(
    (groupKey: string) => {
      if (groupKey === activeGroupKey) return;
      if (!confirmLeaveIfDirty()) return;
      setActiveGroupKey(groupKey);
      writeStoredGroupKey(groupKey);
    },
    [activeGroupKey, confirmLeaveIfDirty],
  );

  const handleAssignmentChange = useCallback(
    (categoryId: ContentCategoryId, videoTitle: string, next: VideoAssignmentState) => {
      const key = getVideoAssignmentKey(categoryId, videoTitle);

      setAssignments((current) => {
        const updated = { ...current, [key]: next };

        if (next.included && !usesRotationCategory(categoryId, categoryGroups)) {
          Object.keys(updated).forEach((assignmentKey) => {
            if (assignmentKey.startsWith(`${categoryId}::`) && assignmentKey !== key) {
              updated[assignmentKey] = { ...updated[assignmentKey]!, included: false };
            }
          });
        }

        // One video per rotation day within a playlist.
        if (next.included && usesRotationCategory(categoryId, categoryGroups)) {
          Object.keys(updated).forEach((assignmentKey) => {
            if (!assignmentKey.startsWith(`${categoryId}::`) || assignmentKey === key) return;
            const other = updated[assignmentKey];
            if (other?.included && other.day === next.day) {
              updated[assignmentKey] = { ...other, included: false };
            }
          });
        }

        return updated;
      });
    },
    [categoryGroups],
  );

  async function handleSave() {
    if (!activeGroup) return;

    const videoAssignments: VideoAssignment[] = Object.entries(assignments).map(
      ([key, state]) => {
        const separatorIndex = key.indexOf('::');
        const categoryId = key.slice(0, separatorIndex) as ContentCategoryId;
        const title = key.slice(separatorIndex + 2);
        return { categoryId, videoTitle: title, ...state };
      },
    );

    const sectionAssignments = filterAssignmentsForGroup(activeGroup, videoAssignments);
    applyRotationAssignments(sectionAssignments);

    try {
      skipNextProgramsSyncRef.current = true;

      const saveViaPrograms =
        !activeGroup.isSystem || activeGroup.playbackCategory === 'custom';

      if (saveViaPrograms) {
        for (const child of activeGroup.children) {
          const programId = resolvePlaylistProgramId(activeGroup, child.id);
          if (!programId) continue;
          const payload = buildCustomProgramRotationPayload(
            child.id,
            sectionAssignments,
            items,
          );
          await patchProgram({ programId, payload });
        }
      } else {
        const section = activeGroup.playbackCategory as RotationBulkSection;
        const payload = buildRotationBulkPayload(
          section,
          sectionAssignments,
          items,
          categoryGroups,
        );
        if (payload.libraries.length === 0) {
          throw new Error(
            'No libraries found for this section. Check category configuration.',
          );
        }
        await patchBulk({ section, payload });
      }

      setSavedBaseline(assignments);
      showToast({
        title: 'Rotation saved',
        message: `${activeGroup.label} synced to the backend.`,
        variant: 'success',
      });
    } catch (error) {
      skipNextProgramsSyncRef.current = false;
      showToast({
        title: getApiErrorMessage(error, 'Failed to save rotation'),
        message: 'Local schedule was updated, but the backend sync failed.',
        variant: 'error',
      });
    }
  }

  if (!activeGroup) {
    return (
      <div className="space-y-4">
        <PageTitle>Rotation</PageTitle>
        <p className="text-body-sm text-content-muted">Loading categories…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <PageTitle>Rotation</PageTitle>
          <p className="mt-1 text-body-sm text-content-secondary">
            Select a category to manage its content assignments and 36-day rotation schedule.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="h-9 w-full gap-2 px-4 sm:w-auto"
          onClick={() => {
            if (!confirmLeaveIfDirty()) return;
            navigate('/rotation-schedule');
          }}
        >
          <CalendarDays className="h-4 w-4" />
          View Schedule
        </Button>
      </div>

      <GlobalRotationSettingsPanel />

      <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2 hide-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
        {categoryGroups.map((group) => (
          <button
            key={group.groupKey}
            type="button"
            onClick={() => selectGroup(group.groupKey)}
            className={cn(
              'shrink-0 rounded-lg border px-4 py-2 text-body-sm font-medium transition-colors',
              activeGroupKey === group.groupKey
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                : 'border-surface-border bg-surface-muted text-content-secondary hover:text-content-primary',
            )}
          >
            {group.label}
          </button>
        ))}
      </div>

      <RotationPhasePanel
        group={activeGroup}
        assignments={assignments}
        isSaving={isSaving}
        onSave={() => void handleSave()}
        onAssignmentChange={handleAssignmentChange}
      />
    </div>
  );
}

function usesRotationCategory(
  categoryId: ContentCategoryId,
  groups: ReturnType<typeof buildContentCategoryGroups>,
): boolean {
  const group = groups.find((entry) =>
    entry.children.some((child) => child.id === categoryId),
  );
  if (!group) return true;
  return (
    group.playbackCategory === 'phase-1' ||
    group.playbackCategory === 'phase-2' ||
    group.playbackCategory === 'full-program' ||
    group.playbackCategory === 'custom' ||
    group.slug === '15-minutes'
  );
}
