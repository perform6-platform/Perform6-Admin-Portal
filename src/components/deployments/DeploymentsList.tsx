import { useMemo, useState } from 'react';
import { Eye, Pencil, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Pagination,
  SectionLabel,
} from '../ui';
import { useDeploymentsList } from '../../hooks/useDeployments';
import { useCategories } from '../../hooks/useCategories';
import {
  formatDeploymentAxes,
  formatEnumLabel,
} from '../../lib/deploymentDisplay';
import type { DeploymentEntity } from '../../types/deployments';
import { DeploymentDetailsModal } from './DeploymentDetailsModal';
import { EditDeploymentModal } from './EditDeploymentModal';

const PAGE_SIZE = 10;

function brandingLabel(config?: Record<string, unknown>): string {
  const mode = config?.brandingMode;
  if (mode === 'CUSTOM') return 'Custom';
  if (mode === 'NONE') return 'None';
  return 'Platform default';
}

export function DeploymentsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [editing, setEditing] = useState<DeploymentEntity | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const { data, isLoading, isError, refetch } = useDeploymentsList(query);
  const { data: contentCategories = [] } = useCategories();
  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <>
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Registered deployments</SectionLabel>
            <p className="mt-1 text-caption text-content-secondary">
              View screen→category mapping, or edit field, variant, branding, and screens.
            </p>
          </div>
          <form
            className="flex w-full gap-2 sm:max-w-sm"
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
            <Button type="submit" variant="outline" size="sm" className="h-10 shrink-0 gap-1.5 px-3">
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
              <thead className="bg-surface-muted/60 text-caption uppercase tracking-wide text-content-muted">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Field / Content</th>
                  <th className="px-3 py-2.5 font-medium">Variant / Program</th>
                  <th className="px-3 py-2.5 font-medium">Devices</th>
                  <th className="px-3 py-2.5 font-medium">Branding</th>
                  <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((deployment) => {
                  const axes = formatDeploymentAxes(deployment, {
                    categories: contentCategories,
                  });
                  return (
                    <tr key={deployment.id} className="border-t border-surface-border">
                      <td className="px-3 py-3 font-medium text-content-primary">
                        {deployment.name || deployment.id.slice(0, 8)}
                      </td>
                      <td className="px-3 py-3 text-content-secondary">
                        {formatEnumLabel(deployment.deploymentType)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="brand">{axes.fieldLabel}</Badge>
                      </td>
                      <td className="px-3 py-3 text-content-secondary">
                        {axes.variantLabel}
                      </td>
                      <td className="px-3 py-3 text-content-secondary">
                        {deployment.devices?.length ?? 0}
                      </td>
                      <td className="px-3 py-3 text-content-secondary">
                        {brandingLabel(deployment.config)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            label={`View ${deployment.name ?? 'deployment'}`}
                            onClick={() => setViewingId(deployment.id)}
                          >
                            <Eye />
                          </IconButton>
                          <IconButton
                            label={`Edit ${deployment.name ?? 'deployment'}`}
                            onClick={() => setEditing(deployment)}
                          >
                            <Pencil />
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
        onSaved={() => {
          setEditing(null);
          void refetch();
        }}
      />
    </>
  );
}
