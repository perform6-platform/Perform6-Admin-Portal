import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getSyncDeviceDetail, getSyncFleet } from '../services/sync.api';

export function useSyncFleet() {
  return useQuery({
    queryKey: queryKeys.sync.fleet,
    queryFn: getSyncFleet,
    refetchInterval: (query) => {
      const devices = query.state.data?.devices ?? [];
      const hasIncomplete = devices.some(
        (device) =>
          device.expectedCount > 0 &&
          (device.progressPercent < 100 ||
            device.status === 'DOWNLOADING' ||
            device.status === 'FAILED' ||
            device.status === 'SYNCING'),
      );
      return hasIncomplete ? 8_000 : 20_000;
    },
  });
}

export function useSyncDeviceDetail(deviceId: string | null) {
  return useQuery({
    queryKey: queryKeys.sync.deviceDetail(deviceId ?? ''),
    queryFn: () => getSyncDeviceDetail(deviceId!),
    enabled: Boolean(deviceId),
    refetchInterval: (query) => {
      const rows = query.state.data?.requiredMedia ?? [];
      const unsettled = rows.some(
        (row) =>
          row.downloadStatus === 'MISSING' ||
          row.downloadStatus === 'FAILED' ||
          row.downloadStatus === 'DOWNLOADING',
      );
      return unsettled ? 5_000 : 15_000;
    },
  });
}
