import { Menu } from 'lucide-react';
import { useMobileNav } from '../../context/MobileNavContext';
import { cn } from '../../lib/cn';
import { ThemeToggle } from '../ui';
import HeaderUserMenu from './HeaderUserMenu';

export default function MobileNavBar() {
  const { toggle } = useMobileNav();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 shrink-0 border-b border-surface-border bg-surface lg:hidden',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Open menu"
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            'border border-surface-border bg-surface text-content-secondary',
            'hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
          )}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-caption font-medium leading-tight text-content-muted">Welcome back</p>
          <p className="truncate text-sm font-bold leading-tight text-content-primary sm:text-base">
            Admin Panel
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
