import type { ContentTypeFilter } from '../../constants/contentLibrary';
import { contentCategoryFilterOptions, contentTypeTabs } from '../../constants/contentLibrary';
import { cn } from '../../lib/cn';
import { Dropdown } from '../ui';

export interface ContentLibraryToolbarProps {
  activeTab: ContentTypeFilter;
  onTabChange: (tab: ContentTypeFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
}

export function ContentLibraryToolbar({
  activeTab,
  onTabChange,
  categoryFilter,
  onCategoryFilterChange,
}: ContentLibraryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 hide-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
        {contentTypeTabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'shrink-0 rounded-md px-3.5 py-1.5 text-body-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                isActive
                  ? 'ui-button-primary shadow-sm'
                  : 'border border-surface-border bg-surface-muted text-content-secondary hover:border-brand-500/20 hover:text-content-primary',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <Dropdown
          options={contentCategoryFilterOptions}
          value={categoryFilter}
          onChange={onCategoryFilterChange}
          fullWidth
          className="w-full lg:w-auto"
        />
      </div>
    </div>
  );
}
