import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getDeviceLogs, type DeviceLogsQuery } from '../services/deviceLogs.api';

export function useDeviceLogs(query: DeviceLogsQuery) {
  return useQuery({
    queryKey: queryKeys.deviceLogs.list(query),
    queryFn: () => getDeviceLogs(query),
    refetchInterval: 15_000,
  });
}
