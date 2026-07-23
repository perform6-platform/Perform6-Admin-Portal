import { DayPicker, type DayPickerProps } from 'react-day-picker';
import 'react-day-picker/style.css';
import { cn } from '../../lib/cn';

export type CalendarProps = DayPickerProps;

export function Calendar({ className, captionLayout = 'dropdown', ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      captionLayout={captionLayout}
      className={cn('rdp-perform6 p-3', className)}
      {...props}
    />
  );
}
