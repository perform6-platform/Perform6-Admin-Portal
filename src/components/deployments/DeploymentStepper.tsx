import { cn } from '../../lib/cn';

const DEFAULT_STEPS = [
  { id: 1, label: 'Configuration' },
  { id: 2, label: 'Device' },
  { id: 3, label: 'Preview' },
  { id: 4, label: 'Finalize' },
];

export interface DeploymentStepperProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

export function DeploymentStepper({
  currentStep,
  totalSteps = DEFAULT_STEPS.length,
  className,
}: DeploymentStepperProps) {
  const steps = DEFAULT_STEPS.slice(0, totalSteps).map((step, index) => ({
    ...step,
    id: index + 1,
  }));

  return (
    <ol className={cn('flex flex-wrap items-center gap-2 sm:gap-3', className)}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = step.id < currentStep;

        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                  isActive || isComplete
                    ? 'bg-brand-600 text-white'
                    : 'border border-surface-border bg-surface-muted text-content-muted',
                )}
              >
                {step.id}
              </span>
              <span
                className={cn(
                  'hidden text-body-sm font-medium sm:inline',
                  isActive ? 'text-content-primary' : 'text-content-secondary',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className="hidden h-px w-6 bg-surface-border sm:block lg:w-10" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
