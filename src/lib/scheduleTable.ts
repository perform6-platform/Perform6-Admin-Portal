import type {
  DeploymentScheduleTable,
  DeploymentScheduleTableCell,
  DeploymentScheduleTableColumn,
  DeploymentScheduleTableRow,
} from '../types/deployments';

function asString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeColumnGroup(group: unknown): string {
  return typeof group === 'string' ? group.trim() : '';
}

function inferColumnGroup(key: string, label: string, libraryType: string): string {
  const lt = libraryType.toUpperCase();
  const combined = `${key} ${label}`.toLowerCase();

  if (lt.startsWith('START_HERE') || /start\s*here|starthere/.test(combined)) {
    return 'Start Here';
  }
  if (lt === 'PHASE_2' || /phase\s*2|phase2/.test(combined)) {
    return 'Phase 2';
  }
  if (lt === 'FULL_PROGRAM' || /full\s*program|fullprogram/.test(combined)) {
    return 'Full Program';
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

/** Derive Wall / No Wall from column metadata. */
export function getScheduleColumnVariantLabel(
  column: Pick<DeploymentScheduleTableColumn, 'key' | 'label' | 'libraryType' | 'variantLabel'>,
): string | null {
  if (column.variantLabel?.trim()) return column.variantLabel.trim();

  const key = column.key.toLowerCase();
  const label = column.label.toLowerCase();
  const libraryType = (column.libraryType ?? '').toUpperCase();
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

/** Apply Phase 1 Wall/No Wall labels using column metadata + deployment variant. */
export function enrichScheduleColumns(
  columns: DeploymentScheduleTableColumn[],
  options?: { fieldCategory?: string; exerciseVariant?: string },
): DeploymentScheduleTableColumn[] {
  const deploymentVariant = inferVariantFromDeployment(options?.exerciseVariant);

  return columns.map((column) => {
    const libraryType = column.libraryType ?? null;
    const key = column.key;
    const rawLabel = column.label;
    let group = normalizeColumnGroup(column.group);
    let variantLabel = getScheduleColumnVariantLabel(column);
    const phase1 = isPhase1Column(key, rawLabel, libraryType ?? '', group);

    if (!group) {
      group = inferColumnGroup(key, rawLabel, libraryType ?? '');
    }

    if (phase1 && !group) {
      group = 'Phase 1';
    }

    if (phase1 && !variantLabel) {
      variantLabel = deploymentVariant;
    }

    const normalizedLabel = rawLabel.trim();
    const genericPhase1Label = /^phase\s*1$/i.test(normalizedLabel);

    return {
      ...column,
      group: group || null,
      libraryType,
      variantLabel: variantLabel || null,
      label: genericPhase1Label && variantLabel ? 'Phase 1' : normalizedLabel || key,
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
  return getScheduleColumnVariantLabel(column) ?? column.label;
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
        const variantLabel = getScheduleColumnVariantLabel({
          key,
          label,
          libraryType,
          variantLabel: asString(column.variantLabel) || null,
        });
        // Prefer API group; only legacy Phase-1 multi-column grouping when no categoryId.
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
        const day = Number(row.day ?? row.dayNumber ?? index + 1);
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

        return {
          day: Number.isFinite(day) ? day : index + 1,
          dayLabel: asString(row.dayLabel ?? row.weekday ?? row.dayName) || `Day ${index + 1}`,
          dateLabel: asString(row.dateLabel ?? row.date) || '—',
          rotationDay: Number(row.rotationDay ?? row.rotationDayNumber ?? day) || index + 1,
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
): string {
  if (!isScheduleCellAssigned(cell)) return 'Unassigned';
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
  video: string;
  thumbnail?: string | null;
  assigned: boolean;
}

function getScheduleVideoEntryLabels(column: DeploymentScheduleTableColumn): {
  group: string;
  label: string | null;
  variantLabel: string | null;
} {
  const group = normalizeColumnGroup(column.group) || column.label;
  const variantLabel = getScheduleColumnVariantLabel(column);
  const columnLabel = column.label.trim();

  if (variantLabel) {
    return { group, label: null, variantLabel };
  }

  if (columnLabel && columnLabel.toLowerCase() !== group.toLowerCase()) {
    return { group, label: columnLabel, variantLabel: null };
  }

  return { group, label: null, variantLabel: null };
}

export function getScheduleVideosForDay(
  row: DeploymentScheduleTableRow | undefined,
  columns: DeploymentScheduleTableColumn[],
): ScheduleDayVideoEntry[] {
  if (!row) return [];

  return columns.map((column) => {
    const cell = row.cells?.[column.key];
    const assigned = isScheduleCellAssigned(cell);
    const { group, label, variantLabel } = getScheduleVideoEntryLabels(column);
    return {
      group,
      label,
      variantLabel,
      video: assigned ? asString(cell?.title) : 'Unassigned',
      thumbnail: cell?.thumbnail ?? null,
      assigned,
    };
  });
}

export function formatScheduleDayModalTitle(row: DeploymentScheduleTableRow): string {
  const dayLabel = row.dayLabel.trim();
  const repeatsDayNumber =
    dayLabel.toLowerCase() === `day ${row.day}` ||
    dayLabel.toLowerCase().replace(/\s/g, '') === `day${row.day}`;

  if (repeatsDayNumber || !dayLabel) {
    return `Day ${row.day} — ${row.dateLabel}`;
  }

  return `Day ${row.day} — ${dayLabel}`;
}

export function buildScheduleTableCsv(table: DeploymentScheduleTable): string {
  const headers = [
    'Day',
    'Date',
    'Rotation Day',
    ...table.columns.map((column) => column.label),
  ];

  const lines = table.rows.map((row) =>
    [
      row.dayLabel,
      row.dateLabel,
      row.rotationDay,
      ...table.columns.map((column) => getScheduleCellTitle(row.cells?.[column.key])),
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
