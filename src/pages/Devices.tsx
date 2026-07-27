import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DeviceDetailsPanel } from '../components/devices/DeviceDetailsPanel';
import { AddDeviceModal } from '../components/devices/AddDeviceModal';
import {
  Badge,
  Button,
  Dropdown,
  Input,
  PageShell,
  Pagination,
  Table,
  type TableColumn,
} from '../components/ui';
import { statusOptions, type Device } from '../constants/devices';
import { useToast } from '../context/ToastContext';
import { useClaimPairing, useDevices } from '../hooks/useDevices';
import { mapInventoryItem } from '../lib/deviceMapper';
import { getApiErrorMessage } from '../services/axios';
import type { ClaimPairingPayload, DeviceInventoryState } from '../types/devices';

const PAGE_SIZE = 20;

const fleetFilterOptions = [
  { value: 'all', label: 'All Devices' },
  { value: 'registered', label: 'Registered' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'pending', label: 'Pending pairing' },
] as const;

const validFleetStates = new Set(['all', 'registered', 'claimed', 'pending']);
const validStatusFilters = new Set(['all', 'online', 'offline']);

function parseFleetState(value: string | null): DeviceInventoryState {
  return value && validFleetStates.has(value)
    ? (value as DeviceInventoryState)
    : 'all';
}

function parseStatusFilter(value: string | null): string {
  return value && validStatusFilters.has(value) ? value : 'all';
}

export default function Devices() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [fleetFilter, setFleetFilter] = useState<DeviceInventoryState>(() =>
    parseFleetState(searchParams.get('state')),
  );
  const [statusFilter, setStatusFilter] = useState(() =>
    parseStatusFilter(searchParams.get('status')),
  );
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);

  useEffect(() => {
    setFleetFilter(parseFleetState(searchParams.get('state')));
    setStatusFilter(parseStatusFilter(searchParams.get('status')));
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const state = location.state as { openAddDevice?: boolean } | null;
    if (!state?.openAddDevice) return;
    setAddDeviceOpen(true);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.pathname, location.search, location.state, navigate]);

  function updateFilters(next: { state?: DeviceInventoryState; status?: string }) {
    const state = next.state ?? fleetFilter;
    const status = next.status ?? statusFilter;
    const params = new URLSearchParams();
    if (state !== 'all') params.set('state', state);
    if (status !== 'all') params.set('status', status);
    setSearchParams(params, { replace: true });
    if (next.state !== undefined) setFleetFilter(next.state);
    if (next.status !== undefined) setStatusFilter(next.status);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useDevices({
    state: fleetFilter,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { mutate: claimPairing, isPending: isClaimingDevice } = useClaimPairing();

  const devices = useMemo<Device[]>(() => {
    const items = data?.items ?? [];
    return items.map(mapInventoryItem);
  }, [data]);

  const filteredDevices = useMemo(() => {
    if (statusFilter === 'all') return devices;
    return devices.filter((device) => device.status === statusFilter);
  }, [devices, statusFilter]);

  const counts = data?.meta.counts;
  const total = data?.meta.total ?? filteredDevices.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const selectedDevice = useMemo(() => {
    if (selectedDeviceId) {
      return filteredDevices.find((device) => device.id === selectedDeviceId) ?? null;
    }
    return filteredDevices[0] ?? null;
  }, [filteredDevices, selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId && !filteredDevices.some((device) => device.id === selectedDeviceId)) {
      setSelectedDeviceId(null);
    }
  }, [filteredDevices, selectedDeviceId]);

  function handleAddDevice(payload: ClaimPairingPayload) {
    claimPairing(payload, {
      onSuccess: (result) => {
        setAddDeviceOpen(false);
        updateFilters({ state: 'claimed', status: 'all' });
        setSelectedDeviceId(result.data.pairingId ?? result.data.id);
        showToast({ title: result.message || 'Device claimed', variant: 'success' });
      },
      onError: (claimError) => {
        showToast({
          title: getApiErrorMessage(claimError, 'Failed to claim device'),
          variant: 'error',
        });
      },
    });
  }

  const columns: TableColumn<Device>[] = [
    {
      key: 'name',
      header: 'Device Name',
      render: (row) => (
        <div className="min-w-0">
          <span className="block truncate">{row.name}</span>
          {row.pairingCode ? (
            <span className="mt-0 block text-caption text-content-secondary">
              Code {row.pairingCode}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'serialNumber',
      header: 'Serial',
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-body-sm text-content-secondary">{row.serialNumber}</span>
      ),
    },
    {
      key: 'inventoryState',
      header: 'State',
      render: (row) => {
        const state = row.inventoryState ?? 'pending';
        const label =
          state === 'registered' ? 'Registered' : state === 'claimed' ? 'Claimed' : 'Pending';
        const variant =
          state === 'registered' ? 'success' : state === 'claimed' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'online' ? 'success' : 'danger'}>
          {row.status === 'online' ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'model',
      header: 'Model',
      hideOnMobile: true,
      render: (row) => row.model,
    },
  ];

  return (
    <PageShell title="Devices">
      {counts && (
        <div className="!mt-0 flex flex-wrap gap-2 text-caption text-content-secondary">
          <span>Pending: {counts.pending}</span>
          <span>·</span>
          <span>Claimed: {counts.claimed}</span>
          <span>·</span>
          <span>Registered: {counts.registered}</span>
        </div>
      )}

      <div className="relative z-20 flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:flex xl:shrink-0 xl:gap-4">
          <Dropdown
            options={[...fleetFilterOptions]}
            value={fleetFilter}
            onChange={(value) => {
              updateFilters({ state: value as DeviceInventoryState });
            }}
            fullWidth
            className="min-w-0"
          />
          <Dropdown
            options={[...statusOptions]}
            value={statusFilter}
            onChange={(value) => {
              updateFilters({ status: value });
            }}
            fullWidth
            className="min-w-0"
          />
        </div>
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search serial / name / model / code..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setSearch(searchInput.trim());
              setPage(1);
            }
          }}
          aria-label="Search devices"
          className="min-w-0 w-full xl:flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-full shrink-0 whitespace-nowrap px-4 xl:w-auto"
          onClick={() => {
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          Search
        </Button>
        <Button
          size="sm"
          className="h-9 w-full shrink-0 whitespace-nowrap px-4 xl:ml-auto xl:w-auto"
          onClick={() => setAddDeviceOpen(true)}
        >
          Add device
        </Button>
      </div>

      <AddDeviceModal
        open={addDeviceOpen}
        onClose={() => setAddDeviceOpen(false)}
        onSubmit={handleAddDevice}
        isSubmitting={isClaimingDevice}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {isError && (
            <div className="rounded-card border border-status-danger/25 bg-[rgba(234,84,85,0.1)] px-4 py-4 text-body-sm text-status-danger">
              {getApiErrorMessage(error, 'Failed to load devices')}
            </div>
          )}
          <Table
            columns={columns}
            data={filteredDevices}
            rowKey={(row) => row.id}
            emptyMessage={isLoading ? 'Loading devices...' : 'No devices found'}
            selectedRowKey={selectedDevice?.id}
            onRowClick={(row) => setSelectedDeviceId(row.id)}
          />

          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>

        <DeviceDetailsPanel device={selectedDevice} className="xl:sticky xl:top-4 xl:self-start" />
      </div>
    </PageShell>
  );
}
