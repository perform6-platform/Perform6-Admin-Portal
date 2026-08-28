import { useEffect, useState } from 'react';
import type { ContentCategoryId } from '../../constants/contentLibrary';
import { getFullCategoryLabel } from '../../constants/contentPlayback';
import { Button, Modal, ModalBody } from '../ui';
import {
  UploadContentForm,
  type UploadContentPayload,
} from './UploadContentForm';
import {
  UploadProgressPanel,
  type UploadProgressState,
} from './UploadProgressPanel';

const UPLOAD_FORM_ID = 'upload-content-modal-form';

export interface UploadContentModalProps {
  open: boolean;
  defaultCategoryId?: ContentCategoryId;
  onClose: () => void;
  onSubmit?: (payload: UploadContentPayload) => void | Promise<void>;
  progress?: UploadProgressState;
}

export function UploadContentModal({
  open,
  defaultCategoryId = 'default-fitness',
  onClose,
  onSubmit,
  progress = { phase: 'idle', percent: 0 },
}: UploadContentModalProps) {
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categoryLabel = getFullCategoryLabel(defaultCategoryId);
  const busy = isSubmitting || progress.phase === 'uploading' || progress.phase === 'processing';

  useEffect(() => {
    if (!open) {
      setCanSubmit(false);
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(payload: UploadContentPayload) {
    await onSubmit?.(payload);
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="Upload video"
      description={`Upload to ${categoryLabel}`}
      hideCloseButton={busy}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4"
            onClick={onClose}
            disabled={busy}
          >
            {progress.phase === 'done' ? 'Close' : 'Cancel'}
          </Button>
          {progress.phase !== 'done' && (
            <Button
              type="submit"
              form={UPLOAD_FORM_ID}
              size="sm"
              className="h-9 px-4"
              disabled={!canSubmit || busy}
            >
              {busy ? 'Uploading…' : 'Upload video'}
            </Button>
          )}
        </>
      }
    >
      <ModalBody>
        {open && (
          <div className="space-y-4">
            {progress.phase !== 'idle' && progress.phase !== 'error' && (
              <UploadProgressPanel state={progress} />
            )}
            {progress.phase === 'error' && (
              <UploadProgressPanel state={progress} />
            )}
            {!busy && progress.phase !== 'done' && progress.phase !== 'error' && (
              <UploadContentForm
                key={defaultCategoryId}
                categoryId={defaultCategoryId}
                embedded
                formId={UPLOAD_FORM_ID}
                onCancel={onClose}
                onSubmit={handleSubmit}
                onReadyChange={setCanSubmit}
                onSubmittingChange={setIsSubmitting}
              />
            )}
            {busy && (
              <p className="text-center text-caption text-content-muted">
                Please keep this window open until the bar reaches 100%.
              </p>
            )}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}

export {
  UploadContentForm,
  buildContentItemFromUpload,
  type UploadContentPayload,
} from './UploadContentForm';
