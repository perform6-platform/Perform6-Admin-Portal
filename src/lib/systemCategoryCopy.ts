import type { CategoryScope, DayPlaybackMode } from '../types/categories';

/** Display name overrides for system category slugs (API names stay unchanged). */
export const SYSTEM_CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  '15-minutes': 'Full Program (4-Zone)',
};

export function categoryDisplayName(slug: string, fallbackName: string): string {
  return SYSTEM_CATEGORY_DISPLAY_NAMES[slug] ?? fallbackName;
}

/** Table CONFIGURATION column — approved short labels. */
export function configurationColumnText(slug: string, scope: CategoryScope): string {
  switch (slug) {
    case 'default':
    case 'start-here':
      return 'Fitness / Golf';
    case 'phase-1':
      return 'Fitness (Wall / No Wall)\nGolf (Wall / No Wall)';
    case 'phase-2':
    case 'full-program':
      return 'Single Configuration';
    case '15-minutes':
      return 'Zone 1 / 2 / 3 / 4';
    default:
      return configurationScopeLabel(scope);
  }
}

/** Create-category / scope picker labels. */
export function configurationScopeLabel(scope: CategoryScope | string): string {
  switch (scope) {
    case 'GLOBAL':
      return 'Single Configuration';
    case 'BY_FIELD':
      return 'Fitness / Golf';
    case 'BY_FIELD_AND_VARIANT':
      return 'Fitness (Wall / No Wall), Golf (Wall / No Wall)';
    case 'BY_NAMED_PLAYLIST':
      return 'Four Independent Playlists';
    default:
      return String(scope);
  }
}

export function configurationScopeHelp(scope: CategoryScope | string): string {
  switch (scope) {
    case 'GLOBAL':
      return 'One shared playlist for the category.';
    case 'BY_FIELD':
      return 'Separate playlists for Fitness and Golf.';
    case 'BY_FIELD_AND_VARIANT':
      return 'Separate playlists for each combination.';
    case 'BY_NAMED_PLAYLIST':
      return 'Four independently assigned playlists for different content or deployment requirements.';
    default:
      return '';
  }
}

export function configurationScopePlaylistCount(scope: CategoryScope | string): string {
  switch (scope) {
    case 'GLOBAL':
      return '1 playlist';
    case 'BY_FIELD':
      return '2 playlists';
    case 'BY_FIELD_AND_VARIANT':
    case 'BY_NAMED_PLAYLIST':
      return '4 playlists';
    default:
      return '';
  }
}

/** System Category Details — configuration summary line. */
export function systemConfigurationDetail(slug: string): string {
  switch (slug) {
    case 'default':
    case 'start-here':
      return 'Fitness / Golf (2 playlists)';
    case 'phase-1':
      return 'Fitness (Wall / No Wall), Golf (Wall / No Wall) (4 playlists)';
    case 'phase-2':
    case 'full-program':
      return 'Single Configuration (1 playlist)';
    case '15-minutes':
      return 'Zone 1 / 2 / 3 / 4 (4 playlists)';
    default:
      return '';
  }
}

export function systemCategoryDescription(slug: string): string {
  switch (slug) {
    case 'default':
      return 'Background video for the touchscreen interface and default content that plays continuously on the main display until another experience is selected.';
    case 'start-here':
      return 'Perform6 introduction, Safety Check and pre-training preparation for Fitness and Golf.';
    case 'phase-1':
      return 'Mobility, Stability and Power training with Fitness (Wall/No Wall) and Golf (Wall/No Wall) configurations. 36-day rotation.';
    case 'phase-2':
      return 'Strength, Energy and Recovery training. 36-day rotation.';
    case 'full-program':
      return 'Complete 60-minute guided training program with user-controlled playback. 36-day rotation.';
    case '15-minutes':
      return 'Four independent 15-minute training zones, each following the 36-day rotation.';
    default:
      return '';
  }
}

export function systemPlaybackSupportingText(slug: string, mode: DayPlaybackMode): string {
  if (mode === 'ONCE' || slug === 'full-program') {
    return 'The selected daily program plays once when started by the user.';
  }
  switch (slug) {
    case 'default':
      return 'The assigned Default video repeats continuously until another experience begins.';
    case 'start-here':
      return 'The assigned video repeats continuously for up to 45 minutes, then returns to Home if no other selection is made.';
    case 'phase-1':
    case 'phase-2':
      return 'The assigned daily video repeats continuously for up to 45 minutes, then returns to Home if no other selection is made.';
    case '15-minutes':
      return 'The assigned daily video repeats independently in each zone until the next rotation day.';
    default:
      return 'The assigned video repeats continuously until the next scheduled content change.';
  }
}

/** Rotation page category descriptions. */
export function rotationCategoryDescription(slug: string | undefined): string | null {
  switch (slug) {
    case 'default':
      return 'Continuously plays the assigned background video behind the touchscreen interface and the assigned Default video on the Main Display until another experience begins.';
    case 'start-here':
      return 'The assigned video repeats continuously for up to 45 minutes, then returns to Home if no other selection is made.';
    case 'phase-1':
    case 'phase-2':
      return 'The assigned daily video repeats continuously for up to 45 minutes, then returns to Home if no other selection is made.';
    case 'full-program':
      return 'Plays the assigned daily guided training program once when started by the user, then returns to Home if no other selection is made. Supports Pause and Resume.';
    case '15-minutes':
      return 'Four independent zones, each playing its assigned 15-minute segment continuously until the next rotation day.';
    default:
      return null;
  }
}

export function rotationSecondaryInstruction(
  slug: string | undefined,
  usesRotation: boolean,
): string {
  if (slug === '15-minutes') {
    return 'Assign videos for each zone across the 36-day rotation.';
  }
  if (usesRotation) {
    return 'Assign videos to the 36-day rotation schedule.';
  }
  return 'Select one video for each configuration. The assigned video remains active until changed.';
}

export function rotationEmptyPlaylistMessage(playlistLabel: string): string {
  return `No videos available for ${playlistLabel}. Upload videos to the Content Library to begin assigning content.`;
}
