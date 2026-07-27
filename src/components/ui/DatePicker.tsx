import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatDateLabel } from '../../lib/formatDateLabel';
import { cn } from '../../lib/cn';
import { Calendar } from './Calendar';
import { CARD_SURFACE_CLASS } from './cardStyles';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

interface CalendarPosition {
  top: number;
  left: number;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(value ?? new Date());
  const [position, setPosition] = useState<CalendarPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setDate(value);
  }, [value]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || calendarRef.current?.contains(target)) return;
      setOpen(false);
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
  }, [open]);

  const calendar =
    open && position
      ? createPortal(
          <div
            ref={calendarRef}
            role="dialog"
            aria-label="Calendar"
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 250,
            }}
            className={cn(CARD_SURFACE_CLASS, 'w-max overflow-hidden p-0 shadow-lg')}
          >
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={(selected) => {
                if (!selected) return;
                setDate(selected);
                onChange?.(selected);
                setOpen(false);
              }}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={containerRef} className={cn('relative w-full sm:inline-block sm:w-auto', className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Select date"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'ui-field inline-flex w-full items-center gap-2 rounded-lg px-4 py-2 sm:w-auto',
            'text-body-sm hover:border-brand-500/30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
          )}
        >
          <CalendarIcon className="h-4 w-4 text-content-muted" />
          <span>{formatDateLabel(date)}</span>
        </button>
      </div>
      {calendar}
    </>
  );
}
