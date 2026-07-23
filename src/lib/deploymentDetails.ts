import type { ContentCategoryId, ContentTrack } from '../constants/contentPlayback';
import type { ContentItem } from '../constants/contentLibrary';
import type { Deployment, DeploymentScheduleEntry } from '../constants/deployments';
import { currentRotationDay } from '../constants/rotationSchedule';
import {
  getDeploymentBundleVideos,
  resolveDeploymentCategoryId,
  type DeploymentMode,
  type ExerciseVariation,
} from './deploymentHelpers';

type DeploymentScope = 'bundle' | 'start-here' | 'phase-1' | 'full-program' | 'single-day';

interface InferredDeploymentProfile {
  mode: DeploymentMode;
  track: ContentTrack;
  variation: ExerciseVariation;
  categoryId: ContentCategoryId;
  scope: DeploymentScope;
  focusDay: number;
}

/** Prefer wired content library (empty if not yet loaded in this helper context). */
function getVideosByCategory(_categoryId: ContentCategoryId): ContentItem[] {
  return [];
}

function parseFocusDay(deployment: Deployment): number {
  if (deployment.rotationDay) return deployment.rotationDay;

  const match =
    deployment.contentSchedule.match(/Day\s*(\d+)/i) ??
    deployment.name.match(/Day\s*(\d+)/i);

  return match ? Number.parseInt(match[1]!, 10) : currentRotationDay;
}

function inferDeploymentProfile(deployment: Deployment): InferredDeploymentProfile {
  const name = deployment.name.toLowerCase();
  const focusDay = parseFocusDay(deployment);

  if (deployment.deploymentMode && deployment.categoryId) {
    return {
      mode: deployment.deploymentMode,
      track: deployment.categoryId.includes('golf') ? 'golf' : 'fitness',
      variation: deployment.categoryId.includes('no-wall') ? 'no-wall' : 'wall',
      categoryId: deployment.categoryId,
      scope: deployment.isBundleDeployment ? 'bundle' : 'single-day',
      focusDay: deployment.rotationDay ?? focusDay,
    };
  }

  if (name.includes('default deployment')) {
    return {
      mode: 'default',
      track: 'fitness',
      variation: 'wall',
      categoryId: 'default-fitness',
      scope: 'bundle',
      focusDay,
    };
  }

  if (name.includes('start here')) {
    return {
      mode: 'default',
      track: 'fitness',
      variation: 'wall',
      categoryId: 'start-here-fitness',
      scope: 'start-here',
      focusDay,
    };
  }

  if (name.includes('phase 1')) {
    return {
      mode: 'touch-screen',
      track: 'fitness',
      variation: 'wall',
      categoryId: 'phase-1-fitness-wall',
      scope: 'phase-1',
      focusDay,
    };
  }

  if (
    name.includes('full program') ||
    name.includes('team training') ||
    name.includes('full deploy')
  ) {
    return {
      mode: 'touch-screen',
      track: 'fitness',
      variation: 'wall',
      categoryId: 'full-program',
      scope: 'full-program',
      focusDay,
    };
  }

  if (deployment.contentSchedule.toLowerCase().includes('start here')) {
    return {
      mode: 'default',
      track: 'fitness',
      variation: 'wall',
      categoryId: 'start-here-fitness',
      scope: 'start-here',
      focusDay,
    };
  }

  return {
    mode: 'touch-screen',
    track: 'fitness',
    variation: 'wall',
    categoryId: 'default-fitness',
    scope: deployment.contentSchedule.match(/Day\s*\d+/i) ? 'single-day' : 'bundle',
    focusDay,
  };
}

function buildScheduleEntries(profile: InferredDeploymentProfile): DeploymentScheduleEntry[] {
  const bundleEntries = getDeploymentBundleVideos(
    profile.track,
    profile.variation,
    profile.mode,
    getVideosByCategory,
  );

  const toScheduleEntry = (entry: (typeof bundleEntries)[number]): DeploymentScheduleEntry => ({
    day: entry.day,
    videoTitle: entry.title,
    categoryId: entry.categoryId ?? profile.categoryId,
  });

  switch (profile.scope) {
    case 'start-here':
      return bundleEntries
        .filter((entry) => entry.categoryId === resolveDeploymentCategoryId('start-here', profile.track, profile.variation))
        .map(toScheduleEntry);
    case 'phase-1':
      return bundleEntries
        .filter((entry) => entry.categoryId === resolveDeploymentCategoryId('phase-1', profile.track, profile.variation))
        .map(toScheduleEntry);
    case 'full-program':
      return bundleEntries
        .filter((entry) => entry.categoryId === 'full-program')
        .map(toScheduleEntry);
    case 'single-day':
      return bundleEntries
        .filter((entry) => {
          const playbackCategory = entry.categoryId;
          if (!playbackCategory) return false;
          const isStatic =
            playbackCategory === resolveDeploymentCategoryId('default', profile.track, profile.variation) ||
            playbackCategory === resolveDeploymentCategoryId('start-here', profile.track, profile.variation);
          return isStatic || entry.day === profile.focusDay;
        })
        .map(toScheduleEntry);
    case 'bundle':
    default:
      return bundleEntries.map(toScheduleEntry);
  }
}

export function enrichDeploymentDetails(deployment: Deployment): Deployment {
  if (
    deployment.deploymentMode &&
    deployment.categoryId &&
    deployment.scheduleEntries &&
    deployment.scheduleEntries.length > 0
  ) {
    return deployment;
  }

  const profile = inferDeploymentProfile(deployment);
  const scheduleEntries =
    deployment.scheduleEntries && deployment.scheduleEntries.length > 0
      ? deployment.scheduleEntries
      : buildScheduleEntries(profile);

  return {
    ...deployment,
    categoryId: deployment.categoryId ?? profile.categoryId,
    deploymentMode: deployment.deploymentMode ?? profile.mode,
    isBundleDeployment: deployment.isBundleDeployment ?? profile.scope === 'bundle',
    usesRotation: deployment.usesRotation ?? profile.scope !== 'start-here',
    rotationDay: deployment.rotationDay ?? profile.focusDay,
    scheduleEntries,
  };
}
