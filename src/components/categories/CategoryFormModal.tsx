import { useEffect, useState } from 'react';
import { Button, Input, Modal } from '../ui';
import type {
  CategoryScope,
  ContentCategory,
  DayPlaybackMode,
} from '../../types/categories';

const SCOPE_OPTIONS: Array<{
  value: CategoryScope;
  title: string;
  description: string;
  playlists: string;
}> = [
  {
    value: 'GLOBAL',
    title: 'Global',
    description: 'Same videos for Fitness and Golf deployments (like Phase 2 / Full Program).',
    playlists: '1 playlist',
  },
  {
    value: 'BY_FIELD',
    title: 'By field',
    description: 'Separate Fitness and Golf playlists (like Default / Start Here).',
    playlists: '2 playlists',
  },
  {
    value: 'BY_FIELD_AND_VARIANT',
    title: 'By field + variant',
    description: 'Fitness/Golf × Wall/No Wall (like Phase 1).',
    playlists: '4 playlists',
  },
  {
    value: 'BY_NAMED_PLAYLIST',
    title: 'Named programs',
    description: 'Fixed sub-programs chosen per screen at deployment (like 15 Minutes A–D).',
    playlists: '4 programs',
  },
];

export interface CategoryFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  category?: ContentCategory | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    dayPlaybackMode: DayPlaybackMode;
    scope?: CategoryScope;
    description?: string;
  }) => void | Promise<void>;
}

export function CategoryFormModal({
  open,
  mode,
  category,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dayPlaybackMode, setDayPlaybackMode] = useState<DayPlaybackMode>('LOOP');
  const [scope, setScope] = useState<CategoryScope>('BY_FIELD');

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && category) {
      setName(category.name);
      setDescription(category.description ?? '');
      setDayPlaybackMode(category.dayPlaybackMode);
      setScope(category.scope);
      return;
    }
    setName('');
    setDescription('');
    setDayPlaybackMode('LOOP');
    setScope('BY_FIELD');
  }, [open, mode, category]);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({
      name: trimmed,
      dayPlaybackMode,
      ...(mode === 'create' ? { scope } : {}),
      description: description.trim() || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Create category' : 'Edit category'}
      description={
        mode === 'create'
          ? 'Define name, day playback, and content scope. The system auto-creates playlists and 36-day sessions for each track.'
          : 'Name and playback mode can change. Scope and playlists stay fixed after create.'
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-content-muted">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Recovery Flow"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-content-muted">Each day&apos;s video will</p>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-surface-border p-4 hover:bg-surface-muted/40">
              <input
                type="radio"
                name="dayPlaybackMode"
                className="mt-1"
                checked={dayPlaybackMode === 'LOOP'}
                onChange={() => setDayPlaybackMode('LOOP')}
              />
              <span>
                <span className="block text-body-sm font-medium text-content-primary">
                  Loop all day
                </span>
                <span className="block text-caption text-content-secondary">
                  That day&apos;s video repeats until the next rotation day.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-surface-border p-4 hover:bg-surface-muted/40">
              <input
                type="radio"
                name="dayPlaybackMode"
                className="mt-1"
                checked={dayPlaybackMode === 'ONCE'}
                onChange={() => setDayPlaybackMode('ONCE')}
              />
              <span>
                <span className="block text-body-sm font-medium text-content-primary">
                  Play once per day
                </span>
                <span className="block text-caption text-content-secondary">
                  That day&apos;s video plays one time, then the player stops / idles.
                </span>
              </span>
            </label>
          </div>
        </div>

        {mode === 'create' ? (
          <div>
            <p className="mb-2 text-xs font-medium text-content-muted">
              Content scope <span className="text-status-danger">*</span>
            </p>
            <div className="space-y-2">
              {SCOPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-4 rounded-lg border border-surface-border p-4 hover:bg-surface-muted/40"
                >
                  <input
                    type="radio"
                    name="categoryScope"
                    className="mt-1"
                    checked={scope === option.value}
                    onChange={() => setScope(option.value)}
                  />
                  <span>
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-body-sm font-medium text-content-primary">
                        {option.title}
                      </span>
                      <span className="text-caption text-content-muted">{option.playlists}</span>
                    </span>
                    <span className="mt-0.5 block text-caption text-content-secondary">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          category && (
            <div className="rounded-lg border border-surface-border bg-surface-muted/40 px-4 py-2">
              <p className="text-caption text-content-muted">Content scope</p>
              <p className="text-body-sm font-medium text-content-primary">
                {SCOPE_OPTIONS.find((o) => o.value === category.scope)?.title ?? category.scope}
                <span className="ml-2 font-normal text-content-muted">
                  ({category.playlistCount} playlist
                  {category.playlistCount === 1 ? '' : 's'})
                </span>
              </p>
            </div>
          )
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Description (optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short note for admins"
          />
        </div>
      </div>
    </Modal>
  );
}
