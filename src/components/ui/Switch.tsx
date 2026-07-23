import { useId, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onChange, label, className, id, ...props }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className={cn('flex shrink-0 items-center gap-2.5', className)}>
      {label && (
        <label htmlFor={switchId} className="cursor-pointer whitespace-nowrap text-body-sm text-content-primary">
          {label}
        </label>
      )}
      <button
        {...props}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'ui-switch',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        )}
      >
        <span className="ui-switch-thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
