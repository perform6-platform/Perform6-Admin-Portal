import { ROTATION_DAYS } from './contentPlayback';
import type { ContentCategoryId } from './contentPlayback';

export type RotationViewFilter = 'all' | 'fitness' | 'golf' | 'rotation';

export interface RotationScheduleRow {
  id: string;
  day: number;
  dayLabel: string;
  dateLabel: string;
  defaultFitness: string;
  defaultGolf: string;
  startHereFitness: string;
  startHereGolf: string;
  phase1FitnessWall: string;
  phase1FitnessNoWall: string;
  phase1GolfWall: string;
  phase1GolfNoWall: string;
  phase2: string;
  fullProgram: string;
  isEllipsis?: boolean;
}

export const rotationViewOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'fitness', label: 'Fitness Track' },
  { value: 'golf', label: 'Golf Track' },
  { value: 'rotation', label: '36-Day Rotation Only' },
] as const;

export const rotationColumnGroups = [
  {
    label: '',
    columns: [
      { key: 'day', label: 'Day', tone: 'neutral' as const },
      { key: 'date', label: 'Date', tone: 'neutral' as const },
    ],
  },
  {
    label: 'Default',
    columns: [
      { key: 'defaultFitness', label: 'Fitness', tone: 'slate' as const },
      { key: 'defaultGolf', label: 'Golf', tone: 'slate' as const },
    ],
  },
  {
    label: 'Start Here',
    columns: [
      { key: 'startHereFitness', label: 'Fitness', tone: 'blue' as const },
      { key: 'startHereGolf', label: 'Golf', tone: 'blue' as const },
    ],
  },
  {
    label: 'Phase 1',
    columns: [
      { key: 'phase1FitnessWall', label: 'Fitness (Wall)', tone: 'teal' as const },
      { key: 'phase1FitnessNoWall', label: 'Fitness (No Wall)', tone: 'teal' as const },
      { key: 'phase1GolfWall', label: 'Golf (Wall)', tone: 'teal' as const },
      { key: 'phase1GolfNoWall', label: 'Golf (No Wall)', tone: 'teal' as const },
    ],
  },
  {
    label: 'Phase 2',
    columns: [{ key: 'phase2', label: 'All', tone: 'purple' as const }],
  },
  {
    label: 'Full Program',
    columns: [{ key: 'fullProgram', label: 'All', tone: 'gold' as const }],
  },
];

export const rotationFlatColumns = rotationColumnGroups.flatMap((group) => group.columns);

function formatScheduleDate(day: number): { dayLabel: string; dateLabel: string } {
  const epoch = new Date(2025, 0, 1);
  const date = new Date(epoch);
  date.setDate(epoch.getDate() + (day - 1));
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).replace(/\.$/, '');
  return {
    dayLabel: weekday,
    dateLabel: date
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      .replace(' ', '-'),
  };
}

export function getRotationScheduleCellValue(
  row: RotationScheduleRow,
  columnKey: string,
): string {
  if (columnKey === 'day') return row.dayLabel;
  if (columnKey === 'date') return row.dateLabel;
  const value = row[columnKey as keyof RotationScheduleRow];
  return value === undefined || value === null ? '' : String(value);
}

function buildVideoRow(day: number): RotationScheduleRow {
  const { dayLabel, dateLabel } = formatScheduleDate(day);
  return {
    id: `day-${day}`,
    day,
    dayLabel,
    dateLabel,
    defaultFitness: '',
    defaultGolf: '',
    startHereFitness: '',
    startHereGolf: '',
    phase1FitnessWall: '',
    phase1FitnessNoWall: '',
    phase1GolfWall: '',
    phase1GolfNoWall: '',
    phase2: '',
    fullProgram: '',
  };
}

export function createInitialRotationSchedule(): RotationScheduleRow[] {
  return Array.from({ length: ROTATION_DAYS }, (_, index) => buildVideoRow(index + 1));
}

export type RotationScheduleColumnKey = keyof Omit<
  RotationScheduleRow,
  'id' | 'day' | 'dayLabel' | 'dateLabel' | 'isEllipsis'
>;

export const rotationEditableColumns: {
  key: RotationScheduleColumnKey;
  label: string;
  group: string;
}[] = [
  { key: 'defaultFitness', label: 'Fitness', group: 'Default' },
  { key: 'defaultGolf', label: 'Golf', group: 'Default' },
  { key: 'startHereFitness', label: 'Fitness', group: 'Start Here' },
  { key: 'startHereGolf', label: 'Golf', group: 'Start Here' },
  { key: 'phase1FitnessWall', label: 'Fitness (Wall)', group: 'Phase 1' },
  { key: 'phase1FitnessNoWall', label: 'Fitness (No Wall)', group: 'Phase 1' },
  { key: 'phase1GolfWall', label: 'Golf (Wall)', group: 'Phase 1' },
  { key: 'phase1GolfNoWall', label: 'Golf (No Wall)', group: 'Phase 1' },
  { key: 'phase2', label: 'All Deployments', group: 'Phase 2' },
  { key: 'fullProgram', label: 'All Deployments', group: 'Full Program' },
];

export { buildVideoRow };

export const currentRotationDay = 15;

export function getScheduleColumnForCategory(
  categoryId: ContentCategoryId,
): RotationScheduleColumnKey {
  const columnMap: Record<ContentCategoryId, RotationScheduleColumnKey> = {
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

  return columnMap[categoryId];
}

export function toScheduleVideoName(title: string | null | undefined): string {
  if (title == null) return '';
  return String(title).replace(/\.mp4$/i, '').trim();
}

export function getViewFilterForCategory(categoryId: ContentCategoryId): RotationViewFilter {
  return categoryId.includes('golf') ? 'golf' : 'fitness';
}

export function getDeploymentTableColumnKeys(categoryId: ContentCategoryId): string[] {
  return ['day', 'date', getScheduleColumnForCategory(categoryId)];
}

export function getRotationRowForDay(
  day: number,
  rows?: RotationScheduleRow[],
): RotationScheduleRow | undefined {
  if (day < 1 || day > ROTATION_DAYS) return undefined;
  if (rows) {
    return rows.find((row) => row.day === day);
  }
  return buildVideoRow(day);
}
