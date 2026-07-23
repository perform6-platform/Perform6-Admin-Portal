import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getAnalytics, getFleetHealth, getFleetStatus } from '../services/monitoring.api';
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

/** GET /monitoring/analytics */
export function useAnalytics(query: AnalyticsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.monitoring.analytics(query),
    queryFn: () => getAnalytics(query),
  });
}
