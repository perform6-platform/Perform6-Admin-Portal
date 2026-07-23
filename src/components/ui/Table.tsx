import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS } from './cardStyles';

export interface TableColumn<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
  render: (row: T, index: number) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  selectedRowKey?: string;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T, index: number) => ReactNode;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data available',
  className,
  selectedRowKey,
  onRowClick,
  renderMobileCard,
}: TableProps<T>) {
  const useMobileCards = Boolean(renderMobileCard);

  return (
    <div className={cn(CARD_SURFACE_CLASS, 'overflow-hidden p-0', className)}>
      {data.length === 0 ? (
        <p className="px-4 py-12 text-center text-body-sm text-content-muted">{emptyMessage}</p>
      ) : (
        <>
          {useMobileCards && (
            <div className="divide-y divide-surface-border md:hidden">
              {data.map((row, index) => (
                <div key={rowKey(row)} className="p-4">
                  {renderMobileCard!(row, index)}
                </div>
              ))}
            </div>
          )}

          <div className={cn(useMobileCards && 'hidden md:block')}>
            {useMobileCards && (
              <p className="scroll-hint px-4 pt-3 text-caption text-content-muted lg:hidden">
                Swipe horizontally to view all columns →
              </p>
            )}
            <div className="table-scroll-x overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left lg:min-w-[720px]">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-muted/50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={cn(
                          'whitespace-nowrap px-4 py-3 text-table-header uppercase text-content-secondary',
                          column.hideOnMobile && 'hidden md:table-cell',
                          column.headerClassName,
                        )}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => {
                    const key = rowKey(row);
                    const isSelected = selectedRowKey === key;

                    return (
                      <tr
                        key={key}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(
                          'border-b border-surface-border last:border-b-0 transition-colors',
                          onRowClick && 'cursor-pointer',
                          isSelected
                            ? 'bg-brand-50/70 dark:bg-brand-600/10'
                            : 'hover:bg-surface-muted/40',
                        )}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              'px-4 py-3.5 text-body-sm text-content-primary',
                              column.hideOnMobile ? 'hidden md:table-cell' : 'whitespace-nowrap',
                              column.className,
                            )}
                          >
                            {column.render(row, index)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
