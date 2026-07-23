import { ROTATION_DAYS } from '../constants/contentPlayback';
import type { RotationScheduleRow } from '../constants/rotationSchedule';

const SCHEDULE_HEADERS = [
  'Day',
  'Date',
  'Default Fitness',
  'Default Golf',
  'Start Here Fitness',
  'Start Here Golf',
  'Phase 1 Fitness Wall',
  'Phase 1 Fitness No Wall',
  'Phase 1 Golf Wall',
  'Phase 1 Golf No Wall',
  'Phase 2',
  'Full Program',
] as const;

function rowToCsvLine(row: RotationScheduleRow): string {
  return [
    row.day,
    row.dateLabel,
    row.defaultFitness,
    row.defaultGolf,
    row.startHereFitness,
    row.startHereGolf,
    row.phase1FitnessWall,
    row.phase1FitnessNoWall,
    row.phase1GolfWall,
    row.phase1GolfNoWall,
    row.phase2,
    row.fullProgram,
  ]
    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
    .join(',');
}

export function buildRotationScheduleCsv(
  getRowByDay: (day: number) => RotationScheduleRow | undefined,
): string {
  const allRows = Array.from({ length: ROTATION_DAYS }, (_, index) => getRowByDay(index + 1)).filter(
    Boolean,
  ) as RotationScheduleRow[];

  return [SCHEDULE_HEADERS.join(','), ...allRows.map(rowToCsvLine)].join('\n');
}

export function exportRotationScheduleCsv(
  getRowByDay: (day: number) => RotationScheduleRow | undefined,
  filename = 'perform6-rotation-schedule.csv',
): void {
  const blob = new Blob([buildRotationScheduleCsv(getRowByDay)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getDeviceScheduleExportFilename(deviceName: string): string {
  const slug = deviceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `perform6-schedule-${slug || 'device'}.csv`;
}
