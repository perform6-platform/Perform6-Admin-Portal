import { useMemo } from 'react';
import { CalendarDays, Save } from 'lucide-react';
import type { CategoryGroup } from '../../constants/contentPlayback';
import { getPlaybackCategoryForContent, ROTATION_DAYS } from '../../constants/contentPlayback';
import type { ContentCategoryId } from '../../constants/contentPlayback';
import { useContent } from '../../context/ContentContext';
import { usesRotationForPlayback } from '../../lib/deploymentHelpers';
import {
  getVideoAssignmentKey,
  type VideoAssignmentState,
} from '../../lib/rotationAssignments';
import {
  rotationCategoryDescription,
  rotationEmptyPlaylistMessage,
  rotationSecondaryInstruction,
} from '../../lib/systemCategoryCopy';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS } from '../ui/cardStyles';
import { Button, EmptyState, SectionLabel } from '../ui';
import { RotationVideoCard } from './RotationVideoCard';

interface RotationPhasePanelProps {
  group: CategoryGroup;
  assignments: Record<string, VideoAssignmentState>;
  isSaving?: boolean;
  onSave?: () => void;
  onViewSchedule?: () => void;
  onAssignmentChange: (
    categoryId: ContentCategoryId,
    videoTitle: string,
    next: VideoAssignmentState,
  ) => void;
}

function playlistHeading(label: string, description?: string): string {
  if (!description) return label;
  return `${label} (${description})`;
}

function unassignedDays(
  assignments: Record<string, VideoAssignmentState>,
  categoryId: ContentCategoryId,
  videoTitles: string[],
): number[] {
  const used = new Set<number>();
  for (const title of videoTitles) {
    const state = assignments[getVideoAssignmentKey(categoryId, title)];
    if (state?.included && state.day != null) used.add(state.day);
  }
  const missing: number[] = [];
  for (let day = 1; day <= ROTATION_DAYS; day += 1) {
    if (!used.has(day)) missing.push(day);
  }
  return missing;
}

export function RotationPhasePanel({
  group,
  assignments,
  isSaving = false,
  onSave,
  onViewSchedule,
  onAssignmentChange,
}: RotationPhasePanelProps) {
  const { getVideosByCategory } = useContent();
  const usesRotation =
    group.playbackCategory === 'custom' ||
    group.slug === '15-minutes' ||
    usesRotationForPlayback(group.playbackCategory);

  const categorySections = useMemo(
    () =>
      group.children.map((category) => {
        const videos = [...getVideosByCategory(category.id)].sort((a, b) => {
          const keyA = getVideoAssignmentKey(category.id, a.title);
          const keyB = getVideoAssignmentKey(category.id, b.title);
          const dayA = assignments[keyA]?.included
            ? (assignments[keyA]?.day ?? Number.POSITIVE_INFINITY)
            : Number.POSITIVE_INFINITY;
          const dayB = assignments[keyB]?.included
            ? (assignments[keyB]?.day ?? Number.POSITIVE_INFINITY)
            : Number.POSITIVE_INFINITY;
          if (dayA !== dayB) return dayA - dayB;
          const fallbackA = a.rotationDay ?? Number.POSITIVE_INFINITY;
          const fallbackB = b.rotationDay ?? Number.POSITIVE_INFINITY;
          if (fallbackA !== fallbackB) return fallbackA - fallbackB;
          return a.title.localeCompare(b.title);
        });
        return { category, videos };
      }),
    [assignments, getVideosByCategory, group.children],
  );

  const totalVideos = categorySections.reduce((sum, section) => sum + section.videos.length, 0);
  const description =
    rotationCategoryDescription(group.slug) ??
    (group.slug === '15-minutes'
      ? 'Four independent zones, each playing its assigned 15-minute segment continuously until the next rotation day.'
      : null);
  const secondary = rotationSecondaryInstruction(group.slug, usesRotation);

  if (totalVideos === 0) {
    return (
      <div className="space-y-4">
        <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SectionLabel className="mb-1 block">{group.label}</SectionLabel>
              {description ? (
                <p className="text-body-sm text-content-secondary">{description}</p>
              ) : null}
              <p className="mt-2 text-caption text-content-muted">{secondary}</p>
            </div>
            {onSave || onViewSchedule ? (
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {onViewSchedule ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="h-9 w-full gap-2 px-4 sm:w-auto"
                    onClick={onViewSchedule}
                  >
                    <CalendarDays className="h-4 w-4" />
                    View Schedule
                  </Button>
                ) : null}
                {onSave ? (
                  <Button
                    type="button"
                    size="md"
                    className="h-9 w-full gap-2 px-4 sm:w-auto"
                    disabled={isSaving}
                    onClick={onSave}
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving…' : `Save ${group.label}`}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
        <EmptyState message={rotationEmptyPlaylistMessage(group.label)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <SectionLabel className="mb-1 block">{group.label}</SectionLabel>
            {description ? (
              <p className="text-body-sm text-content-secondary">{description}</p>
            ) : null}
            <p className="mt-2 text-caption text-content-muted">{secondary}</p>
          </div>
          {onSave || onViewSchedule ? (
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {onViewSchedule ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="h-9 w-full gap-2 px-4 sm:w-auto"
                  onClick={onViewSchedule}
                >
                  <CalendarDays className="h-4 w-4" />
                  View Schedule
                </Button>
              ) : null}
              {onSave ? (
                <Button
                  type="button"
                  size="md"
                  className="h-9 w-full gap-2 px-4 sm:w-auto"
                  disabled={isSaving}
                  onClick={onSave}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : `Save ${group.label}`}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {categorySections.map(({ category, videos }) => {
        const categoryUsesRotation =
          group.playbackCategory === 'custom' || group.slug === '15-minutes'
            ? true
            : usesRotationForPlayback(getPlaybackCategoryForContent(category.id));

        const heading =
          group.children.length > 1
            ? playlistHeading(category.label, category.description).toUpperCase()
            : null;

        const missing =
          categoryUsesRotation && videos.length > 0
            ? unassignedDays(
                assignments,
                category.id,
                videos.map((video) => video.title),
              )
            : [];

        return (
          <section key={category.id} className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
            {heading ? <SectionLabel className="mb-4 block">{heading}</SectionLabel> : null}

            {videos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-surface-border px-4 py-6 text-center text-body-sm text-content-muted">
                {rotationEmptyPlaylistMessage(heading ?? category.label)}
              </p>
            ) : (
              <>
                {categoryUsesRotation && missing.length > 0 ? (
                  <p className="mb-3 text-caption text-content-muted">
                    Unassigned rotation days:{' '}
                    {missing.length <= 12
                      ? missing.map((day) => `Day ${day}`).join(', ')
                      : `${missing.length} of ${ROTATION_DAYS} days`}
                  </p>
                ) : null}
                <ul className="grid gap-2 lg:grid-cols-2">
                  {videos.map((video) => {
                    const key = getVideoAssignmentKey(category.id, video.title);
                    const assignment = assignments[key] ?? {
                      included: false,
                      day: video.rotationDay ?? 1,
                    };

                    return (
                      <RotationVideoCard
                        key={video.id}
                        video={video}
                        categoryId={category.id}
                        usesRotation={categoryUsesRotation}
                        assignment={assignment}
                        onChange={(next) => onAssignmentChange(category.id, video.title, next)}
                      />
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
