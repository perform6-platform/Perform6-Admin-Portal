import type { ApiResponse } from '../types/api';
import type { SyncDeviceDetail, SyncFleetOverview } from '../types/sync';
import { apiClient } from './axios';

/** GET /sync/fleet */
export async function getSyncFleet(): Promise<SyncFleetOverview> {
  const { data } = await apiClient.get<ApiResponse<SyncFleetOverview>>('/sync/fleet');
  return data.data;
}

/** GET /sync/devices/:id */
export async function getSyncDeviceDetail(deviceId: string): Promise<SyncDeviceDetail> {
  const { data } = await apiClient.get<ApiResponse<SyncDeviceDetail>>(`/sync/devices/${deviceId}`);
  return data.data;
}
