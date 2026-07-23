import { useState, type FormEvent } from 'react';
import { Button, Input, Modal, ModalBody } from '../ui';

export interface AddProgramModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: {
    name: string;
    description: string;
    duration: string;
    totalVideos: string;
  }) => void;
}

export function AddProgramModal({ open, onClose, onSubmit }: AddProgramModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [totalVideos, setTotalVideos] = useState('');

  function handleClose() {
    setName('');
    setDescription('');
    setDuration('');
    setTotalVideos('');
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.({
      name: name.trim(),
      description: description.trim(),
      duration: duration.trim(),
      totalVideos: totalVideos.trim(),
    });
    handleClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add program"
      description="Create a new program page for your training content."
      footer={
        <>
          <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-program-form" size="sm" className="h-9 px-4">
            Add program
          </Button>
        </>
      }
    >
      <ModalBody>
        <form id="add-program-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Program name"
            placeholder="e.g. Phase 3"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            label="Description"
            placeholder="e.g. Advanced rotational patterns"
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
        </form>
      </ModalBody>
    </Modal>
  );
}
