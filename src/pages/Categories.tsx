import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import {
  Badge,
  Button,
  ConfirmModal,
  IconButton,
  PageTitle,
  Table,
  type TableColumn,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/useCategories';
import { sortCategories } from '../lib/contentCategoryGroups';
import {
  categoryDisplayName,
  configurationColumnText,
} from '../lib/systemCategoryCopy';
import { getApiErrorMessage } from '../services/axios';
import type {
  CategoryScope,
  ContentCategory,
  DayPlaybackMode,
} from '../types/categories';

function playbackLabel(mode: DayPlaybackMode): string {
  return mode === 'LOOP' ? 'Loop all day' : 'Play once';
}

export default function Categories() {
  const { showToast } = useToast();
  const { data: categories = [], isLoading } = useCategories();
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editing, setEditing] = useState<ContentCategory | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContentCategory | null>(null);

  const sortedCategories = useMemo(() => sortCategories(categories), [categories]);

  const columns = useMemo<TableColumn<ContentCategory>[]>(
    () => [
      {
        key: 'name',
        header: 'Category',
        render: (row) => (
          <p className="text-content-primary">
            {categoryDisplayName(row.slug, row.name)}
          </p>
        ),
      },
      {
        key: 'playlists',
        header: 'Playlists',
        render: (row) => (
          <span className="text-body-sm text-content-secondary">{row.playlistCount}</span>
        ),
      },
      {
        key: 'configuration',
        header: 'Configuration',
        render: (row) => (
          <span className="whitespace-pre-line text-body-sm text-content-secondary">
            {configurationColumnText(row.slug, row.scope)}
          </span>
        ),
      },
      {
        key: 'assignments',
        header: 'Assignments',
        render: (row) => {
          const total = row.sessionCount || row.cycleDays || 0;
          return (
            <span className="text-body-sm text-content-secondary">
              {row.assignedSessionCount} of {total}
            </span>
          );
        },
      },
      {
        key: 'playback',
        header: 'Playback',
        render: (row) => (
          <Badge variant={row.dayPlaybackMode === 'LOOP' ? 'brand' : 'warning'}>
            {playbackLabel(row.dayPlaybackMode)}
          </Badge>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (row) =>
          row.isSystem ? (
            <Badge variant="neutral">System</Badge>
          ) : (
            <Badge variant="success">Custom</Badge>
          ),
      },
      {
        key: 'actions',
        header: '',
        render: (row) => {
          const label = categoryDisplayName(row.slug, row.name);
          return (
            <div className="flex justify-end gap-1">
              {row.isSystem ? (
                <IconButton
                  label={`View ${label}`}
                  onClick={() => {
                    setEditing(row);
                    setFormMode('view');
                    setFormOpen(true);
                  }}
                >
                  <Eye />
                </IconButton>
              ) : (
                <IconButton
                  label={`Edit ${label}`}
                  onClick={() => {
                    setEditing(row);
                    setFormMode('edit');
                    setFormOpen(true);
                  }}
                >
                  <Pencil />
                </IconButton>
              )}
              {!row.isSystem && (
                <IconButton
                  label={`Delete ${label}`}
                  className="hover:border-status-danger/30 hover:text-status-danger"
                  onClick={() => {
                    setDeleteTarget(row);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 />
                </IconButton>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  async function handleFormSubmit(payload: {
    name: string;
    dayPlaybackMode: DayPlaybackMode;
    scope?: CategoryScope;
    description?: string;
  }) {
    try {
      if (formMode === 'create') {
        if (!payload.scope) return;
        await createCategory({
          name: payload.name,
          scope: payload.scope,
          dayPlaybackMode: payload.dayPlaybackMode,
          description: payload.description,
        });
        showToast({
          title: 'Category created',
          message: 'Playlists and empty 36-day schedules are ready for media.',
          variant: 'success',
        });
      } else if (formMode === 'edit' && editing && !editing.isSystem) {
        await updateCategory({
          id: editing.id,
          payload: {
            name: payload.name,
            dayPlaybackMode: payload.dayPlaybackMode,
            description: payload.description,
          },
        });
        showToast({ title: 'Category updated', variant: 'success' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to save category'),
        variant: 'error',
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      showToast({ title: 'Category deleted', variant: 'success' });
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to delete category'),
        variant: 'error',
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageTitle>Categories</PageTitle>
          <p className="mt-1 text-body-sm text-content-secondary">
            Manage content categories, playlist configurations, playback settings and
            assignments.
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 shrink-0 gap-2 px-4"
          onClick={() => {
            setFormMode('create');
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New category
        </Button>
      </div>

      {isLoading ? (
        <p className="text-body-sm text-content-muted">Loading categories…</p>
      ) : (
        <Table
          columns={columns}
          data={sortedCategories}
          rowKey={(row) => row.id}
          emptyMessage="No categories yet — create your first category."
        />
      )}

      <CategoryFormModal
        open={formOpen}
        mode={formMode}
        category={editing}
        isSubmitting={isCreating || isUpdating}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete category?"
        description={
          deleteTarget
            ? `“${categoryDisplayName(deleteTarget.slug, deleteTarget.name)}” and its playlists will be removed. This is blocked if the category is assigned to any deployment screen.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
