import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  getAnalytics,
  getDeviceLivePlayback,
  getFleetHealth,
  getFleetStatus,
} from '../services/monitoring.api';
import type { AnalyticsQuery } from '../types/monitoring';

/** GET /monitoring/fleet/status */
export function useFleetStatus(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: queryKeys.monitoring.fleetStatus,
    queryFn: getFleetStatus,
    refetchInterval: options?.refetchInterval,
  });
}

/** GET /monitoring/fleet/health */
export function useFleetHealth() {
  return useQuery({ queryKey: queryKeys.monitoring.fleetHealth, queryFn: getFleetHealth });
}

/**
 * Live playheads — only while preview is open.
 * Polls slowly (~8s) so the admin portal stays snappy.
 */
export function useDeviceLivePlayback(
  deviceId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: queryKeys.monitoring.livePlayback(deviceId ?? ''),
    queryFn: () => getDeviceLivePlayback(deviceId!),
    enabled: Boolean(deviceId) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? false,
    staleTime: 4_000,
  });
}

/** GET /monitoring/analytics */
export function useAnalytics(query: AnalyticsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.monitoring.analytics(query),
    queryFn: () => getAnalytics(query),
  });
}
