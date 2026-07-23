import { format, isToday } from 'date-fns';

export function formatDateLabel(date: Date): string {
  const formatted = format(date, 'd MMM yyyy');
  return isToday(date) ? `Today, ${formatted}` : format(date, 'EEE, d MMM yyyy');
}
