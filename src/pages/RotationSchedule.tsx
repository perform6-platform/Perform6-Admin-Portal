import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { CheckCircle2, Upload } from 'lucide-react';
import { RotationScheduleTable } from '../components/rotation-schedule/RotationScheduleTable';
import { ScheduleDayDetailsModal } from '../components/rotation-schedule/ScheduleDayDetailsModal';
import { Button, Dropdown, EmptyState, PageTitle } from '../components/ui';
import { ROTATION_DAYS } from '../constants/contentPlayback';
import type { ContentCategoryId } from '../constants/contentPlayback';
import { useDeployments } from '../context/DeploymentsContext';
import { useDeploymentScheduleTable } from '../hooks/useDeployments';
import { useDevice, useRegisteredDevices } from '../hooks/useDevices';
import { getDeviceRotationDay, getLatestDeploymentForDevice } from '../lib/deviceSchedule';
import { mapInventoryItem } from '../lib/deviceMapper';
import { getDeviceScheduleExportFilename } from '../lib/exportRotationSchedule';
import { exportScheduleTableCsv } from '../lib/scheduleTable';
import type { DeploymentScheduleTableRow } from '../types/deployments';
import type { DeviceInventoryItem } from '../types/devices';

export interface RotationScheduleLocationState {
  fromDeployment?: boolean;
  deviceId?: string;
  rotationDay?: number;
  deploymentName?: string;
  contentSchedule?: string;
  categoryId?: ContentCategoryId;
  usesRotation?: boolean;
  isBundleDeployment?: boolean;
  deploymentMode?: 'touch-screen' | 'default';
}

function getInventoryItemId(item: DeviceInventoryItem): string {
  return item.deviceId ?? item.pairingId ?? item.serialNumber ?? 'unknown';
}

function parseIsoDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return isValid(date) ? date : undefined;
}

export default function RotationSchedule() {
  const location = useLocation();
  const navigate = useNavigate();
  const { deployments } = useDeployments();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deploymentNotice, setDeploymentNotice] = useState<RotationScheduleLocationState | null>(null);
  const [viewRow, setViewRow] = useState<DeploymentScheduleTableRow | null>(null);

  const { data: registeredInventory } = useRegisteredDevices({ limit: 100 });
  const inventoryItems = registeredInventory?.items ?? [];

  const devices = useMemo(() => inventoryItems.map(mapInventoryItem), [inventoryItems]);

  const selectedInventoryItem = useMemo(
    () => inventoryItems.find((item) => getInventoryItemId(item) === selectedDeviceId) ?? null,
    [inventoryItems, selectedDeviceId],
  );

  const { data: registeredDevice } = useDevice(selectedDeviceId || null);

  const deploymentId =
    selectedInventoryItem?.deploymentId ?? registeredDevice?.deploymentId ?? null;

  const deviceOptions = useMemo(
    () =>
      devices.map((device) => ({
        value: device.id,
        label: `${device.name} — ${device.location}`,
      })),
    [devices],
  );

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId),
    [devices, selectedDeviceId],
  );

  const deviceDeployment = useMemo(
    () => (selectedDeviceId ? getLatestDeploymentForDevice(deployments, selectedDeviceId) : undefined),
    [deployments, selectedDeviceId],
  );

  const deviceRotationDay = useMemo(() => {
    if (!selectedDevice) return undefined;
    return getDeviceRotationDay(selectedDevice, deviceDeployment);
  }, [selectedDevice, deviceDeployment]);

  const rotationStartDate = useMemo(() => {
    const apiDate = parseIsoDate(registeredDevice?.rotationStartDate);
    if (apiDate) return apiDate;
    const localDate = parseIsoDate(deviceDeployment?.connectionStartDate);
    if (localDate) return localDate;
    return new Date();
  }, [registeredDevice?.rotationStartDate, deviceDeployment?.connectionStartDate]);

  const scheduleQuery = useMemo(() => {
    if (!isValid(rotationStartDate)) return null;

    const deviceId = selectedInventoryItem?.deviceId ?? undefined;

    return {
      rotationStartDate: format(rotationStartDate, 'yyyy-MM-dd'),
      days: ROTATION_DAYS,
      ...(deviceId ? { deviceId } : {}),
    };
  }, [rotationStartDate, selectedInventoryItem?.deviceId]);

  const {
    data: scheduleTable,
    isLoading,
    isError,
  } = useDeploymentScheduleTable(deploymentId, scheduleQuery);

  const deploymentHighlight =
    deploymentNotice?.isBundleDeployment || !deploymentNotice?.rotationDay
      ? undefined
      : deploymentNotice.categoryId
        ? {
            day: deploymentNotice.rotationDay,
            columnKey: deploymentNotice.categoryId,
          }
        : undefined;

  useEffect(() => {
    const state = location.state as RotationScheduleLocationState | null;
    if (state?.deviceId) {
      setSelectedDeviceId(state.deviceId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const state = location.state as RotationScheduleLocationState | null;
    if (!state?.fromDeployment || !state.rotationDay) return;
    setDeploymentNotice(state);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    setViewRow(null);
  }, [selectedDeviceId, deploymentId]);

  function dismissDeploymentNotice() {
    setDeploymentNotice(null);
  }

  function handleExportSchedule() {
    if (!scheduleTable) return;
    const filename = selectedDevice
      ? getDeviceScheduleExportFilename(selectedDevice.name)
      : 'perform6-rotation-schedule.csv';
    exportScheduleTableCsv(scheduleTable, filename);
  }

  const tableColumns = scheduleTable?.columns ?? [];
  const tableRows = scheduleTable?.rows ?? [];
  const highlightRotationDay = selectedDeviceId ? deviceRotationDay : undefined;
  const deploymentSummary = scheduleTable
    ? [
        scheduleTable.deploymentType?.replace(/_/g, ' '),
        scheduleTable.fieldCategory,
        scheduleTable.exerciseVariant?.replace(/_/g, ' '),
      ]
        .filter((part) => part && part !== '—')
        .join(' · ')
    : '';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <PageTitle>Schedule ({ROTATION_DAYS}-Day)</PageTitle>
          <p className="mt-1 text-body-sm text-content-secondary">
            {selectedDevice && deviceRotationDay ? (
              <>
                <strong className="font-medium text-content-primary">{selectedDevice.name}</strong> is on{' '}
                <strong className="font-medium text-content-primary">Day {deviceRotationDay}</strong> of the
                rotation.
              </>
            ) : scheduleTable ? (
              <>
                {deploymentSummary || 'Deployment schedule'} — {tableColumns.length} content{' '}
                {tableColumns.length === 1 ? 'column' : 'columns'} from the API.
              </>
            ) : (
              <>Select a registered device to load its deployment schedule table from the API.</>
            )}
          </p>
        </div>
        <Button
          size="md"
          className="h-9 w-full gap-2 px-4 sm:w-auto"
          onClick={handleExportSchedule}
          disabled={!scheduleTable}
        >
          <Upload className="h-4 w-4" />
          Export Schedule
        </Button>
      </div>

      {deploymentNotice && (
        <div className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-brand-600/30 dark:bg-brand-600/10">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
            <div>
              <p className="text-body-sm font-medium text-content-primary">
                Deployment added to rotation schedule
              </p>
              <p className="mt-0.5 text-body-sm text-content-secondary">
                <strong>{deploymentNotice.deploymentName}</strong>
                {deploymentNotice.isBundleDeployment
                  ? deploymentNotice.deploymentMode === 'default'
                    ? ` — Default, Start Here, Phase 1 & Phase 2 applied to the full ${ROTATION_DAYS}-day schedule`
                    : ` — all programs applied to the full ${ROTATION_DAYS}-day rotation schedule at once`
                  : deploymentNotice.usesRotation
                    ? ` — full ${ROTATION_DAYS}-day rotation added to the schedule`
                    : ` is on Day ${deploymentNotice.rotationDay}`}
                {deploymentNotice.contentSchedule ? ` (${deploymentNotice.contentSchedule})` : ''}.
                Review the schedule table below.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 shrink-0 px-3"
            onClick={dismissDeploymentNotice}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="max-w-md">
        <label className="mb-1 block text-xs font-medium text-content-muted">Device</label>
        <Dropdown
          options={deviceOptions}
          value={selectedDeviceId}
          onChange={setSelectedDeviceId}
          placeholder="Select a device"
          fullWidth
          clearable
        />
      </div>

      {!selectedDeviceId ? (
        <EmptyState message="Select a device to preview its deployment schedule." />
      ) : !deploymentId ? (
        <EmptyState message="This device does not have a deployment yet." />
      ) : isLoading ? (
        <EmptyState message="Loading deployment schedule table…" />
      ) : isError ? (
        <EmptyState message="Failed to load deployment schedule table." />
      ) : tableRows.length === 0 ? (
        <EmptyState message="No schedule rows returned for this deployment." />
      ) : (
        <RotationScheduleTable
          columns={tableColumns}
          rows={tableRows}
          highlightCell={deploymentHighlight}
          highlightRotationDay={highlightRotationDay}
          showViewActions
          onViewRow={setViewRow}
        />
      )}

      <ScheduleDayDetailsModal
        open={viewRow !== null}
        onClose={() => setViewRow(null)}
        row={viewRow}
        columns={tableColumns}
        device={selectedDevice}
        connectionStartDate={
          registeredDevice?.rotationStartDate ?? deviceDeployment?.connectionStartDate
        }
        isCurrentDay={viewRow?.rotationDay === deviceRotationDay}
      />

      <p className="flex items-center gap-2 text-body-sm text-content-secondary">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
        To change which videos play on each day, go to{' '}
        <Link to="/rotation" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Rotation
        </Link>
        .
      </p>
    </div>
  );
}
