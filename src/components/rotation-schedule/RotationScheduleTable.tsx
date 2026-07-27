import { Eye, Pencil } from 'lucide-react';
import type {
  DeploymentScheduleTableColumn,
  DeploymentScheduleTableRow,
} from '../../types/deployments';
import {
  getScheduleColumnVariantLabel,
  groupScheduleColumns,
  hasScheduleVariantSubHeaders,
  scheduleColumnNeedsVariantSubHeader,
  scheduleGroupNeedsSubHeaderRow,
} from '../../lib/scheduleTable';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui';
import { CARD_SURFACE_CLASS } from '../ui/cardStyles';
import { ScheduleTableCell } from './ScheduleTableCell';

const SCHEDULE_FOOTER_NOTE =
  'Schedule preview from the deployment API. Assign videos in Rotation to update each day.';

const FIXED_COLUMNS = [
  { key: 'day', label: 'Day' },
  { key: 'date', label: 'Date' },
  { key: 'rotationDay', label: 'Rotation Day' },
] as const;

const thBaseClass =
  'whitespace-nowrap px-4 py-2 text-center text-table-header font-semibold uppercase';

function isGolfColumn(column: DeploymentScheduleTableColumn): boolean {
  const libraryType = (column.libraryType ?? '').toUpperCase();
  const combined = `${column.key} ${column.label} ${column.group ?? ''}`.toLowerCase();
  return libraryType.includes('GOLF') || combined.includes('golf');
}

function isFitnessColumn(column: DeploymentScheduleTableColumn): boolean {
  const libraryType = (column.libraryType ?? '').toUpperCase();
  const combined = `${column.key} ${column.label} ${column.group ?? ''}`.toLowerCase();
  return libraryType.includes('FITNESS') || combined.includes('fitness');
}

/** Perform6 schedule header theme — group / track / variant tiers. */
function getScheduleHeaderClass(
  column: DeploymentScheduleTableColumn,
  tier: 'group' | 'track' | 'variant',
): string {
  if (tier === 'group') {
    return 'rotation-schedule-header-group';
  }

  if (tier === 'track') {
    if (isGolfColumn(column)) return 'rotation-schedule-header-golf';
    if (isFitnessColumn(column)) return 'rotation-schedule-header-fitness';
    return 'rotation-schedule-header-group';
  }

  if (isGolfColumn(column)) return 'rotation-schedule-header-golf-leaf';
  return 'rotation-schedule-header-fitness-leaf';
}

export interface RotationScheduleTableProps {
  columns: DeploymentScheduleTableColumn[];
  rows: DeploymentScheduleTableRow[];
  isEditing?: boolean;
  onEditDay?: (day: number) => void;
  highlightCell?: { day: number; columnKey: string };
  highlightRotationDay?: number;
  showViewActions?: boolean;
  onViewRow?: (row: DeploymentScheduleTableRow) => void;
  footerNote?: string;
}

function RotationScheduleTableHeader({
  columns,
  showActions,
  showViewActions,
  headerRowCount,
  columnGroups,
}: {
  columns: DeploymentScheduleTableColumn[];
  showActions: boolean;
  showViewActions: boolean;
  headerRowCount: number;
  columnGroups: ReturnType<typeof groupScheduleColumns>;
}) {
  const useSubHeaderRow = headerRowCount >= 2;

  function renderDynamicHeaders() {
    if (!useSubHeaderRow) {
      return columns.map((column) => (
        <th
          key={column.key}
          className={cn(thBaseClass, getScheduleHeaderClass(column, 'group'))}
        >
          {normalizeColumnGroupLabel(column)}
        </th>
      ));
    }

    return columnGroups.flatMap((group) => {
      const needsSubRow = scheduleGroupNeedsSubHeaderRow(group.columns);
      const groupLabel = group.label || group.columns[0]?.label || '';

      if (!needsSubRow) {
        return group.columns.map((column) => (
          <th
            key={column.key}
            rowSpan={2}
            className={cn(thBaseClass, 'rotation-schedule-header-group')}
          >
            {groupLabel || column.label}
          </th>
        ));
      }

      if (group.label && group.columns.length > 1) {
        return [
          <th
            key={group.label}
            colSpan={group.columns.length}
            className={cn(thBaseClass, 'rotation-schedule-header-group')}
          >
            {group.label}
          </th>,
        ];
      }

      return group.columns.map((column) => (
        <th key={column.key} className={cn(thBaseClass, 'rotation-schedule-header-group')}>
          {group.label || column.label}
        </th>
      ));
    });
  }

  function renderSubHeaderRow() {
    return columnGroups.flatMap((group) => {
      if (!scheduleGroupNeedsSubHeaderRow(group.columns)) {
        return [];
      }

      if (group.label && group.columns.length > 1) {
        return group.columns.map((column) => {
          const leafLabel = getScheduleColumnVariantLabel(column) ?? column.label;
          const tier =
            getScheduleColumnVariantLabel(column) ||
            /wall|no wall/i.test(column.label)
              ? 'variant'
              : 'track';
          return (
            <th key={column.key} className={cn(thBaseClass, getScheduleHeaderClass(column, tier))}>
              {leafLabel}
            </th>
          );
        });
      }

      return group.columns
        .filter(scheduleColumnNeedsVariantSubHeader)
        .map((column) => (
          <th
            key={column.key}
            className={cn(thBaseClass, getScheduleHeaderClass(column, 'variant'))}
          >
            {getScheduleColumnVariantLabel(column)}
          </th>
        ));
    });
  }

  return (
    <thead>
      <tr>
        {showActions && (
          <th
            rowSpan={headerRowCount}
            className={cn(thBaseClass, 'rotation-schedule-header-neutral w-12')}
          >
            Edit
          </th>
        )}
        {FIXED_COLUMNS.map((column) => (
          <th
            key={column.key}
            rowSpan={headerRowCount}
            className={cn(thBaseClass, 'rotation-schedule-header-neutral')}
          >
            {column.label}
          </th>
        ))}
        {renderDynamicHeaders()}
        {showViewActions && (
          <th
            rowSpan={headerRowCount}
            className={cn(thBaseClass, 'rotation-schedule-header-neutral w-12')}
          >
            View
          </th>
        )}
      </tr>

      {useSubHeaderRow && <tr>{renderSubHeaderRow()}</tr>}
    </thead>
  );
}

function normalizeColumnGroupLabel(column: DeploymentScheduleTableColumn): string {
  const group = column.group?.trim();
  if (group) return group;
  return column.label;
}

export function RotationScheduleTable({
  columns = [],
  rows = [],
  isEditing = false,
  onEditDay,
  highlightCell,
  highlightRotationDay,
  showViewActions = false,
  onViewRow,
  footerNote,
}: RotationScheduleTableProps) {
  const columnGroups = groupScheduleColumns(columns);
  const headerRowCount = hasScheduleVariantSubHeaders(columns) ? 2 : 1;
  const showActions = isEditing && Boolean(onEditDay);
  const totalColumns =
    FIXED_COLUMNS.length + columns.length + (showActions ? 1 : 0) + (showViewActions ? 1 : 0);
  const resolvedFooterNote =
    footerNote ??
    (showViewActions
      ? 'Deployment schedule preview. Use View on any row to see all videos for that day.'
      : SCHEDULE_FOOTER_NOTE);

  return (
    <div className={cn(CARD_SURFACE_CLASS, 'overflow-hidden p-0')}>
      {isEditing && (
        <div className="border-b border-surface-border bg-brand-50/50 px-4 py-2 text-body-sm text-brand-700 dark:bg-brand-600/10 dark:text-brand-300">
          {highlightCell
            ? 'Deployed video highlighted below — tap Edit to adjust the schedule.'
            : 'Edit mode — choose category and program, then set the video for each day.'}
        </div>
      )}

      <p className="scroll-hint px-4 pt-4 text-caption text-content-muted">
        Swipe horizontally to view all columns →
      </p>
      <div className="rotation-schedule-scroll table-scroll-x w-full max-w-full max-h-[min(70vh,720px)] overflow-auto overscroll-contain">
        <table className="rotation-schedule-table w-full min-w-[960px] border-collapse text-left xl:min-w-[1200px]">
          <RotationScheduleTableHeader
            columns={columns}
            showActions={showActions}
            showViewActions={showViewActions}
            headerRowCount={headerRowCount}
            columnGroups={columnGroups}
          />
          <tbody>
            {rows.map((row, index) => {
              const isHighlightedRow =
                highlightRotationDay === row.rotationDay || highlightCell?.day === row.day;
              return (
                <tr
                  key={`${row.day}-${row.dateLabel}`}
                  className={cn(
                    'border-b border-surface-border transition-colors',
                    isHighlightedRow
                      ? 'bg-brand-50'
                      : index % 2 === 1
                        ? 'bg-surface-muted hover:bg-[#F2F7FF]'
                        : 'bg-surface hover:bg-[#F2F7FF]',
                  )}
                >
                  {showActions && (
                    <td className="px-2 py-2 text-center">
                      <IconButton
                        label={`Edit Day ${row.day}`}
                        className="mx-auto h-8 w-8"
                        onClick={() => onEditDay?.(row.day)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                    </td>
                  )}
                  <td className="px-4 py-2 text-body-sm text-content-primary">
                    {row.dayLabel}
                  </td>
                  <td className="px-4 py-2 text-body-sm text-content-primary">
                    {row.dateLabel}
                  </td>
                  <td className="px-4 py-2 text-body-sm text-content-primary">
                    {row.rotationDay}
                  </td>
                  {columns.map((column) => {
                    const isHighlightedCell =
                      highlightCell?.day === row.day && highlightCell.columnKey === column.key;
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-2',
                          isHighlightedCell && 'bg-brand-50',
                        )}
                      >
                        <ScheduleTableCell
                          cell={row.cells?.[column.key]}
                          variantLabel={getScheduleColumnVariantLabel(column)}
                          showVariant={Boolean(getScheduleColumnVariantLabel(column))}
                        />
                      </td>
                    );
                  })}
                  {showViewActions && onViewRow && (
                    <td className="px-2 py-2 text-center">
                      <IconButton
                        label={`View Day ${row.day} videos`}
                        className="mx-auto h-8 w-8"
                        onClick={() => onViewRow(row)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </IconButton>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={totalColumns}
                className="bg-surface-muted/80 px-4 py-4 text-center text-body-sm text-content-secondary"
              >
                {resolvedFooterNote}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
