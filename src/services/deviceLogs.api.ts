import type { ApiResponse } from '../types/api';
import { apiClient } from './axios';

export type DeviceLogLevel = 'INFO' | 'WARN' | 'ERROR';
export type DeviceLogSource = 'JS' | 'AUTORUN';

export interface DeviceLogRow {
  id: string;
  deviceId: string;
  deviceName: string | null;
  serialNumber: string | null;
  level: DeviceLogLevel;
  source: DeviceLogSource;
  message: string;
  createdAt: string;
}

export interface DeviceLogsQuery {
  deviceId?: string;
  level?: DeviceLogLevel;
  source?: DeviceLogSource;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DeviceLogsResult {
  items: DeviceLogRow[];
  page: number;
  limit: number;
  total: number;
}

/** GET /device-logs */
export async function getDeviceLogs(query: DeviceLogsQuery = {}): Promise<DeviceLogsResult> {
  const { data } = await apiClient.get<ApiResponse<DeviceLogsResult>>('/device-logs', {
    params: query,
  });
  return data.data;
}

/** GET /devices/:id/logs */
export async function getDeviceLogsForDevice(
  deviceId: string,
  query: Omit<DeviceLogsQuery, 'deviceId'> = {},
): Promise<DeviceLogsResult> {
  const { data } = await apiClient.get<ApiResponse<DeviceLogsResult>>(
    `/devices/${deviceId}/logs`,
    { params: query },
  );
  return data.data;
}
