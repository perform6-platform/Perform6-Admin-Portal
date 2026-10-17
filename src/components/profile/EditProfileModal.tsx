import { useEffect, useState, type FormEvent } from 'react';
import type { AuthUser } from '../../types/auth';
import { Button, Input, Modal, ModalBody } from '../ui';

export interface EditProfileModalProps {
  open: boolean;
  user: AuthUser | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: { name?: string; email?: string }) => void;
}

export function EditProfileModal({
  open,
  user,
  isSaving = false,
  onClose,
  onSubmit,
}: EditProfileModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name);
    setEmail(user.email);
  }, [open, user]);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const dirty =
    Boolean(user) &&
    (trimmedName !== user!.name.trim() ||
      trimmedEmail.toLowerCase() !== user!.email.trim().toLowerCase());
  const canSave =
    dirty &&
    trimmedName.length > 0 &&
    trimmedEmail.length > 0 &&
    !isSaving;

  function handleClose() {
    if (isSaving) return;
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canSave) return;

    const payload: { name?: string; email?: string } = {};
    if (trimmedName !== user.name.trim()) payload.name = trimmedName;
    if (trimmedEmail.toLowerCase() !== user.email.trim().toLowerCase()) {
      payload.email = trimmedEmail;
    }
    onSubmit(payload);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit profile"
      description="Update your full name and email address. Role cannot be changed here."
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            size="sm"
            className="h-9 px-4"
            disabled={!canSave}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <ModalBody>
        <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            maxLength={120}
            disabled={isSaving}
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            maxLength={255}
            disabled={isSaving}
          />
        </form>
      </ModalBody>
    </Modal>
  );
}
