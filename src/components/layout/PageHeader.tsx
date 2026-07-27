import { CARD_SURFACE_CLASS } from '../ui/cardStyles';
import { cn } from '../../lib/cn';
import HeaderUserMenu from './HeaderUserMenu';

const PAGE_HEADER_ACTIONS_CLASS =
  'flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4';

export default function PageHeader() {
  return (
    <header
      className={cn(
        CARD_SURFACE_CLASS,
        'mb-4 hidden flex-col gap-4 p-4 sm:mb-8 lg:flex lg:flex-row lg:items-center lg:justify-between lg:p-6',
      )}
    >
      <div>
        <p className="text-caption font-medium text-content-muted">Welcome back</p>
        <h1 className="text-page-title text-content-primary">
          Admin Panel
        </h1>
      </div>
      <div className={PAGE_HEADER_ACTIONS_CLASS}>
        <HeaderUserMenu />
      </div>
    </header>
  );
}
