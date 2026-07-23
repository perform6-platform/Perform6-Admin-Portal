import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Modal } from '../ui';
import { useDeploymentsList } from '../../hooks/useDeployments';

export interface AttachDeviceModalProps {
  open: boolean;
  deviceName: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (deploymentId: string) => void;
}

export function AttachDeviceModal({
  open,
  deviceName,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AttachDeviceModalProps) {
  const { data, isLoading } = useDeploymentsList({ page: 1, limit: 100 });
  const [deploymentId, setDeploymentId] = useState('');

  useEffect(() => {
    if (open) setDeploymentId('');
  }, [open]);

  const options = useMemo(
    () =>
      (data?.items ?? []).map((deployment) => ({
        value: deployment.id,
        label: `${deployment.name} · ${deployment.deploymentType}`,
      })),
    [data?.items],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach to deployment"
      description={`Reconnect “${deviceName}” to an existing deployment. Same device token — no re-pair.`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!deploymentId) return;
              onSubmit(deploymentId);
            }}
            disabled={isSubmitting || !deploymentId || isLoading}
          >
            {isSubmitting ? 'Attaching…' : 'Attach'}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-body-sm text-content-muted">Loading deployments…</p>
      ) : options.length === 0 ? (
        <p className="text-body-sm text-content-muted">
          No deployments available. Create one in the Deployments wizard first.
        </p>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Deployment
          </label>
          <Dropdown
            options={options}
            value={deploymentId}
            onChange={setDeploymentId}
            fullWidth
            placeholder="Select deployment"
          />
        </div>
      )}
    </Modal>
  );
}
