import { useMemo, useState } from 'react';
import { Eye, Pencil, Search, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  IconButton,
  Input,
  Pagination,
  SectionLabel,
} from '../ui';
import { useDeleteDeployment, useDeploymentsList } from '../../hooks/useDeployments';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../context/ToastContext';
import {
  formatBrandingModeLabel,
  formatDeploymentAxes,
  formatDeploymentDisplayName,
  formatDeploymentTypeLabel,
  formatLinkedDeviceNames,
  formatRotationScheduleLabel,
  resolveDeploymentRotationMode,
} from '../../lib/deploymentDisplay';
import { cn } from '../../lib/cn';
import { getApiErrorMessage } from '../../services/axios';
import type { DeploymentEntity } from '../../types/deployments';
import { DeploymentDetailsModal } from './DeploymentDetailsModal';
import { EditDeploymentModal } from './EditDeploymentModal';

const PAGE_SIZE = 10;

export function DeploymentsList() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [editing, setEditing] = useState<DeploymentEntity | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DeploymentEntity | null>(null);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const { data, isLoading, isError } = useDeploymentsList(query);
  const { mutateAsync: deleteDeployment, isPending: isDeleting } = useDeleteDeployment();
  const { data: contentCategories = [] } = useCategories();
  const items = data?.items ?? [];
  const meta = data?.meta;

  async function handleDelete(deployment: DeploymentEntity) {
    try {
      const result = await deleteDeployment(deployment.id);
      const count = result.disconnectedDeviceIds.length;
      showToast({
        title: 'Deployment deleted',
        message:
          count > 0
            ? `${count} device${count === 1 ? '' : 's'} disconnected. Tokens stay valid for Attach.`
            : 'Deployment removed.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to delete deployment'),
        variant: 'error',
      });
    }
  }

  return (
    <>
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Registered deployments</SectionLabel>
            <p className="mt-1 text-caption text-content-secondary">
              View and manage registered deployments, including configuration, devices, branding,
              and rotation schedules.
            </p>
          </div>
          <form
            className="flex w-full items-center gap-2 sm:max-w-sm"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchDraft);
            }}
          >
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by name…"
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="outline" size="md" className="shrink-0 gap-2 px-4">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>

        {isError ? (
          <EmptyState message="Failed to load deployments. Try refreshing." />
        ) : isLoading ? (
          <EmptyState message="Loading deployments…" />
        ) : items.length === 0 ? (
          <EmptyState message="No deployments yet. Complete the wizard above to register one." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-surface-border">
            <table className="min-w-full text-left text-body-sm">
              <thead className="bg-surface text-caption uppercase tracking-wide text-content-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Deployment Name</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Device Name</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Deployment Type</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Content Type</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Environment</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Rotation Schedule</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Devices</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">Branding</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((deployment, index) => {
                  const axes = formatDeploymentAxes(deployment, {
                    categories: contentCategories,
                  });
                  const rotationMode = resolveDeploymentRotationMode(deployment);
                  const deploymentLabel = formatDeploymentDisplayName(deployment);
                  return (
                    <tr
                      key={deployment.id}
                      className={cn(
                        'border-b border-surface-border last:border-b-0 transition-colors',
                        index % 2 === 1
                          ? 'bg-surface-muted hover:bg-[#F2F7FF]'
                          : 'bg-surface hover:bg-[#F2F7FF]',
                      )}
                    >
                      <td className="px-4 py-4 font-medium text-content-primary">
                        {deploymentLabel}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {formatLinkedDeviceNames(deployment)}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {formatDeploymentTypeLabel(deployment.deploymentType)}
                      </td>
                      <td className="px-4 py-4">
                        {axes.fieldLabel && axes.fieldLabel !== '—' ? (
                          <Badge variant="brand">{axes.fieldLabel}</Badge>
                        ) : (
                          <span className="text-content-secondary">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {axes.variantLabel && axes.variantLabel !== '—'
                          ? axes.variantLabel
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {rotationMode
                          ? formatRotationScheduleLabel(rotationMode)
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {deployment.devices?.length ?? 0}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {formatBrandingModeLabel(undefined, deployment.config)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            label={`View details for ${deploymentLabel}`}
                            onClick={() => setViewingId(deployment.id)}
                          >
                            <Eye />
                          </IconButton>
                          <IconButton
                            label={`Edit ${deploymentLabel}`}
                            onClick={() => setEditing(deployment)}
                          >
                            <Pencil />
                          </IconButton>
                          <IconButton
                            label={`Delete ${deploymentLabel}`}
                            onClick={() => setDeleting(deployment)}
                          >
                            <Trash2 />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > PAGE_SIZE && (
          <Pagination
            page={meta.page}
            pageSize={meta.limit}
            total={meta.total}
            onPageChange={setPage}
            entityLabel="deployments"
          />
        )}
      </Card>

      <DeploymentDetailsModal
        open={viewingId !== null}
        deploymentId={viewingId}
        onClose={() => setViewingId(null)}
      />

      <EditDeploymentModal
        open={editing !== null}
        deployment={editing}
        onClose={() => setEditing(null)}
        onSaved={() => setEditing(null)}
      />

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting || isDeleting) return;
          void handleDelete(deleting);
        }}
        title="Delete deployment?"
        description={
          deleting
            ? `Deletes “${formatDeploymentDisplayName(deleting)}” and disconnects ${
                deleting.devices?.length ?? 0
              } linked device${
                (deleting.devices?.length ?? 0) === 1 ? '' : 's'
              }. Device tokens stay valid for Attach. Players keep running but lose this deployment’s content until reattached.`
            : undefined
        }
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        tone="danger"
      />
    </>
  );
}
