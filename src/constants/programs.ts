import type { ContentCategoryId } from './contentPlayback';
import type { PlaybackCategoryId } from './contentPlayback';

export type ProgramStatus = 'active' | 'inactive';

export type ProgramAccent = 'slate' | 'cyan' | 'teal' | 'purple' | 'gold';

export interface ProgramPhaseCard {
  id: PlaybackCategoryId;
  title: string;
  accent: ProgramAccent;
  description: string;
  videoCount: number;
  thumbnailUrl: string;
  manageRoute: string;
}

export interface ProgramListItem {
  id: PlaybackCategoryId | ContentCategoryId;
  name: string;
  description: string;
  duration: string;
  totalVideos: number;
  status: ProgramStatus;
  isSubProgram?: boolean;
}

export const programPhaseCards: ProgramPhaseCard[] = [
  {
    id: 'default',
    title: 'DEFAULT',
    accent: 'slate',
    description: 'Idle state — Fitness or Golf video loops until a category is selected.',
    videoCount: 2,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=480&h=300&fit=crop',
    manageRoute: '/programs/default/manage',
  },
  {
    id: 'start-here',
    title: 'START HERE',
    accent: 'cyan',
    description: 'Intro video (~6 min) repeats for 45 min, then returns to Default.',
    videoCount: 2,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=480&h=300&fit=crop',
    manageRoute: '/programs/start-here/manage',
  },
  {
    id: 'phase-1',
    title: 'PHASE 1',
    accent: 'teal',
    description: '4 tracks × 36-day rotation (~5 min each). 45 min repeat timeout.',
    videoCount: 144,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517836357463-d06f66068342?w=480&h=300&fit=crop',
    manageRoute: '/programs/phase-1/manage',
  },
  {
    id: 'phase-2',
    title: 'PHASE 2',
    accent: 'purple',
    description: 'Single 36-day schedule for all deployments (~5 min each).',
    videoCount: 36,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=480&h=300&fit=crop',
    manageRoute: '/programs/phase-2/manage',
  },
  {
    id: 'full-program',
    title: 'FULL PROGRAM',
    accent: 'gold',
    description: '36-day schedule (~60–75 min). Plays once, no loop. Pause enabled.',
    videoCount: 36,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=480&h=300&fit=crop',
    manageRoute: '/programs/full-program/manage',
  },
];

export const mockProgramList: ProgramListItem[] = [
  {
    id: 'default',
    name: 'Default (Idle)',
    description: 'Home screen — loops Fitness or Golf idle video',
    duration: 'Continuous',
    totalVideos: 2,
    status: 'active',
  },
  {
    id: 'start-here',
    name: 'Start Here',
    description: 'Intro screen — Fitness or Golf (~6 min, 45 min timeout)',
    duration: 'Static',
    totalVideos: 2,
    status: 'active',
  },
  {
    id: 'phase-1',
    name: 'Phase 1',
    description: '4 sub-tracks with 36-day rotation',
    duration: '36 Days',
    totalVideos: 144,
    status: 'active',
  },
  {
    id: 'phase-1-fitness-wall',
    name: 'Phase 1 — Fitness (Wall)',
    description: 'Wall-based fitness patterns',
    duration: '36 Days',
    totalVideos: 36,
    status: 'active',
    isSubProgram: true,
  },
  {
    id: 'phase-1-fitness-no-wall',
    name: 'Phase 1 — Fitness (No Wall)',
    description: 'Fitness patterns without wall equipment',
    duration: '36 Days',
    totalVideos: 36,
    status: 'active',
    isSubProgram: true,
  },
  {
    id: 'phase-1-golf-wall',
    name: 'Phase 1 — Golf (Wall)',
    description: 'Golf patterns with wall',
    duration: '36 Days',
    totalVideos: 36,
    status: 'active',
    isSubProgram: true,
  },
  {
    id: 'phase-1-golf-no-wall',
    name: 'Phase 1 — Golf (No Wall)',
    description: 'Golf patterns without wall',
    duration: '36 Days',
    totalVideos: 36,
    status: 'active',
    isSubProgram: true,
  },
  {
    id: 'phase-2',
    name: 'Phase 2',
    description: 'Single schedule for all deployments',
    duration: '36 Days',
    totalVideos: 36,
    status: 'active',
  },
  {
    id: 'full-program',
    name: 'Full Program',
    description: 'Long-form team training — play once, pause supported',
    duration: '36 Days',
    totalVideos: 36,
    status: 'active',
  },
];
