import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

export interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  clearable?: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

function useDropdownMenuPosition(open: boolean, anchorRef: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, anchorRef]);

  return position;
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className,
  disabled = false,
  fullWidth = false,
  clearable = false,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const menuPosition = useDropdownMenuPosition(open, triggerRef);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [open]);

  const menu =
    open && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 400,
            }}
            className={cn(
              'dropdown-menu hide-scrollbar max-h-60 overflow-y-auto rounded-lg py-1',
              'border border-surface-border shadow-lg dark:shadow-black/40',
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isSelected} className="bg-surface">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center bg-surface px-3 py-2 text-left text-body-sm transition-colors',
                      isSelected
                        ? 'bg-brand-50 font-medium text-brand-600 dark:bg-brand-600/20 dark:text-brand-400'
                        : 'text-content-primary hover:bg-surface-muted',
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'relative',
          open ? 'z-[250]' : 'z-0',
          fullWidth ? 'block w-full' : 'inline-block w-auto',
          className,
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'ui-field inline-flex h-9 items-center justify-between gap-2 rounded-lg',
            'px-3 text-sm font-normal',
            fullWidth ? 'w-full' : 'w-auto min-w-[160px]',
            'hover:border-brand-500/30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <span className={cn('truncate', !selected && 'text-content-muted')}>
            {selected?.label ?? placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {clearable && value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange('' as T);
                  setOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange('' as T);
                    setOpen(false);
                  }
                }}
                className="rounded p-0.5 text-content-muted transition-colors hover:bg-surface-muted hover:text-content-primary"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn('h-4 w-4 text-content-muted transition-transform', open && 'rotate-180')}
            />
          </span>
        </button>
      </div>
      {menu}
    </>
  );
}

export interface UserMenuProps {
  name: string;
  role: string;
  avatarUrl?: string;
  options?: DropdownOption[];
  onSelect?: (value: string) => void;
  className?: string;
}

export function UserMenu({
  name,
  role,
  avatarUrl,
  options = [
    { value: 'profile', label: 'Profile' },
    { value: 'settings', label: 'Settings' },
  ],
  onSelect,
  className,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 rounded-lg p-1.5 text-left transition-colors',
          'hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-caption font-semibold text-brand-600">
              {name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-body-sm font-medium text-content-primary">{name}</p>
          <p className="truncate text-caption text-content-muted">{role}</p>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-content-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul className="dropdown-menu absolute right-0 top-full z-[100] mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-surface-border py-1 shadow-lg dark:shadow-black/40">
          {options.map((option) => (
            <li key={option.value} className="bg-surface">
              <button
                type="button"
                onClick={() => {
                  onSelect?.(option.value);
                  setOpen(false);
                }}
                className="flex w-full bg-surface px-3 py-2 text-left text-body-sm text-content-primary hover:bg-surface-muted"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
