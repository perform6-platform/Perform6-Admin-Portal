import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddProgramModal } from '../components/programs/AddProgramModal';
import { EditProgramModal } from '../components/programs/EditProgramModal';
import { PlaybackOverview } from '../components/programs/PlaybackOverview';
import { ProgramPhaseCardView } from '../components/programs/ProgramPhaseCard';
import {
  Button,
  ConfirmModal,
  IconButton,
  PageTitle,
  SectionLabel,
  Table,
  type TableColumn,
} from '../components/ui';
import {
  mockProgramList,
  programPhaseCards,
  type ProgramListItem,
} from '../constants/programs';
import { useContent } from '../context/ContentContext';
import { cn } from '../lib/cn';
import { isContentCategoryId, isPlaybackCategoryId } from '../lib/programHelpers';

export default function Programs() {
  const navigate = useNavigate();
  const { getVideoCountForProgram } = useContent();
  const [programs, setPrograms] = useState<ProgramListItem[]>(mockProgramList);
  const [addProgramOpen, setAddProgramOpen] = useState(false);
  const [deleteProgramOpen, setDeleteProgramOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramListItem | null>(null);
  const [editProgramOpen, setEditProgramOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramListItem | null>(null);

  const programsWithCounts = useMemo(
    () =>
      programs.map((program) => ({
        ...program,
        totalVideos:
          isPlaybackCategoryId(program.id) || isContentCategoryId(program.id)
            ? getVideoCountForProgram(program.id)
            : program.totalVideos,
      })),
    [programs, getVideoCountForProgram],
  );

  function handleAddProgram(payload: {
    name: string;
    description: string;
    duration: string;
    totalVideos: string;
  }) {
    setPrograms((current) => [
      ...current,
      {
        id: `program-${Date.now()}`,
        name: payload.name,
        description: payload.description,
        duration: payload.duration,
        totalVideos: Number.parseInt(payload.totalVideos, 10) || 0,
        status: 'active',
      },
    ]);
  }

  function handleDeleteProgram() {
    if (!programToDelete) return;
    setPrograms((current) => current.filter((program) => program.id !== programToDelete.id));
  }

  function handleEditProgram(payload: {
    id: string;
    name: string;
    description: string;
    duration: string;
    totalVideos: string;
    status: ProgramListItem['status'];
  }) {
    setPrograms((current) =>
      current.map((program) =>
        program.id === payload.id
          ? {
              ...program,
              name: payload.name,
              description: payload.description,
              duration: payload.duration,
              totalVideos: Number.parseInt(payload.totalVideos, 10) || program.totalVideos,
              status: payload.status,
            }
          : program,
      ),
    );
  }

  function openEditProgram(program: ProgramListItem) {
    setEditingProgram(program);
    setEditProgramOpen(true);
  }

  function openManage(program: ProgramListItem) {
    if (isPlaybackCategoryId(program.id)) {
      navigate(`/programs/${program.id}/manage`);
      return;
    }

    if (isContentCategoryId(program.id)) {
      navigate(`/programs/${program.id}/manage`);
    }
  }

  const columns: TableColumn<(typeof programsWithCounts)[number]>[] = [
    {
      key: 'name',
      header: 'Program Name',
      render: (row) => (
        <button
          type="button"
          onClick={() => openManage(row)}
          className={cn(
            'font-medium text-content-primary transition-colors hover:text-brand-600 dark:hover:text-brand-400',
            row.isSubProgram && 'pl-4 text-body-sm',
          )}
        >
          {row.isSubProgram ? `↳ ${row.name}` : row.name}
        </button>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-[280px] whitespace-normal',
      render: (row) => <span className="text-content-secondary">{row.description}</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      hideOnMobile: true,
      render: (row) => row.duration,
    },
    {
      key: 'totalVideos',
      header: 'Total Videos',
      hideOnMobile: true,
      render: (row) => row.totalVideos,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="font-medium text-status-success">
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label={`Edit ${row.name}`} onClick={() => openEditProgram(row)}>
            <Pencil />
          </IconButton>
          <IconButton
            label={`Delete ${row.name}`}
            className="hover:border-status-danger/30 hover:text-status-danger"
            onClick={() => {
              setProgramToDelete(row);
              setDeleteProgramOpen(true);
            }}
          >
            <Trash2 />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageTitle>Programs</PageTitle>
          <Button
            size="sm"
            className="h-9 w-full shrink-0 gap-2 px-4 sm:w-auto"
            onClick={() => setAddProgramOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Program
          </Button>
        </div>

        <PlaybackOverview />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {programPhaseCards.map((program) => (
            <ProgramPhaseCardView
              key={program.id}
              program={{
                ...program,
                videoCount: getVideoCountForProgram(program.id),
              }}
              onManage={(route) => navigate(route)}
            />
          ))}
        </section>

        <section>
          <SectionLabel className="mb-4 block">Program List</SectionLabel>
          <Table
            columns={columns}
            data={programsWithCounts}
            rowKey={(row) => row.id}
            renderMobileCard={(row) => (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => openManage(row)}
                  className={cn(
                    'text-left font-semibold text-content-primary transition-colors hover:text-brand-600 dark:hover:text-brand-400',
                    row.isSubProgram && 'text-body-sm',
                  )}
                >
                  {row.isSubProgram ? `↳ ${row.name}` : row.name}
                </button>
                <p className="text-body-sm text-content-secondary">{row.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-content-muted">
                  <span>{row.duration}</span>
                  <span>{row.totalVideos} videos</span>
                  <span className="font-medium text-status-success">
                    {row.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-surface-border pt-4">
                  <IconButton label={`Edit ${row.name}`} onClick={() => openEditProgram(row)}>
                    <Pencil />
                  </IconButton>
                  <IconButton
                    label={`Delete ${row.name}`}
                    className="hover:border-status-danger/30 hover:text-status-danger"
                    onClick={() => {
                      setProgramToDelete(row);
                      setDeleteProgramOpen(true);
                    }}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              </div>
            )}
          />
        </section>
      </div>

      <AddProgramModal
        open={addProgramOpen}
        onClose={() => setAddProgramOpen(false)}
        onSubmit={handleAddProgram}
      />

      <EditProgramModal
        open={editProgramOpen}
        program={editingProgram}
        onClose={() => {
          setEditProgramOpen(false);
          setEditingProgram(null);
        }}
        onSubmit={handleEditProgram}
      />

      <ConfirmModal
        open={deleteProgramOpen}
        onClose={() => {
          setDeleteProgramOpen(false);
          setProgramToDelete(null);
        }}
        onConfirm={handleDeleteProgram}
        title="Delete program?"
        description={
          programToDelete
            ? `Are you sure you want to delete ${programToDelete.name}? This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}
