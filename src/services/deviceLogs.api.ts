import type { ApiResponse } from '../types/api';
import { apiClient } from './axios';

export type DeviceLogLevel = 'INFO' | 'WARN' | 'ERROR';
export type DeviceLogSource = 'JS' | 'AUTORUN';

export interface DeviceLogRow {
  id: string;
  deviceId: string | null;
  pairingId?: string | null;
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
  /** ISO time. Inclusive lower bound. */
  since?: string;
  /** ISO time. Inclusive upper bound. */
  until?: string;
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

const EXPORT_PAGE_SIZE = 500;
const EXPORT_MAX_PAGES = 20;

/** Every log in [since, until], oldest first. Pages the existing list API. */
export async function getDeviceLogsInWindow(
  query: Omit<DeviceLogsQuery, 'page' | 'limit' | 'since' | 'until'>,
  since: string,
  until: string,
): Promise<DeviceLogRow[]> {
  const collected: DeviceLogRow[] = [];
  let total = Number.POSITIVE_INFINITY;

  for (let page = 1; page <= EXPORT_MAX_PAGES && collected.length < total; page += 1) {
    const result = await getDeviceLogs({
      ...query,
      since,
      until,
      page,
      limit: EXPORT_PAGE_SIZE,
    });
    total = result.total;
    collected.push(...result.items);
    if (result.items.length < EXPORT_PAGE_SIZE) break;
  }

  return collected.reverse();
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
