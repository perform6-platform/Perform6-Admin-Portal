import { useEffect, useState, type FormEvent } from 'react';
import type { ProgramListItem, ProgramStatus } from '../../constants/programs';
import { Button, Dropdown, Input, Modal, ModalBody } from '../ui';

const programStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export interface EditProgramModalProps {
  open: boolean;
  program: ProgramListItem | null;
  onClose: () => void;
  onSubmit?: (payload: {
    id: string;
    name: string;
    description: string;
    duration: string;
    totalVideos: string;
    status: ProgramStatus;
  }) => void;
}

export function EditProgramModal({ open, program, onClose, onSubmit }: EditProgramModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [totalVideos, setTotalVideos] = useState('');
  const [status, setStatus] = useState<ProgramStatus>('active');

  useEffect(() => {
    if (!open || !program) return;

    setName(program.name);
    setDescription(program.description);
    setDuration(program.duration);
    setTotalVideos(String(program.totalVideos));
    setStatus(program.status);
  }, [open, program]);

  function handleClose() {
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!program) return;

    onSubmit?.({
      id: program.id,
      name: name.trim(),
      description: description.trim(),
      duration: duration.trim(),
      totalVideos: totalVideos.trim(),
      status,
    });
    handleClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit program"
      description={program ? `Update details for ${program.name}.` : undefined}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-program-form" size="sm" className="h-9 px-4" disabled={!program}>
            Save changes
          </Button>
        </>
      }
    >
      <ModalBody>
        <form id="edit-program-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Program name"
            placeholder="e.g. Phase 1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            label="Description"
            placeholder="e.g. Functional patterns for foundational strength"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
          <Input
            label="Duration"
            placeholder="e.g. 36 Days"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            required
          />
          <Input
            label="Total videos"
            placeholder="e.g. 36"
            value={totalVideos}
            onChange={(event) => setTotalVideos(event.target.value)}
            inputMode="numeric"
            required
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">Status</label>
            <Dropdown
              options={[...programStatusOptions]}
              value={status}
              onChange={(value) => setStatus(value as ProgramStatus)}
              fullWidth
            />
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}
