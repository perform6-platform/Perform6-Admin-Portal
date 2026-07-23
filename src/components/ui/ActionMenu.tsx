import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './IconButton';

export interface ActionMenuItem {
  value: string;
  label: string;
  variant?: 'default' | 'danger';
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  triggerLabel?: string;
  trigger?: ReactNode;
  className?: string;
}

export function ActionMenu({
  items,
  onSelect,
  align = 'right',
  triggerLabel = 'More actions',
  trigger,
  className,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {trigger ? (
        <span
          onClick={(event) => {
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          {trigger}
        </span>
      ) : (
        <IconButton
          label={triggerLabel}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          <MoreVertical className="h-4 w-4 text-current" />
        </IconButton>
      )}

      {open && (
        <ul
          id={menuId}
          role="menu"
          className={cn(
            'dropdown-menu absolute z-[120] mt-1 min-w-[140px] overflow-hidden rounded-lg py-1',
            'border border-surface-border shadow-lg dark:shadow-black/40',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <li key={item.value} role="none" className="bg-surface">
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(item.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center bg-surface px-3 py-2 text-left text-body-sm transition-colors',
                  item.variant === 'danger'
                    ? 'text-status-danger hover:bg-[rgba(234,84,85,0.08)]'
                    : 'text-content-primary hover:bg-surface-muted',
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
