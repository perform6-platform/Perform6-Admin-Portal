import { useMemo } from 'react';
import type { CategoryGroup } from '../../constants/contentPlayback';
import { getPlaybackCategoryForContent, getPlaybackRule } from '../../constants/contentPlayback';
import type { ContentCategoryId } from '../../constants/contentPlayback';
import { useContent } from '../../context/ContentContext';
import { usesRotationForPlayback } from '../../lib/deploymentHelpers';
import {
  getVideoAssignmentKey,
  type VideoAssignmentState,
} from '../../lib/rotationAssignments';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS } from '../ui/cardStyles';
import { EmptyState, SectionLabel } from '../ui';
import { RotationVideoCard } from './RotationVideoCard';

interface RotationPhasePanelProps {
  group: CategoryGroup;
  assignments: Record<string, VideoAssignmentState>;
  onAssignmentChange: (
    categoryId: ContentCategoryId,
    videoTitle: string,
    next: VideoAssignmentState,
  ) => void;
}

export function RotationPhasePanel({
  group,
  assignments,
  onAssignmentChange,
}: RotationPhasePanelProps) {
  const { getVideosByCategory } = useContent();
  const rule = getPlaybackRule(group.playbackCategory);
  const usesRotation = usesRotationForPlayback(group.playbackCategory);

  const categorySections = useMemo(
    () =>
      group.children.map((category) => ({
        category,
        videos: getVideosByCategory(category.id),
      })),
    [getVideosByCategory, group.children],
  );

  const totalVideos = categorySections.reduce((sum, section) => sum + section.videos.length, 0);

  if (totalVideos === 0) {
    return (
      <EmptyState message="No videos in this phase — upload in Content Library, then assign days here." />
    );
  }

  return (
    <div className="space-y-4">
      <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
        <SectionLabel className="mb-1 block">{group.label}</SectionLabel>
        <p className="text-body-sm text-content-secondary">{rule.behavior}</p>
        <p className="mt-2 text-caption text-content-muted">
          {usesRotation
            ? `Select which videos play on each day of the ${rule.usesRotation ? '36' : ''}-day rotation.`
            : 'Choose one video — or leave none selected to remove it from the schedule. Selected video plays on all days.'}
        </p>
      </section>

      {categorySections.map(({ category, videos }) => {
        const categoryUsesRotation =
          group.playbackCategory === 'custom'
            ? true
            : usesRotationForPlayback(getPlaybackCategoryForContent(category.id));

        return (
          <section key={category.id} className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
            {group.children.length > 1 && (
              <SectionLabel className="mb-4 block">{category.label}</SectionLabel>
            )}

            {videos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-surface-border px-4 py-6 text-center text-body-sm text-content-muted">
                No videos uploaded for {category.label}. Add content in Content Library first.
              </p>
            ) : (
              <ul className="grid gap-2 lg:grid-cols-2">
                {videos.map((video) => {
                  const key = getVideoAssignmentKey(category.id, video.title);
                  const assignment = assignments[key] ?? { included: false, day: video.rotationDay ?? 1 };

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
            )}
          </section>
        );
      })}
    </div>
  );
}
