import type { ContentCategoryId } from '../../constants/contentLibrary';
import type { CategoryGroup } from '../../constants/contentPlayback';
import { cn } from '../../lib/cn';
import { Dropdown, SectionLabel } from '../ui';

export interface CategorySidebarProps {
  groups: CategoryGroup[];
  activeCategory: ContentCategoryId;
  onCategoryChange: (categoryId: ContentCategoryId) => void;
}

export function CategorySidebar({
  groups,
  activeCategory,
  onCategoryChange,
}: CategorySidebarProps) {
  const mobileCategoryOptions = groups.flatMap((group) =>
    group.children.map((category) => ({
      value: category.id,
      label:
        group.children.length === 1
          ? group.label
          : category.description
            ? `${group.label} — ${category.label} (${category.description})`
            : `${group.label} — ${category.label}`,
    })),
  );

  return (
    <>
      <div className="lg:hidden">
        <SectionLabel className="mb-2 block">Category</SectionLabel>
        <Dropdown
          options={mobileCategoryOptions}
          value={activeCategory}
          onChange={(value) => onCategoryChange(value)}
          fullWidth
        />
      </div>

      <aside className="hidden w-full shrink-0 border-surface-border lg:block lg:w-[240px] xl:w-[260px]">
        <SectionLabel className="mb-4 block">Categories</SectionLabel>
        <nav className="space-y-0 divide-y divide-surface-border">
          {groups.map((group) => {
            const isFullWidth = group.children.length === 1;
            const hasDescriptions = group.children.some((child) => Boolean(child.description));

            return (
              <div key={group.groupKey} className="py-3 first:pt-0 last:pb-0">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                  {group.label}
                </p>
                <div
                  className={cn(
                    isFullWidth ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2',
                  )}
                >
                  {group.children.map((category) => {
                    const isActive = category.id === activeCategory;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => onCategoryChange(category.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex w-full flex-col items-start justify-center rounded-md border px-2 text-left transition-colors',
                          hasDescriptions && !isFullWidth ? 'min-h-[3.25rem] py-2' : 'py-2',
                          'text-[13px] font-medium leading-tight',
                          isActive
                            ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                            : 'border-surface-border bg-[#f3f4f6] text-content-primary hover:bg-surface-muted',
                        )}
                      >
                        <span>{isFullWidth ? group.label : category.label}</span>
                        {category.description ? (
                          <span
                            className={cn(
                              'mt-0.5 text-[10px] font-normal leading-snug',
                              isActive ? 'text-brand-600/80 dark:text-brand-300/80' : 'text-content-muted',
                            )}
                          >
                            {category.description}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
