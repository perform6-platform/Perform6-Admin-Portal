export type SystemContentCategoryId =
  | 'default-fitness'
  | 'default-golf'
  | 'start-here-fitness'
  | 'start-here-golf'
  | 'phase-1-fitness-wall'
  | 'phase-1-fitness-no-wall'
  | 'phase-1-golf-wall'
  | 'phase-1-golf-no-wall'
  | 'phase-2'
  | 'full-program';

/** Sidebar / rotation category key — system slug or custom category UUID. */
export type ContentCategoryId = SystemContentCategoryId | (string & {});

export type SystemPlaybackCategoryId =
  | 'default'
  | 'start-here'
  | 'phase-1'
  | 'phase-2'
  | 'full-program';

export type PlaybackCategoryId = SystemPlaybackCategoryId | 'custom';

export type ContentTrack = 'fitness' | 'golf';

export type Phase1Variant =
  | 'fitness-wall'
  | 'fitness-no-wall'
  | 'golf-wall'
  | 'golf-no-wall';

export interface PlaybackRule {
  categoryId: PlaybackCategoryId;
  label: string;
  options: string;
  behavior: string;
  loops: boolean;
  timeoutMinutes: number | null;
  supportsPause: boolean;
  approxDuration: string;
  usesRotation: boolean;
}

export const ROTATION_DAYS = 36;
export const INACTIVITY_TIMEOUT_MINUTES = 45;

export const playbackRules: PlaybackRule[] = [
  {
    categoryId: 'default',
    label: 'Default (Idle)',
    options: 'Fitness or Golf',
    behavior: 'Assigned video loops continuously until another category is selected on the touchscreen.',
    loops: true,
    timeoutMinutes: null,
    supportsPause: false,
    approxDuration: 'Continuous',
    usesRotation: false,
  },
  {
    categoryId: 'start-here',
    label: 'Start Here',
    options: 'Fitness or Golf',
    behavior:
      'Plays one assigned video (~6 min), repeats continuously for up to 45 minutes or until another selection. Returns to Default after inactivity.',
    loops: true,
    timeoutMinutes: INACTIVITY_TIMEOUT_MINUTES,
    supportsPause: false,
    approxDuration: '~6 min',
    usesRotation: false,
  },
  {
    categoryId: 'phase-1',
    label: 'Phase 1',
    options: 'Fitness (Wall), Fitness (No Wall), Golf (Wall), Golf (No Wall)',
    behavior:
      'Plays the video for the current rotation day (~5 min each). Repeats for 45 minutes, then returns to Default.',
    loops: true,
    timeoutMinutes: INACTIVITY_TIMEOUT_MINUTES,
    supportsPause: false,
    approxDuration: '~5 min',
    usesRotation: true,
  },
  {
    categoryId: 'phase-2',
    label: 'Phase 2',
    options: '1 schedule for all deployments',
    behavior:
      'Uses the 36-day rotation sequence (~5 min each). Repeats for 45 minutes, then returns to Default.',
    loops: true,
    timeoutMinutes: INACTIVITY_TIMEOUT_MINUTES,
    supportsPause: false,
    approxDuration: '~5 min',
    usesRotation: true,
  },
  {
    categoryId: 'full-program',
    label: 'Full Program',
    options: '1 schedule for all deployments',
    behavior:
      'Uses the 36-day rotation sequence (~60–75 min each). Plays once in full, then automatically returns to Default. Only category with Pause.',
    loops: false,
    timeoutMinutes: null,
    supportsPause: true,
    approxDuration: '~60–75 min',
    usesRotation: true,
  },
  {
    categoryId: 'custom',
    label: 'Custom',
    options: 'Admin-created categories',
    behavior:
      'Uses the 36-day rotation schedule. Each day’s video follows the category Loop or Once setting.',
    loops: true,
    timeoutMinutes: null,
    supportsPause: false,
    approxDuration: 'Per category',
    usesRotation: true,
  },
];

export interface CategoryGroupChild {
  id: ContentCategoryId;
  label: string;
  /** Backend program UUID for this playlist (system or custom). */
  programId?: string;
}

export interface CategoryGroup {
  /** Unique nav/tab key (parent category UUID or system slug). */
  groupKey: string;
  playbackCategory: PlaybackCategoryId;
  label: string;
  isSystem?: boolean;
  parentCategoryId?: string;
  scope?: 'GLOBAL' | 'BY_FIELD' | 'BY_FIELD_AND_VARIANT' | 'BY_NAMED_PLAYLIST';
  children: CategoryGroupChild[];
}

export const contentCategoryGroups: CategoryGroup[] = [
  {
    groupKey: 'default',
    playbackCategory: 'default',
    label: 'Default',
    isSystem: true,
    scope: 'BY_FIELD',
    children: [
      { id: 'default-fitness', label: 'Fitness' },
      { id: 'default-golf', label: 'Golf' },
    ],
  },
  {
    groupKey: 'start-here',
    playbackCategory: 'start-here',
    label: 'Start Here',
    isSystem: true,
    scope: 'BY_FIELD',
    children: [
      { id: 'start-here-fitness', label: 'Fitness' },
      { id: 'start-here-golf', label: 'Golf' },
    ],
  },
  {
    groupKey: 'phase-1',
    playbackCategory: 'phase-1',
    label: 'Phase 1',
    isSystem: true,
    scope: 'BY_FIELD_AND_VARIANT',
    children: [
      { id: 'phase-1-fitness-wall', label: 'Fitness (Wall)' },
      { id: 'phase-1-fitness-no-wall', label: 'Fitness (No Wall)' },
      { id: 'phase-1-golf-wall', label: 'Golf (Wall)' },
      { id: 'phase-1-golf-no-wall', label: 'Golf (No Wall)' },
    ],
  },
  {
    groupKey: 'phase-2',
    playbackCategory: 'phase-2',
    label: 'Phase 2',
    isSystem: true,
    scope: 'GLOBAL',
    children: [{ id: 'phase-2', label: 'All Deployments' }],
  },
  {
    groupKey: 'full-program',
    playbackCategory: 'full-program',
    label: 'Full Program',
    isSystem: true,
    scope: 'GLOBAL',
    children: [{ id: 'full-program', label: 'All Deployments' }],
  },
];

export const allContentCategories = contentCategoryGroups.flatMap((group) => group.children);

export function getPlaybackCategoryForContent(categoryId: ContentCategoryId): PlaybackCategoryId {
  const group = contentCategoryGroups.find((entry) =>
    entry.children.some((child) => child.id === categoryId),
  );
  if (group) return group.playbackCategory;
  // Custom category UUID (not in static groups)
  return 'custom';
}

export function getCategoryLabel(categoryId: ContentCategoryId): string {
  return allContentCategories.find((category) => category.id === categoryId)?.label ?? categoryId;
}

export function getPlaybackRule(categoryId: PlaybackCategoryId): PlaybackRule {
  return playbackRules.find((rule) => rule.categoryId === categoryId) ?? playbackRules[0]!;
}

export function buildRotationVideoName(
  day: number,
  column:
    | 'defaultFitness'
    | 'defaultGolf'
    | 'startHereFitness'
    | 'startHereGolf'
    | 'phase1FitnessWall'
    | 'phase1FitnessNoWall'
    | 'phase1GolfWall'
    | 'phase1GolfNoWall'
    | 'phase2'
    | 'fullProgram',
): string {
  const dayPrefix = String(day).padStart(2, '0');

  switch (column) {
    case 'defaultFitness':
      return '01_Home_Fitness';
    case 'defaultGolf':
      return '01_Home_Golf';
    case 'startHereFitness':
      return '01_Screen 1_Fitness';
    case 'startHereGolf':
      return '01_Screen 1_Golf';
    case 'phase1FitnessWall':
      return `${dayPrefix}_Screen 2_Fitness_Wall`;
    case 'phase1FitnessNoWall':
      return `${dayPrefix}_Screen 2_Fitness_NoWall`;
    case 'phase1GolfWall':
      return `${dayPrefix}_Screen 2_Golf_Wall`;
    case 'phase1GolfNoWall':
      return `${dayPrefix}_Screen 2_Golf_NoWall`;
    case 'phase2':
      return `${dayPrefix}_Screen 3`;
    case 'fullProgram':
      return `${dayPrefix}_Team`;
    default:
      return `${dayPrefix}_Content`;
  }
}

export function getFullCategoryLabel(categoryId: ContentCategoryId): string {
  const group = contentCategoryGroups.find((entry) =>
    entry.children.some((child) => child.id === categoryId),
  );
  const child = group?.children.find((item) => item.id === categoryId);
  if (!group || !child) return categoryId;
  if (group.children.length === 1) return group.label;
  return `${group.label} — ${child.label}`;
}

const categoryRotationColumn: Partial<
  Record<SystemContentCategoryId, Parameters<typeof buildRotationVideoName>[1]>
> = {
  'default-fitness': 'defaultFitness',
  'default-golf': 'defaultGolf',
  'start-here-fitness': 'startHereFitness',
  'start-here-golf': 'startHereGolf',
  'phase-1-fitness-wall': 'phase1FitnessWall',
  'phase-1-fitness-no-wall': 'phase1FitnessNoWall',
  'phase-1-golf-wall': 'phase1GolfWall',
  'phase-1-golf-no-wall': 'phase1GolfNoWall',
  'phase-2': 'phase2',
  'full-program': 'fullProgram',
};

export function getSuggestedVideoTitle(
  categoryId: ContentCategoryId,
  rotationDay = 1,
): string {
  const column = categoryRotationColumn[categoryId as SystemContentCategoryId];
  if (!column) {
    const dayPrefix = String(rotationDay).padStart(2, '0');
    return `${dayPrefix}_Custom.mp4`;
  }
  return `${buildRotationVideoName(rotationDay, column)}.mp4`;
}

export function getUploadCategoryInfo(categoryId: ContentCategoryId, rotationDay = 1) {
  const playbackCategory = getPlaybackCategoryForContent(categoryId);
  const rule = getPlaybackRule(playbackCategory);
  const usesRotation = rule.usesRotation;

  return {
    fullLabel: getFullCategoryLabel(categoryId),
    playbackCategory,
    rule,
    usesRotation,
    suggestedTitle: getSuggestedVideoTitle(categoryId, usesRotation ? rotationDay : 1),
    typeSummary:
      playbackCategory === 'default'
        ? 'Idle / home screen video'
        : playbackCategory === 'start-here'
          ? 'Intro video when user taps Start Here'
          : playbackCategory === 'phase-1'
            ? 'Phase 1 daily rotation video'
            : playbackCategory === 'phase-2'
              ? 'Phase 2 daily rotation video'
              : playbackCategory === 'custom'
                ? 'Custom category daily rotation video'
                : 'Full Program long-form video',
  };
}

export const uploadPlaybackTypeOptions = playbackRules.map((rule) => ({
  value: rule.categoryId,
  label: rule.label,
  hint:
    rule.categoryId === 'default'
      ? 'Loops on idle touchscreen'
      : rule.categoryId === 'start-here'
        ? 'Plays when Start Here is tapped'
        : rule.usesRotation
          ? `${ROTATION_DAYS}-day rotation content`
          : rule.label,
}));

export const deploymentTrackOptions = [
  { value: 'fitness', label: 'Fitness Track' },
  { value: 'golf', label: 'Golf Track' },
] as const;
