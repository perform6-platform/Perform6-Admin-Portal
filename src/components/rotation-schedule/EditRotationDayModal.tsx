import { useEffect, useMemo, useState } from 'react';
import type { ContentCategoryId } from '../../constants/contentLibrary';
import { getFullCategoryLabel, getPlaybackCategoryForContent } from '../../constants/contentPlayback';
import type { ContentTrack, PlaybackCategoryId } from '../../constants/contentPlayback';
import { ROTATION_DAYS } from '../../constants/contentPlayback';
import {
  getScheduleColumnForCategory,
  rotationEditableColumns,
  toScheduleVideoName,
  type RotationScheduleColumnKey,
  type RotationScheduleRow,
} from '../../constants/rotationSchedule';
import {
  contentTrackOptions,
  exerciseVariationOptions,
  getContentTrackFromCategoryId,
  getExerciseVariationFromCategoryId,
  getScheduleWizardStepLabel,
  getScheduleWizardSteps,
  resolveDeploymentCategoryId,
  touchScreenProgramOptions,
  type ExerciseVariation,
  type ScheduleWizardStepKind,
} from '../../lib/deploymentHelpers';
import { cn } from '../../lib/cn';
import { Button, Dropdown, Input, Modal, ModalBody, SectionLabel } from '../ui';

const dayOptions = Array.from({ length: ROTATION_DAYS }, (_, index) => {
  const day = index + 1;
  return { value: String(day), label: `Day ${day}` };
});

export interface EditRotationDayModalProps {
  open: boolean;
  initialDay?: number;
  focusCategoryId?: ContentCategoryId;
  fromDeployment?: boolean;
  getRowByDay: (day: number) => RotationScheduleRow | undefined;
  onClose: () => void;
  onSave: (day: number, updates: Partial<Record<RotationScheduleColumnKey, string>>) => void;
}

export function EditRotationDayModal({
  open,
  initialDay = 14,
  focusCategoryId,
  fromDeployment = false,
  getRowByDay,
  onClose,
  onSave,
}: EditRotationDayModalProps) {
  const [selectedDay, setSelectedDay] = useState(String(initialDay));
  const [wizardIndex, setWizardIndex] = useState(0);
  const [contentTrack, setContentTrack] = useState<ContentTrack>('fitness');
  const [exerciseVariation, setExerciseVariation] = useState<ExerciseVariation>('wall');
  const [playbackCategory, setPlaybackCategory] = useState<PlaybackCategoryId>('default');
  const [videoName, setVideoName] = useState('');

  const isDeploymentFocus = Boolean(focusCategoryId);
  const wizardSteps = useMemo(() => getScheduleWizardSteps(playbackCategory), [playbackCategory]);
  const currentWizardStep = wizardSteps[wizardIndex] ?? 'category';
  const isLastWizardStep = wizardIndex >= wizardSteps.length - 1;

  const resolvedCategoryId = useMemo(
    () =>
      focusCategoryId ??
      resolveDeploymentCategoryId(playbackCategory, contentTrack, exerciseVariation),
    [focusCategoryId, playbackCategory, contentTrack, exerciseVariation],
  );

  const scheduleColumn = getScheduleColumnForCategory(resolvedCategoryId);
  const scheduleLabel = getFullCategoryLabel(resolvedCategoryId);
  const columnMeta = rotationEditableColumns.find((column) => column.key === scheduleColumn);

  useEffect(() => {
    if (!open) return;
    setSelectedDay(String(initialDay));
    setWizardIndex(0);

    if (focusCategoryId) {
      setPlaybackCategory(getPlaybackCategoryForContent(focusCategoryId));
      setContentTrack(getContentTrackFromCategoryId(focusCategoryId));
      setExerciseVariation(getExerciseVariationFromCategoryId(focusCategoryId));
    } else {
      setContentTrack('fitness');
      setExerciseVariation('wall');
      setPlaybackCategory('default');
    }
  }, [open, initialDay, focusCategoryId]);

  useEffect(() => {
    if (!open) return;
    const day = Number.parseInt(selectedDay, 10);
    const row = getRowByDay(day);
    if (!row) return;
    setVideoName(row[scheduleColumn] ?? '');
  }, [open, selectedDay, scheduleColumn, getRowByDay]);

  useEffect(() => {
    if (wizardIndex >= wizardSteps.length) {
      setWizardIndex(Math.max(0, wizardSteps.length - 1));
    }
  }, [wizardIndex, wizardSteps.length]);

  function handleClose() {
    onClose();
  }

  function handleSave() {
    const day = Number.parseInt(selectedDay, 10);
    if (!Number.isFinite(day) || day < 1 || day > ROTATION_DAYS) return;
    onSave(day, { [scheduleColumn]: toScheduleVideoName(videoName) });
    handleClose();
  }

  function handleWizardNext() {
    if (!isLastWizardStep) {
      setWizardIndex((current) => current + 1);
      return;
    }
    handleSave();
  }

  function handleWizardBack() {
    if (wizardIndex > 0) {
      setWizardIndex((current) => current - 1);
    }
  }

  function renderWizardStep(step: ScheduleWizardStepKind) {
    switch (step) {
      case 'category':
        return (
          <RadioOptionGroup
            label="Select category"
            options={contentTrackOptions}
            value={contentTrack}
            onChange={setContentTrack}
          />
        );
      case 'variation':
        return (
          <RadioOptionGroup
            label="Exercise variation"
            options={exerciseVariationOptions}
            value={exerciseVariation}
            onChange={setExerciseVariation}
          />
        );
      case 'program':
        return (
          <RadioOptionGroup
            label="Select program"
            options={touchScreenProgramOptions}
            value={playbackCategory}
            onChange={(value) => {
              setPlaybackCategory(value);
              const nextSteps = getScheduleWizardSteps(value);
              if (wizardIndex > nextSteps.length - 1) {
                setWizardIndex(nextSteps.length - 1);
              }
            }}
          />
        );
      case 'video':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-surface-border bg-surface-muted/30 px-4 py-3">
              <p className="text-caption text-content-muted">Program slot</p>
              <p className="text-body-sm font-medium text-content-primary">{scheduleLabel}</p>
            </div>
            <Input
              label="Video filename"
              value={videoName}
              onChange={(event) => setVideoName(event.target.value)}
              placeholder="e.g. 14_Screen 2_Fitness_Wall"
            />
            <p className="text-caption text-content-muted">
              This video will play on the selected rotation day for {scheduleLabel}.
            </p>
          </div>
        );
      default:
        return null;
    }
  }

  const footer = isDeploymentFocus ? (
    <>
      <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={handleClose}>
        Cancel
      </Button>
      <Button type="button" size="sm" className="h-9 px-4" onClick={handleSave}>
        Save schedule
      </Button>
    </>
  ) : (
    <>
      <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={handleClose}>
        Cancel
      </Button>
      {wizardIndex > 0 && (
        <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={handleWizardBack}>
          Back
        </Button>
      )}
      <Button type="button" size="sm" className="h-9 px-4" onClick={handleWizardNext}>
        {isLastWizardStep ? 'Save schedule' : 'Next'}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={fromDeployment ? 'Schedule deployed video' : 'Edit schedule day'}
      description={
        fromDeployment
          ? 'Confirm or adjust when this deployed video plays in the rotation.'
          : 'Choose the program slot and set the video for this rotation day.'
      }
      size="lg"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">Rotation day</label>
            <Dropdown options={dayOptions} value={selectedDay} onChange={setSelectedDay} fullWidth />
            <p className="mt-1.5 text-caption text-content-muted">
              Day {selectedDay} of {ROTATION_DAYS}.
            </p>
          </div>

          {isDeploymentFocus ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-600/30 dark:bg-brand-600/10">
                <p className="text-caption font-medium text-brand-700 dark:text-brand-300">
                  Deployed content
                </p>
                <p className="mt-1 text-body-sm font-medium text-content-primary">{scheduleLabel}</p>
                <p className="mt-0.5 text-caption text-content-secondary">
                  {columnMeta?.group} · {columnMeta?.label}
                </p>
              </div>
              <Input
                label="Video filename"
                value={videoName}
                onChange={(event) => setVideoName(event.target.value)}
                placeholder="e.g. 14_Screen 2_Fitness_Wall"
              />
              <p className="text-caption text-content-muted">
                Set when this video plays on Day {selectedDay} for all devices.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-t border-surface-border pt-4">
                <SectionLabel className="block">{getScheduleWizardStepLabel(currentWizardStep)}</SectionLabel>
                <p className="text-caption text-content-muted">
                  Step {wizardIndex + 1} of {wizardSteps.length}
                </p>
              </div>
              {renderWizardStep(currentWizardStep)}
              {!isLastWizardStep && (
                <div className="rounded-lg border border-dashed border-surface-border px-4 py-3 text-body-sm text-content-secondary">
                  Scheduling: <strong className="text-content-primary">{scheduleLabel}</strong> on Day{' '}
                  {selectedDay}
                </div>
              )}
            </>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

function RadioOptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                selected
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-600/10'
                  : 'border-surface-border hover:border-brand-500/30',
              )}
            >
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 shrink-0 accent-brand-600"
              />
              <span className="text-body-sm font-medium text-content-primary">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
