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

      <aside className="hidden w-full shrink-0 border-surface-border lg:block lg:w-[200px] xl:w-[220px]">
        <SectionLabel className="mb-3 block">Categories</SectionLabel>
        <nav className="space-y-4">
          {groups.map((group) => (
            <div key={group.groupKey}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.children.map((category) => {
                  const isActive = category.id === activeCategory;
                  const showChip = group.children.length > 1;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onCategoryChange(category.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        showChip
                          ? 'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors'
                          : 'ui-category-nav-item w-full text-left',
                        showChip &&
                          (isActive
                            ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                            : 'border-surface-border bg-surface-muted text-content-secondary hover:text-content-primary'),
                        !showChip &&
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                        !showChip && isActive && 'ui-category-nav-item--active',
                      )}
                    >
                      {showChip ? category.label : group.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
