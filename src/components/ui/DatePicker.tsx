import { useEffect, useRef, useState } from 'react';
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

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(value ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setDate(value);
  }, [value]);

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
    <div ref={containerRef} className={cn('relative w-full sm:inline-block sm:w-auto', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Select date"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'ui-field inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 sm:w-auto',
          'text-body-sm hover:border-brand-500/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        )}
      >
        <CalendarIcon className="h-4 w-4 text-content-muted" />
        <span>{formatDateLabel(date)}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Calendar"
          className={cn(
            CARD_SURFACE_CLASS,
            'absolute left-0 right-0 z-50 mt-2 overflow-hidden p-0 sm:left-auto sm:right-0 sm:w-max',
          )}
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
        </div>
      )}
    </div>
  );
}
