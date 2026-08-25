import { CalendarDays, Film } from 'lucide-react';
import type { ContentItem } from '../../constants/contentLibrary';
import type { ContentCategoryId } from '../../constants/contentPlayback';
import { ROTATION_DAYS } from '../../constants/contentPlayback';
import { Badge } from '../ui';
import { cn } from '../../lib/cn';
import type { VideoAssignmentState } from '../../lib/rotationAssignments';

interface RotationVideoCardProps {
  video: ContentItem;
  categoryId: ContentCategoryId;
  usesRotation: boolean;
  assignment: VideoAssignmentState;
  onChange: (next: VideoAssignmentState) => void;
}

const dayOptions = Array.from({ length: ROTATION_DAYS }, (_, index) => index + 1);

export function RotationVideoCard({
  video,
  usesRotation,
  assignment,
  onChange,
}: RotationVideoCardProps) {
  return (
    <li
      className={cn(
        'flex flex-col gap-4 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center',
        assignment.included
          ? 'border-brand-300 bg-brand-50/50 dark:border-brand-600/40 dark:bg-brand-600/10'
          : 'border-surface-border bg-surface-muted/30',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-surface-border bg-gradient-to-br from-p6-gray-300 to-p6-gray-400 dark:from-p6-gray-700 dark:to-p6-gray-900">
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="h-5 w-5 text-content-muted" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {usesRotation && assignment.included && (
              <span className="text-caption font-medium text-brand-600 dark:text-brand-400">
                Day {assignment.day}
              </span>
            )}
            <Badge variant="success">Uploaded</Badge>
          </div>
          <p className="truncate text-body-sm font-medium text-content-primary">{video.title}</p>
          <p className="text-caption text-content-secondary">
            {video.duration ?? '—'} · {video.format}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {usesRotation ? (
          <>
            <label className="flex cursor-pointer items-center gap-2 text-body-sm text-content-secondary">
              <input
                type="checkbox"
                checked={assignment.included}
                onChange={(event) =>
                  onChange({ ...assignment, included: event.target.checked })
                }
                className="h-4 w-4 rounded border-surface-border text-brand-600 focus:ring-brand-500"
              />
              Include
            </label>
            <label className="flex items-center gap-2 text-body-sm text-content-secondary">
              <CalendarDays className="h-3.5 w-3.5" />
              <select
                value={assignment.day ?? 1}
                disabled={!assignment.included}
                onChange={(event) =>
                  onChange({ ...assignment, day: Number(event.target.value) })
                }
                className="h-8 rounded-md border border-surface-border bg-surface px-2 text-body-sm text-content-primary disabled:opacity-50"
              >
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 text-body-sm text-content-secondary">
            <input
              type="checkbox"
              checked={assignment.included}
              onChange={(event) =>
                onChange({
                  included: event.target.checked,
                  day: 1,
                })
              }
              className="h-4 w-4 rounded border-surface-border text-brand-600 focus:ring-brand-500"
            />
            Use this video
          </label>
        )}
      </div>
    </li>
  );
}
