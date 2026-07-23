import type { ContentItem } from '../constants/contentLibrary';
import {
  allContentCategories,
  deploymentTrackOptions,
  getFullCategoryLabel,
  getPlaybackCategoryForContent,
  getPlaybackRule,
  playbackRules,
  ROTATION_DAYS,
  type ContentCategoryId,
  type ContentTrack,
  type PlaybackCategoryId,
} from '../constants/contentPlayback';
import type { RotationScheduleRow } from '../constants/rotationSchedule';
import { getScheduledVideosForCategory } from './rotationAssignments';

export type DeploymentMode = 'touch-screen' | 'default';
export type ExerciseVariation = 'wall' | 'no-wall';
export type ContentWizardStepKind = 'type' | 'category' | 'variation' | 'program';

export const deploymentModeOptions = [
  { value: 'touch-screen' as const, label: 'Touch Screen' },
  { value: 'default' as const, label: 'Default' },
];

export const contentTrackOptions = [
  { value: 'fitness' as const, label: 'Fitness' },
  { value: 'golf' as const, label: 'Golf' },
];

export const exerciseVariationOptions = [
  { value: 'wall' as const, label: 'Wall' },
  { value: 'no-wall' as const, label: 'No Wall' },
];

export const defaultModeProgramOptions = playbackRules
  .filter((rule) => rule.categoryId !== 'full-program')
  .map((rule) => ({ value: rule.categoryId, label: rule.label }));

export const touchScreenProgramOptions = playbackRules.map((rule) => ({
  value: rule.categoryId,
  label: rule.label,
}));

export function getContentWizardSteps(_mode: DeploymentMode): ContentWizardStepKind[] {
  return ['type', 'category', 'variation'];
}

export const touchScreenBundlePlaybackCategories: PlaybackCategoryId[] = [
  'default',
  'start-here',
  'phase-1',
  'phase-2',
  'full-program',
];

export const defaultModeBundlePlaybackCategories: PlaybackCategoryId[] = [
  'default',
  'start-here',
  'phase-1',
  'phase-2',
];

export function getDeploymentBundlePlaybackCategories(mode: DeploymentMode): PlaybackCategoryId[] {
  return mode === 'touch-screen'
    ? touchScreenBundlePlaybackCategories
    : defaultModeBundlePlaybackCategories;
}

export function getDeploymentBundleCategoryIds(
  track: ContentTrack,
  variation: ExerciseVariation,
  mode: DeploymentMode,
): ContentCategoryId[] {
  return getDeploymentBundlePlaybackCategories(mode).map((playbackCategory) =>
    resolveDeploymentCategoryId(playbackCategory, track, variation),
  );
}

/** @deprecated use getDeploymentBundleCategoryIds */
export function getTouchScreenBundleCategoryIds(
  track: ContentTrack,
  variation: ExerciseVariation,
): ContentCategoryId[] {
  return getDeploymentBundleCategoryIds(track, variation, 'touch-screen');
}

export function resolveDeploymentCategoryId(
  playbackCategory: PlaybackCategoryId,
  track: ContentTrack,
  variation: ExerciseVariation,
): ContentCategoryId {
  switch (playbackCategory) {
    case 'default':
      return track === 'fitness' ? 'default-fitness' : 'default-golf';
    case 'start-here':
      return track === 'fitness' ? 'start-here-fitness' : 'start-here-golf';
    case 'phase-1':
      if (track === 'fitness' && variation === 'wall') return 'phase-1-fitness-wall';
      if (track === 'fitness' && variation === 'no-wall') return 'phase-1-fitness-no-wall';
      if (track === 'golf' && variation === 'wall') return 'phase-1-golf-wall';
      return 'phase-1-golf-no-wall';
    case 'phase-2':
      return 'phase-2';
    case 'full-program':
      return 'full-program';
    default:
      return 'default-fitness';
  }
}

export function getDeploymentModeLabel(mode: DeploymentMode): string {
  return deploymentModeOptions.find((option) => option.value === mode)?.label ?? mode;
}

export function getContentTrackLabel(track: ContentTrack): string {
  return contentTrackOptions.find((option) => option.value === track)?.label ?? track;
}

export function getExerciseVariationLabel(variation: ExerciseVariation): string {
  return exerciseVariationOptions.find((option) => option.value === variation)?.label ?? variation;
}

export function getPlaybackCategoryLabel(categoryId: PlaybackCategoryId): string {
  return playbackRules.find((rule) => rule.categoryId === categoryId)?.label ?? categoryId;
}

export function getContentWizardStepLabel(step: ContentWizardStepKind): string {
  switch (step) {
    case 'type':
      return 'Deployment Type';
    case 'category':
      return 'Select Category';
    case 'variation':
      return 'Exercise Variation';
    case 'program':
      return 'Select Program';
    default:
      return step;
  }
}

export type ScheduleWizardStepKind = 'category' | 'variation' | 'program' | 'video';

export function getScheduleWizardSteps(
  playbackCategory?: PlaybackCategoryId,
): ScheduleWizardStepKind[] {
  const steps: ScheduleWizardStepKind[] = ['category', 'program'];
  if (playbackCategory === 'phase-1') {
    steps.push('variation');
  }
  steps.push('video');
  return steps;
}

export function getScheduleWizardStepLabel(step: ScheduleWizardStepKind): string {
  switch (step) {
    case 'category':
      return 'Select Category';
    case 'variation':
      return 'Exercise Variation';
    case 'program':
      return 'Select Program';
    case 'video':
      return 'Schedule Video';
    default:
      return step;
  }
}

export function getContentTrackFromCategoryId(categoryId: ContentCategoryId): ContentTrack {
  return categoryId.includes('golf') ? 'golf' : 'fitness';
}

export function getExerciseVariationFromCategoryId(categoryId: ContentCategoryId): ExerciseVariation {
  return categoryId.includes('no-wall') ? 'no-wall' : 'wall';
}

export interface DeploymentVideoEntry {
  day: number;
  title: string;
  video?: ContentItem;
  categoryId?: ContentCategoryId;
  programLabel?: string;
  usesRotation?: boolean;
}

export function usesRotationForPlayback(playbackCategory: PlaybackCategoryId): boolean {
  return getPlaybackRule(playbackCategory).usesRotation;
}

function inferRotationDayFromVideo(video: ContentItem): number {
  if (video.rotationDay && video.rotationDay >= 1 && video.rotationDay <= ROTATION_DAYS) {
    return video.rotationDay;
  }

  const dayPaddedMatch = video.title.match(/(?:^|_)(\d{2})(?:_|\.)/);
  if (dayPaddedMatch) {
    const day = Number.parseInt(dayPaddedMatch[1]!, 10);
    if (day >= 1 && day <= ROTATION_DAYS) return day;
  }

  const dayMatch = video.title.toUpperCase().match(/DAY\s*(\d+)/);
  if (dayMatch) {
    const day = Number.parseInt(dayMatch[1]!, 10);
    if (day >= 1 && day <= ROTATION_DAYS) return day;
  }

  return 1;
}

export function getDeploymentVideos(
  categoryId: ContentCategoryId,
  playbackCategory: PlaybackCategoryId,
  getVideosByCategory: (id: ContentCategoryId) => ContentItem[],
  scheduleRows?: RotationScheduleRow[],
): DeploymentVideoEntry[] {
  if (scheduleRows) {
    const usesRotation = usesRotationForPlayback(playbackCategory);
    return getScheduledVideosForCategory(scheduleRows, categoryId, getVideosByCategory).map(
      ({ video, day }) => ({
        day,
        title: video.title,
        video,
        usesRotation,
      }),
    );
  }

  const libraryVideos = getVideosByCategory(categoryId);

  if (!usesRotationForPlayback(playbackCategory)) {
    return libraryVideos.map((video) => ({
      day: 1,
      title: video.title,
      video,
      usesRotation: false,
    }));
  }

  return libraryVideos.map((video) => ({
    day: inferRotationDayFromVideo(video),
    title: video.title,
    video,
    usesRotation: true,
  }));
}

export function getDeploymentBundleVideos(
  track: ContentTrack,
  variation: ExerciseVariation,
  mode: DeploymentMode,
  getVideosByCategory: (id: ContentCategoryId) => ContentItem[],
  scheduleRows?: RotationScheduleRow[],
): DeploymentVideoEntry[] {
  return getDeploymentBundleCategoryIds(track, variation, mode).flatMap((categoryId) => {
    const playbackCategory = getPlaybackCategoryForContent(categoryId);
    const programLabel = getFullCategoryLabel(categoryId);

    return getDeploymentVideos(
      categoryId,
      playbackCategory,
      getVideosByCategory,
      scheduleRows,
    ).map((entry) => ({
      ...entry,
      categoryId,
      programLabel,
    }));
  });
}

/** @deprecated use getDeploymentBundleVideos */
export function getTouchScreenBundleVideos(
  track: ContentTrack,
  variation: ExerciseVariation,
  getVideosByCategory: (id: ContentCategoryId) => ContentItem[],
): DeploymentVideoEntry[] {
  return getDeploymentBundleVideos(track, variation, 'touch-screen', getVideosByCategory);
}

export function buildDeploymentBundleSchedule(track: ContentTrack, mode: DeploymentMode): string {
  if (mode === 'touch-screen') {
    return `${getContentTrackLabel(track)} · Default, Start Here, Phase 1, Phase 2, Full Program`;
  }
  return `${getContentTrackLabel(track)} · Default, Start Here, Phase 1, Phase 2`;
}

export function buildDeploymentBundleName(track: ContentTrack, mode: DeploymentMode): string {
  if (mode === 'touch-screen') {
    return `${getContentTrackLabel(track)} Touch Screen Deployment`;
  }
  return `${getContentTrackLabel(track)} Default Deployment`;
}

/** @deprecated use buildDeploymentBundleSchedule */
export function buildTouchScreenBundleSchedule(track: ContentTrack): string {
  return buildDeploymentBundleSchedule(track, 'touch-screen');
}

/** @deprecated use buildDeploymentBundleName */
export function buildTouchScreenBundleName(track: ContentTrack): string {
  return buildDeploymentBundleName(track, 'touch-screen');
}

export function bundleEntriesToContentItems(entries: DeploymentVideoEntry[]): ContentItem[] {
  return entries.map((entry, index) => {
    const categoryId = entry.categoryId ?? 'default-fitness';
    if (entry.video) {
      return { ...entry.video, id: `${categoryId}-${entry.day}-${index}` };
    }
    return {
      id: `bundle-${categoryId}-${entry.day}-${index}`,
      title: entry.title,
      mediaType: 'video' as const,
      categoryId,
      rotationDay: entry.day,
      duration: undefined,
      dateLabel: '',
      format: 'MP4',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=480&h=270&fit=crop',
    };
  });
}

export function countBundlePrograms(entries: DeploymentVideoEntry[]): number {
  return new Set(entries.map((entry) => entry.categoryId).filter(Boolean)).size;
}

export function isDeploymentEntryUploaded(entry: DeploymentVideoEntry): boolean {
  return Boolean(entry.video);
}

export function countUploadedDeploymentEntries(entries: DeploymentVideoEntry[]): number {
  return entries.filter(isDeploymentEntryUploaded).length;
}

export function deploymentEntriesToContentItems(
  entries: DeploymentVideoEntry[],
  categoryId: ContentCategoryId,
): ContentItem[] {
  return entries.map((entry, index) => {
    if (entry.video) return entry.video;
    return {
      id: `deployment-entry-${index}`,
      title: entry.title,
      mediaType: 'video' as const,
      categoryId,
      rotationDay: entry.day,
      duration: undefined,
      dateLabel: '',
      format: 'MP4',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=480&h=270&fit=crop',
    };
  });
}

export function buildDeploymentContentSchedule(
  programTypeLabel: string,
  usesRotation: boolean,
): string {
  if (usesRotation) {
    return `${ROTATION_DAYS}-Day Rotation · ${programTypeLabel}`;
  }
  return programTypeLabel;
}

export function buildDeploymentNameFromProgram(
  programTypeLabel: string,
  usesRotation: boolean,
): string {
  if (usesRotation) {
    return `${programTypeLabel} Rotation Update`;
  }
  return `${programTypeLabel} Update`;
}

export const deploymentSteps = [
  { id: 1, label: 'Select Content' },
  { id: 2, label: 'Deployment Settings' },
  { id: 3, label: 'Review & Deploy' },
] as const;

export const deploymentDayOptions = Array.from({ length: 36 }, (_, index) => {
  const day = index + 1;
  return { value: `day-${day}`, label: `Day ${day}` };
});

export function getCategoryLabel(categoryId: string): string {
  return allContentCategories.find((category) => category.id === categoryId)?.label ?? categoryId;
}

export function getDeploymentTrackLabel(track: string): string {
  return deploymentTrackOptions.find((option) => option.value === track)?.label ?? track;
}

export function formatProgramTypeLabel(label: string): string {
  return label.replace('(', '- ').replace(')', '');
}

function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  return 0;
}

export function formatVideosDuration(videos: ContentItem[]): string {
  const totalSeconds = videos.reduce(
    (sum, video) => sum + parseDurationToSeconds(video.duration ?? '0:00'),
    0,
  );

  if (totalSeconds === 0) return '—';
  const minutes = Math.max(1, Math.ceil(totalSeconds / 60));
  return `~${minutes} min`;
}

export function formatDeploymentTimestamp(date = new Date()): string {
  return date
    .toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', '');
}

export function buildDeploymentName(programLabel: string, dayLabel: string): string {
  return `${dayLabel} ${programLabel} Update`;
}
