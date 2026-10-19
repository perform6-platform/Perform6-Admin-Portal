import type {
  DeploymentScheduleTable,
  DeploymentScheduleTableCell,
  DeploymentScheduleTableColumn,
  DeploymentScheduleTableRow,
} from '../types/deployments';
import { formatPlaylistKeyLabel } from './deploymentDisplay';
import { categoryDisplayName } from './systemCategoryCopy';

function asString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeColumnGroup(group: unknown): string {
  return typeof group === 'string' ? group.trim() : '';
}

/** ISO `YYYY-MM-DD` → `16 Sep 2026` (portal date style). */
export function formatScheduleDateLabel(value: string | null | undefined): string {
  const raw = asString(value);
  if (!raw) return '—';
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  return raw;
}

const ZONE_FROM_PROGRAM_NAME: Record<string, string> = {
  'program a': 'A',
  'program b': 'B',
  'program c': 'C',
  'program d': 'D',
};

/** Map API / library-type labels to approved Schedule display names. */
const LIBRARY_TYPE_DISPLAY: Record<
  string,
  { group: string; label: string; variantLabel?: string }
> = {
  DEFAULT_FITNESS: { group: 'Default', label: 'Default (Fitness)' },
  DEFAULT_GOLF: { group: 'Default', label: 'Default (Golf)' },
  START_HERE_FITNESS: { group: 'Start Here', label: 'Start Here (Fitness)' },
  START_HERE_GOLF: { group: 'Start Here', label: 'Start Here (Golf)' },
  FITNESS_WALL: { group: 'Phase 1', label: 'Fitness (Wall)', variantLabel: 'Fitness (Wall)' },
  FITNESS_NO_WALL: {
    group: 'Phase 1',
    label: 'Fitness (No Wall)',
    variantLabel: 'Fitness (No Wall)',
  },
  GOLF_WALL: { group: 'Phase 1', label: 'Golf (Wall)', variantLabel: 'Golf (Wall)' },
  GOLF_NO_WALL: { group: 'Phase 1', label: 'Golf (No Wall)', variantLabel: 'Golf (No Wall)' },
  PHASE_2: { group: 'Phase 2', label: 'Phase 2' },
  FULL_PROGRAM: { group: 'Full Program', label: 'Full Program' },
};

function formatRawPlaylistLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const display = categoryDisplayName(
    trimmed.toLowerCase().replace(/\s+/g, '-'),
    trimmed,
  );
  if (display !== trimmed) return display;

  const lower = trimmed.toLowerCase();
  const patterns: Array<[RegExp, string]> = [
    [/^default\s+fitness$/i, 'Default (Fitness)'],
    [/^default\s+golf$/i, 'Default (Golf)'],
    [/^start\s*here\s+fitness$/i, 'Start Here (Fitness)'],
    [/^start\s*here\s+golf$/i, 'Start Here (Golf)'],
    [/^fitness\s*\(?\s*no\s*wall\s*\)?$/i, 'Fitness (No Wall)'],
    [/^fitness\s*\(?\s*wall\s*\)?$/i, 'Fitness (Wall)'],
    [/^golf\s*\(?\s*no\s*wall\s*\)?$/i, 'Golf (No Wall)'],
    [/^golf\s*\(?\s*wall\s*\)?$/i, 'Golf (Wall)'],
    [/^15\s*minutes?$/i, 'Full Program (4-Zone)'],
    [/^program\s+([a-d])$/i, ''],
  ];

  for (const [re, replacement] of patterns) {
    const match = trimmed.match(re);
    if (!match) continue;
    if (re.source.includes('program')) {
      return formatPlaylistKeyLabel(match[1]!.toUpperCase());
    }
    if (replacement) return replacement;
  }

  if (lower === 'fitness') return 'Fitness';
  if (lower === 'golf') return 'Golf';
  if (lower === 'wall') return 'Wall';
  if (lower === 'no wall') return 'No Wall';
  return trimmed;
}

function normalizeVariantLabel(raw: string | null | undefined): string | null {
  const value = asString(raw);
  if (!value) return null;
  const zoneKey = ZONE_FROM_PROGRAM_NAME[value.toLowerCase()];
  if (zoneKey) return formatPlaylistKeyLabel(zoneKey);
  if (/^zone\s*[1-4]/i.test(value)) return value.replace(/\s+/g, ' ');
  const programMatch = value.match(/^Program\s+([A-D])$/i);
  if (programMatch) return formatPlaylistKeyLabel(programMatch[1]!.toUpperCase());
  return formatRawPlaylistLabel(value);
}

function inferColumnGroup(key: string, label: string, libraryType: string): string {
  const lt = libraryType.toUpperCase();
  const combined = `${key} ${label}`.toLowerCase();
  const mapped = LIBRARY_TYPE_DISPLAY[lt];
  if (mapped?.group) return mapped.group;

  if (lt.startsWith('START_HERE') || /start\s*here|starthere/.test(combined)) {
    return 'Start Here';
  }
  if (lt === 'PHASE_2' || /phase\s*2|phase2/.test(combined)) {
    return 'Phase 2';
  }
  if (lt === 'FULL_PROGRAM' || /full\s*program|fullprogram/.test(combined)) {
    return 'Full Program';
  }
  if (/15\s*min|4-zone|4 zone/.test(combined)) {
    return 'Full Program (4-Zone)';
  }
  if (lt.startsWith('DEFAULT_') || (/^default/.test(combined) && !/phase/.test(combined))) {
    return 'Default';
  }
  if (isPhase1Column(key, label, libraryType, '')) {
    return 'Phase 1';
  }
  return '';
}

function isPhase1Column(key: string, label: string, libraryType: string, group: string): boolean {
  const combined = `${key} ${label} ${libraryType} ${group}`.toLowerCase();
  return (
    combined.includes('phase1') ||
    combined.includes('phase 1') ||
    libraryType.includes('FITNESS_WALL') ||
    libraryType.includes('FITNESS_NO_WALL') ||
    libraryType.includes('GOLF_WALL') ||
    libraryType.includes('GOLF_NO_WALL')
  );
}

/** Derive Wall / No Wall / Zone from column metadata. */
export function getScheduleColumnVariantLabel(
  column: Pick<DeploymentScheduleTableColumn, 'key' | 'label' | 'libraryType' | 'variantLabel'>,
): string | null {
  const fromApi = normalizeVariantLabel(column.variantLabel);
  if (fromApi) return fromApi;

  const libraryType = (column.libraryType ?? '').toUpperCase();
  const mapped = LIBRARY_TYPE_DISPLAY[libraryType];
  if (mapped?.variantLabel) return mapped.variantLabel;

  const key = column.key.toLowerCase();
  const label = column.label.toLowerCase();
  const combined = `${key} ${label} ${libraryType}`.toLowerCase();

  if (
    libraryType.includes('NO_WALL') ||
    combined.includes('no_wall') ||
    combined.includes('nowall') ||
    combined.includes('no wall') ||
    label === 'no wall'
  ) {
    return 'No Wall';
  }

  if (
    libraryType.includes('FITNESS_WALL') ||
    libraryType.includes('GOLF_WALL') ||
    ((combined.includes('wall') || label === 'wall') && !combined.includes('no'))
  ) {
    return 'Wall';
  }

  if (label === 'wall') return 'Wall';

  return null;
}

function inferVariantFromDeployment(exerciseVariant: string | undefined): string | null {
  const variant = exerciseVariant?.toLowerCase() ?? '';
  if (!variant) return null;
  if (variant.includes('no') && variant.includes('wall')) return 'No Wall';
  if (variant.includes('wall')) return 'Wall';
  return null;
}

function leafPlaylistBadge(column: DeploymentScheduleTableColumn): string {
  const variant = getScheduleColumnVariantLabel(column);
  if (variant && /^(zone\s*[1-4]|fitness \(wall\)|fitness \(no wall\)|golf \(wall\)|golf \(no wall\))$/i.test(variant)) {
    return variant;
  }

  const label = formatRawPlaylistLabel(column.label);
  const group = normalizeColumnGroup(column.group);
  if (group && /^(fitness|golf)$/i.test(label)) {
    return `${group} (${label})`;
  }
  if (group && label.toLowerCase().startsWith(group.toLowerCase())) {
    return label;
  }
  if (variant && /wall/i.test(variant) && /^(fitness|golf)$/i.test(label)) {
    return `${label} (${variant})`;
  }
  return label || variant || group || column.key;
}

/** Apply approved playlist labels using column metadata + deployment variant. */
export function enrichScheduleColumns(
  columns: DeploymentScheduleTableColumn[],
  options?: { fieldCategory?: string; exerciseVariant?: string },
): DeploymentScheduleTableColumn[] {
  const deploymentVariant = inferVariantFromDeployment(options?.exerciseVariant);

  return columns.map((column) => {
    const libraryType = (column.libraryType ?? '').toUpperCase() || null;
    const key = column.key;
    const rawLabel = column.label;
    const libraryMapped = libraryType ? LIBRARY_TYPE_DISPLAY[libraryType] : undefined;

    let group = normalizeColumnGroup(column.group);
    let variantLabel = getScheduleColumnVariantLabel(column);
    const phase1 = isPhase1Column(key, rawLabel, libraryType ?? '', group);

    if (libraryMapped?.group) {
      group = libraryMapped.group;
    } else if (!group) {
      group = inferColumnGroup(key, rawLabel, libraryType ?? '');
    }

    if (/15\s*min/i.test(rawLabel) || /15\s*min/i.test(group)) {
      group = 'Full Program (4-Zone)';
    } else if (group) {
      group = categoryDisplayName(group.toLowerCase().replace(/\s+/g, '-'), group);
      group = formatRawPlaylistLabel(group);
    }

    if (phase1 && !group) {
      group = 'Phase 1';
    }

    if (phase1 && !variantLabel) {
      variantLabel = deploymentVariant;
    }

    if (libraryMapped?.variantLabel) {
      variantLabel = libraryMapped.variantLabel;
    }

    let normalizedLabel = libraryMapped?.label
      ? libraryMapped.label
      : formatRawPlaylistLabel(rawLabel.trim()) || key;

    // Under Default / Start Here groups, leaf headers stay Fitness / Golf;
    // blue cell badge still uses Default (Golf) via getScheduleColumnPlaylistBadge.
    if (
      libraryMapped &&
      (libraryMapped.group === 'Default' || libraryMapped.group === 'Start Here')
    ) {
      normalizedLabel = libraryMapped.label.includes('Fitness') ? 'Fitness' : 'Golf';
    } else if (libraryMapped?.variantLabel) {
      normalizedLabel = libraryMapped.variantLabel;
    }

    const genericPhase1Label = /^phase\s*1$/i.test(normalizedLabel);

    return {
      ...column,
      group: group || null,
      libraryType,
      variantLabel: variantLabel || null,
      label: genericPhase1Label && variantLabel ? variantLabel : normalizedLabel,
    };
  });
}

export function hasScheduleVariantSubHeaders(columns: DeploymentScheduleTableColumn[] = []): boolean {
  return columns.some(scheduleColumnNeedsVariantSubHeader);
}

export function scheduleColumnNeedsVariantSubHeader(
  column: DeploymentScheduleTableColumn,
): boolean {
  return Boolean(getScheduleColumnVariantLabel(column));
}

export function scheduleGroupNeedsSubHeaderRow(
  groupColumns: DeploymentScheduleTableColumn[],
): boolean {
  return groupColumns.length > 1 || groupColumns.some(scheduleColumnNeedsVariantSubHeader);
}

export function getScheduleColumnLeafLabel(column: DeploymentScheduleTableColumn): string {
  return getScheduleColumnVariantLabel(column) ?? formatRawPlaylistLabel(column.label);
}

export function getScheduleColumnPlaylistBadge(
  column: DeploymentScheduleTableColumn,
): string {
  return leafPlaylistBadge(column);
}

function normalizeCell(raw: unknown): DeploymentScheduleTableCell {
  if (!raw || typeof raw !== 'object') {
    return { assigned: false, title: null, thumbnail: null };
  }

  const cell = raw as Record<string, unknown>;
  const title = asString(cell.title ?? cell.video ?? cell.name);
  const thumbnail = asString(cell.thumbnail ?? cell.thumbnailUrl) || null;
  const assigned =
    cell.assigned === false
      ? false
      : cell.assigned === true
        ? true
        : Boolean(title);

  return {
    title: title || null,
    thumbnail,
    assigned,
    mediaVersionId: asString(cell.mediaVersionId) || null,
  };
}

/** Normalize backend schedule-table payloads into a safe UI shape. */
export function normalizeDeploymentScheduleTable(
  raw: unknown,
  deploymentId: string,
): DeploymentScheduleTable {
  const payload =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const columns = Array.isArray(payload.columns)
    ? payload.columns.map((entry, index) => {
        const column =
          entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
        const key = asString(column.key ?? column.slot ?? column.id) || `column-${index + 1}`;
        const label = asString(column.label ?? column.name ?? key) || key;
        const group = normalizeColumnGroup(column.group);
        const libraryType = asString(column.libraryType ?? column.library_type) || null;
        const categoryId = asString(column.categoryId ?? column.category_id) || null;
        const playlistKey = asString(column.playlistKey ?? column.playlist_key) || null;
        const variantFromKey = playlistKey ? formatPlaylistKeyLabel(playlistKey) : null;
        const variantLabel = getScheduleColumnVariantLabel({
          key,
          label,
          libraryType,
          variantLabel:
            variantFromKey ||
            normalizeVariantLabel(asString(column.variantLabel)) ||
            null,
        });
        const phase1 =
          !categoryId && isPhase1Column(key, label, libraryType ?? '', group);
        const resolvedGroup = group || (phase1 ? 'Phase 1' : '');

        return {
          key,
          label,
          group: resolvedGroup || null,
          libraryType,
          categoryId,
          isRotating: Boolean(column.isRotating),
          variantLabel,
        };
      })
    : [];

  const rows = Array.isArray(payload.rows)
    ? payload.rows.map((entry, index) => {
        const row =
          entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
        const day = Number(row.day ?? row.dayNumber ?? row.offset ?? index + 1);
        const rotationDay =
          Number(row.rotationDay ?? row.rotationDayNumber ?? day) || index + 1;
        const cells: Record<string, DeploymentScheduleTableCell> = {};

        if (row.cells && typeof row.cells === 'object' && !Array.isArray(row.cells)) {
          Object.entries(row.cells as Record<string, unknown>).forEach(([key, value]) => {
            cells[key] = normalizeCell(value);
          });
        }

        columns.forEach((column) => {
          if (!cells[column.key]) {
            cells[column.key] = normalizeCell(null);
          }
        });

        const rawDate = asString(row.dateLabel ?? row.date) || '';

        return {
          day: Number.isFinite(day) ? day : index + 1,
          dayLabel: asString(row.dayOfWeek ?? row.dayLabel ?? row.weekday ?? row.dayName) || '',
          dateLabel: formatScheduleDateLabel(rawDate),
          rotationDay,
          cells,
        };
      })
    : [];

  return {
    deploymentId: asString(payload.deploymentId) || deploymentId,
    deploymentType: asString(payload.deploymentType) || 'DEPLOYMENT',
    fieldCategory: asString(payload.fieldCategory) || '—',
    exerciseVariant: asString(payload.exerciseVariant) || '—',
    rotationStartDate: asString(payload.rotationStartDate) || '',
    days: Number(payload.days) || rows.length || 36,
    columns: enrichScheduleColumns(columns, {
      fieldCategory: asString(payload.fieldCategory),
      exerciseVariant: asString(payload.exerciseVariant),
    }),
    rows,
  };
}

export function isScheduleCellAssigned(
  cell: DeploymentScheduleTableCell | null | undefined,
): boolean {
  if (!cell) return false;
  if (cell.assigned === false) return false;
  return Boolean(asString(cell.title));
}

export function getScheduleCellTitle(
  cell: DeploymentScheduleTableCell | null | undefined,
  rotationDay?: number,
): string {
  if (!isScheduleCellAssigned(cell)) {
    return rotationDay != null ? `Not Assigned — Day ${rotationDay}` : 'Not Assigned';
  }
  return asString(cell?.title);
}

export function groupScheduleColumns(columns: DeploymentScheduleTableColumn[] = []) {
  const groups: { label: string; columns: DeploymentScheduleTableColumn[] }[] = [];

  columns.forEach((column) => {
    const label = normalizeColumnGroup(column.group);
    const existing = groups.find((group) => group.label === label);
    if (existing) {
      existing.columns.push(column);
      return;
    }
    groups.push({ label, columns: [column] });
  });

  return groups;
}

export function hasScheduleColumnGroups(columns: DeploymentScheduleTableColumn[] = []): boolean {
  return columns.some((column) => Boolean(normalizeColumnGroup(column.group)));
}

export interface ScheduleDayVideoEntry {
  group: string;
  label: string | null;
  variantLabel: string | null;
  playlistLabel: string;
  video: string;
  thumbnail?: string | null;
  assigned: boolean;
}

function getScheduleVideoEntryLabels(column: DeploymentScheduleTableColumn): {
  group: string;
  label: string | null;
  variantLabel: string | null;
  playlistLabel: string;
} {
  const group = normalizeColumnGroup(column.group) || formatRawPlaylistLabel(column.label);
  const variantLabel = getScheduleColumnVariantLabel(column);
  const playlistLabel = getScheduleColumnPlaylistBadge(column);
  const columnLabel = formatRawPlaylistLabel(column.label.trim());

  if (variantLabel) {
    return { group, label: null, variantLabel, playlistLabel };
  }

  if (columnLabel && columnLabel.toLowerCase() !== group.toLowerCase()) {
    return { group, label: columnLabel, variantLabel: null, playlistLabel };
  }

  return { group, label: null, variantLabel: null, playlistLabel };
}

export function getScheduleVideosForDay(
  row: DeploymentScheduleTableRow | undefined,
  columns: DeploymentScheduleTableColumn[],
): ScheduleDayVideoEntry[] {
  if (!row) return [];

  return columns.map((column) => {
    const cell = row.cells?.[column.key];
    const assigned = isScheduleCellAssigned(cell);
    const { group, label, variantLabel, playlistLabel } = getScheduleVideoEntryLabels(column);
    return {
      group,
      label,
      variantLabel,
      playlistLabel,
      video: assigned
        ? asString(cell?.title)
        : `Not Assigned — Day ${row.rotationDay}`,
      thumbnail: cell?.thumbnail ?? null,
      assigned,
    };
  });
}

export function formatScheduleDayModalTitle(row: DeploymentScheduleTableRow): string {
  return `Day ${row.rotationDay} — ${row.dateLabel}`;
}

export function buildScheduleTableCsv(table: DeploymentScheduleTable): string {
  const headers = [
    'Date',
    'Rotation Day',
    ...table.columns.map((column) => column.label),
  ];

  const lines = table.rows.map((row) =>
    [
      row.dateLabel,
      `Day ${row.rotationDay}`,
      ...table.columns.map((column) =>
        getScheduleCellTitle(row.cells?.[column.key], row.rotationDay),
      ),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  );

  return [headers.join(','), ...lines].join('\n');
}

export function exportScheduleTableCsv(
  table: DeploymentScheduleTable,
  filename = 'perform6-rotation-schedule.csv',
): void {
  const blob = new Blob([buildScheduleTableCsv(table)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
