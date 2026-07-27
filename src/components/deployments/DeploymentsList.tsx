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
import { cn } from '../../lib/cn';
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Registered deployments</SectionLabel>
            <p className="mt-1 text-caption text-content-secondary">
              View screen→category mapping, or edit field, variant, branding, and screens.
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
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Field / Content</th>
                  <th className="px-4 py-2 font-medium">Variant / Program</th>
                  <th className="px-4 py-2 font-medium">Devices</th>
                  <th className="px-4 py-2 font-medium">Branding</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((deployment, index) => {
                  const axes = formatDeploymentAxes(deployment, {
                    categories: contentCategories,
                  });
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
                        {deployment.name || deployment.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {formatEnumLabel(deployment.deploymentType)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="brand">{axes.fieldLabel}</Badge>
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {axes.variantLabel}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {deployment.devices?.length ?? 0}
                      </td>
                      <td className="px-4 py-4 text-content-secondary">
                        {brandingLabel(deployment.config)}
                      </td>
                      <td className="px-4 py-4">
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
