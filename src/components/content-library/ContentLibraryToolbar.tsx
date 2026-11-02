import type { ContentTypeFilter } from '../../constants/contentLibrary';
import { contentTypeTabs } from '../../constants/contentLibrary';
import { cn } from '../../lib/cn';

export interface ContentLibraryToolbarProps {
  activeTab: ContentTypeFilter;
  onTabChange: (tab: ContentTypeFilter) => void;
}

export function ContentLibraryToolbar({
  activeTab,
  onTabChange,
}: ContentLibraryToolbarProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2 hide-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
        {contentTypeTabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'shrink-0 cursor-default rounded-md px-4 py-2 text-body-sm font-medium transition-colors',
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
    </div>
  );
}
