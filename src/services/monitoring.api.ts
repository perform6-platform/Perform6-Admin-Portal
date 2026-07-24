import type { ApiResponse } from '../types/api';
import type {
  AnalyticsQuery,
  AnalyticsResult,
  FleetHealth,
  FleetStatus,
  LivePlaybackStatus,
} from '../types/monitoring';
import { apiClient } from './axios';

/** GET /monitoring/fleet/status */
export async function getFleetStatus(): Promise<FleetStatus> {
  const { data } = await apiClient.get<ApiResponse<FleetStatus>>('/monitoring/fleet/status');
  return data.data;
}

/** GET /monitoring/fleet/health */
export async function getFleetHealth(): Promise<FleetHealth> {
  const { data } = await apiClient.get<ApiResponse<FleetHealth>>('/monitoring/fleet/health');
  return data.data;
}

/** GET /monitoring/devices/:deviceId/live-playback — on-demand only (preview modal). */
export async function getDeviceLivePlayback(deviceId: string): Promise<LivePlaybackStatus> {
  const { data } = await apiClient.get<ApiResponse<LivePlaybackStatus>>(
    `/monitoring/devices/${deviceId}/live-playback`,
  );
  return data.data;
}

/** GET /monitoring/analytics?from=&to= */
export async function getAnalytics(query: AnalyticsQuery = {}): Promise<AnalyticsResult> {
  const { data } = await apiClient.get<ApiResponse<AnalyticsResult>>('/monitoring/analytics', {
    params: query,
  });
  return data.data;
}
