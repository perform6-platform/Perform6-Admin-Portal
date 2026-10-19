import { useEffect, useState } from 'react';
import { Button, Input, Modal } from '../ui';
import type {
  CategoryScope,
  ContentCategory,
  DayPlaybackMode,
} from '../../types/categories';
import {
  categoryDisplayName,
  configurationScopeHelp,
  configurationScopeLabel,
  configurationScopePlaylistCount,
  systemCategoryDescription,
  systemConfigurationDetail,
  systemPlaybackSupportingText,
} from '../../lib/systemCategoryCopy';

const SCOPE_OPTIONS: CategoryScope[] = [
  'GLOBAL',
  'BY_FIELD',
  'BY_FIELD_AND_VARIANT',
  'BY_NAMED_PLAYLIST',
];

export interface CategoryFormModalProps {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
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

  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const displayName = category
    ? categoryDisplayName(category.slug, category.name)
    : name;

  useEffect(() => {
    if (!open) return;
    if ((mode === 'edit' || mode === 'view') && category) {
      setName(categoryDisplayName(category.slug, category.name));
      setDescription(
        category.isSystem
          ? systemCategoryDescription(category.slug) || category.description || ''
          : (category.description ?? ''),
      );
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
    if (isView) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({
      name: trimmed,
      dayPlaybackMode,
      ...(isCreate ? { scope } : {}),
      description: description.trim() || undefined,
    });
  }

  const title = isCreate
    ? 'Create Category'
    : isView
      ? 'Category Details'
      : 'Edit Category';

  const descriptionText = isCreate
    ? 'Create a custom content category by selecting its playback behavior and playlist configuration.'
    : isView
      ? 'System category settings are fixed. Content assignments are managed separately.'
      : 'Name and playback mode can change. Configuration and playlists stay fixed after create.';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={descriptionText}
      footer={
        <div className="flex justify-end gap-2">
          {isView ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Saving…' : isCreate ? 'Create' : 'Save'}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Category Name
          </label>
          {isView ? (
            <p className="text-body-sm font-medium text-content-primary">{displayName}</p>
          ) : (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recovery Flow"
            />
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-content-muted">Playback</p>
          {isView && category ? (
            <div className="rounded-lg border border-surface-border bg-surface-muted/40 p-4">
              <p className="text-body-sm font-medium text-content-primary">
                {dayPlaybackMode === 'LOOP' ? 'Loop all day' : 'Play once'}
              </p>
              <p className="mt-1 text-caption text-content-secondary">
                {systemPlaybackSupportingText(category.slug, dayPlaybackMode)}
              </p>
            </div>
          ) : (
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
                    The assigned video repeats continuously until the next scheduled content
                    change.
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
                    Play once
                  </span>
                  <span className="block text-caption text-content-secondary">
                    The assigned video plays once when playback is initiated.
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>

        {isCreate ? (
          <div>
            <p className="mb-2 text-xs font-medium text-content-muted">
              Configuration <span className="text-status-danger">*</span>
            </p>
            <div className="space-y-2">
              {SCOPE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-start gap-4 rounded-lg border border-surface-border p-4 hover:bg-surface-muted/40"
                >
                  <input
                    type="radio"
                    name="categoryScope"
                    className="mt-1"
                    checked={scope === option}
                    onChange={() => setScope(option)}
                  />
                  <span>
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-body-sm font-medium text-content-primary">
                        {configurationScopeLabel(option)}
                      </span>
                      <span className="text-caption text-content-muted">
                        {configurationScopePlaylistCount(option)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-caption text-content-secondary">
                      {configurationScopeHelp(option)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          category && (
            <div className="rounded-lg border border-surface-border bg-surface-muted/40 px-4 py-2">
              <p className="text-caption text-content-muted">Configuration</p>
              <p className="text-body-sm font-medium text-content-primary whitespace-pre-line">
                {category.isSystem
                  ? systemConfigurationDetail(category.slug)
                  : `${configurationScopeLabel(category.scope)} (${category.playlistCount} playlist${
                      category.playlistCount === 1 ? '' : 's'
                    })`}
              </p>
            </div>
          )
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Description
          </label>
          {isView ? (
            <p className="text-body-sm text-content-secondary">
              {description || '—'}
            </p>
          ) : (
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the category’s purpose"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
