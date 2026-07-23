import axios from 'axios';
import type { ApiResponse, SuccessFlag } from '../types/api';
import type {
  HealthStatus,
  HeartbeatPing,
  RuntimeEvent,
  RuntimeSessionEndPayload,
  SyncCheckPayload,
  SyncCheckResult,
  SyncDownloadCompletePayload,
  SyncStatusPayload,
} from '../types/runtime';
import { apiClient } from './axios';

type DeviceAuth = { apiToken: string; deviceId: string };

function deviceHeaders(auth: DeviceAuth, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${auth.apiToken}`,
    'X-Device-Id': auth.deviceId,
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Sync engine (device auth only)
// ---------------------------------------------------------------------------

/** POST /sync/check */
export async function syncCheck(
  payload: SyncCheckPayload,
  auth: DeviceAuth,
  runtimeContext?: { displayTarget?: string; clusterMember?: string },
): Promise<SyncCheckResult> {
  const extra: Record<string, string> = {};
  if (runtimeContext?.displayTarget) extra['X-Display-Target'] = runtimeContext.displayTarget;
  if (runtimeContext?.clusterMember) extra['X-Cluster-Member'] = runtimeContext.clusterMember;

  const { data } = await apiClient.post<ApiResponse<SyncCheckResult>>('/sync/check', payload, {
    headers: deviceHeaders(auth, extra),
  });
  return data.data;
}

/** POST /sync/status */
export async function syncStatus(
  payload: SyncStatusPayload,
  auth: DeviceAuth,
): Promise<{ syncJobId: string; status: string }> {
  const { data } = await apiClient.post<ApiResponse<{ syncJobId: string; status: string }>>(
    '/sync/status',
    payload,
    { headers: deviceHeaders(auth) },
  );
  return data.data;
}

/** POST /sync/download-complete */
export async function syncDownloadComplete(
  payload: SyncDownloadCompletePayload,
  auth: DeviceAuth,
): Promise<SuccessFlag> {
  const { data } = await apiClient.post<ApiResponse<SuccessFlag>>(
    '/sync/download-complete',
    payload,
    { headers: deviceHeaders(auth) },
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Runtime analytics (device auth only)
// ---------------------------------------------------------------------------

/** POST /runtime/session/end */
export async function runtimeSessionEnd(
  payload: RuntimeSessionEndPayload,
  auth: DeviceAuth,
): Promise<RuntimeEvent> {
  const { data } = await apiClient.post<ApiResponse<RuntimeEvent>>('/runtime/session/end', payload, {
    headers: deviceHeaders(auth),
  });
  return data.data;
}

// ---------------------------------------------------------------------------
// Health / heartbeat (public, no envelope)
// ---------------------------------------------------------------------------

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(
  /\/api\/v1\/?$/,
  '',
);

/** GET /health — public, raw body. */
export async function getHealth(): Promise<HealthStatus> {
  const { data } = await axios.get<HealthStatus>(`${apiClient.defaults.baseURL}/health`);
  return data;
}

/** GET /ping — public, raw body (mounted at server root). */
export async function getPing(): Promise<HeartbeatPing> {
  const { data } = await axios.get<HeartbeatPing>(`${rawBaseUrl}/ping`);
  return data;
}

/** GET /heartbeat — public, raw body (mounted at server root). */
export async function getHeartbeat(): Promise<HeartbeatPing> {
  const { data } = await axios.get<HeartbeatPing>(`${rawBaseUrl}/heartbeat`);
  return data;
}
