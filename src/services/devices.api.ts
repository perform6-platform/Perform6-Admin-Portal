import type { ApiResponse, SuccessFlag } from '../types/api';
import type {
  ClaimPairingPayload,
  DeviceHeartbeatPayload,
  DeviceInventoryQuery,
  DeviceInventoryResult,
  DeviceMetadataPayload,
  PairDeviceData,
  PairDevicePayload,
  PairingObject,
  RegisteredDevice,
  StrictPairingLookup,
} from '../types/devices';
import type { QueueDeviceRemoteCommandPayload } from '../types/monitoring';
import { apiClient } from './axios';

// ---------------------------------------------------------------------------
// Pairing
// ---------------------------------------------------------------------------

/** POST /devices/pair — public (device boot). */
export async function pairDeviceRequest(payload: PairDevicePayload): Promise<PairDeviceData> {
  const { data } = await apiClient.post<ApiResponse<PairDeviceData>>('/devices/pair', payload);
  return data.data;
}

export interface ClaimPairingResult {
  data: PairingObject;
  message: string;
}

/** POST /devices/pairings/claim — JWT (admin claims an ONLINE device). */
export async function claimPairingRequest(
  payload: ClaimPairingPayload,
): Promise<ClaimPairingResult> {
  const { data } = await apiClient.post<ApiResponse<PairingObject>>(
    '/devices/pairings/claim',
    payload,
  );
  return { data: data.data, message: data.message };
}

/** GET /devices/pairings/pending */
export async function getPendingPairings(): Promise<PairingObject[]> {
  const { data } = await apiClient.get<ApiResponse<PairingObject[]>>('/devices/pairings/pending');
  return data.data;
}

/** GET /devices/pairings/claimed */
export async function getClaimedPairings(): Promise<PairingObject[]> {
  const { data } = await apiClient.get<ApiResponse<PairingObject[]>>('/devices/pairings/claimed');
  return data.data;
}

/** GET /devices/pairings/history */
export async function getPairingHistory(): Promise<PairingObject[]> {
  const { data } = await apiClient.get<ApiResponse<PairingObject[]>>('/devices/pairings/history');
  return data.data;
}

/** GET /devices/pairings/:id */
export async function getPairingById(id: string): Promise<PairingObject> {
  const { data } = await apiClient.get<ApiResponse<PairingObject>>(`/devices/pairings/${id}`);
  return data.data;
}

/** GET /devices/pairing/:code?strict=true */
export async function getPairingByCode(
  code: string,
  strict = false,
): Promise<PairingObject | StrictPairingLookup> {
  const { data } = await apiClient.get<ApiResponse<PairingObject | StrictPairingLookup>>(
    `/devices/pairing/${code}`,
    { params: strict ? { strict: true } : undefined },
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Unified inventory — GET /devices?state=&hardwareProfile=&search=&page=&limit=
// ---------------------------------------------------------------------------

/** GET /devices — paginated inventory with state filter. */
export async function getDevices(
  query: DeviceInventoryQuery = {},
): Promise<DeviceInventoryResult> {
  const { data } = await apiClient.get<ApiResponse<DeviceInventoryResult>>('/devices', {
    params: {
      state: query.state ?? 'all',
      hardwareProfile: query.hardwareProfile,
      search: query.search || undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  return data.data;
}

/** @deprecated Prefer getDevices({ state: 'all' }). */
export async function getFleetOverview(): Promise<DeviceInventoryResult> {
  return getDevices({ state: 'all', page: 1, limit: 100 });
}

/** GET /devices/:id — registered device detail. */
export async function getDeviceById(id: string): Promise<RegisteredDevice> {
  const { data } = await apiClient.get<ApiResponse<RegisteredDevice>>(`/devices/${id}`);
  return data.data;
}

export interface DeviceLifecycleResult {
  action: 'disconnect' | 'disable' | 'attach';
  deviceId?: string;
  deviceIds?: string[];
  deploymentId?: string | null;
  deploymentName?: string;
  cluster?: boolean;
  activationStatus?: string;
  rePairAllowed?: boolean;
}

/** POST /devices/:id/remote-command — queue Bluefin remote control. */
export async function queueDeviceRemoteCommand(
  deviceId: string,
  payload: QueueDeviceRemoteCommandPayload,
): Promise<{ id: string; action: string; slot?: string; createdAt: string }> {
  const { data } = await apiClient.post<
    ApiResponse<{ id: string; action: string; slot?: string; createdAt: string }>
  >(`/devices/${deviceId}/remote-command`, payload);
  return data.data;
}

/** POST /devices/:id/disconnect */
export async function disconnectDevice(deviceId: string): Promise<DeviceLifecycleResult> {
  const { data } = await apiClient.post<ApiResponse<DeviceLifecycleResult>>(
    `/devices/${deviceId}/disconnect`,
  );
  return data.data;
}

/** POST /devices/:id/disable — requires disconnect first. */
export async function disableDevice(deviceId: string): Promise<DeviceLifecycleResult> {
  const { data } = await apiClient.post<ApiResponse<DeviceLifecycleResult>>(
    `/devices/${deviceId}/disable`,
  );
  return data.data;
}

/** POST /devices/:id/attach — reconnect to an existing deployment. */
export async function attachDevice(
  deviceId: string,
  deploymentId: string,
): Promise<DeviceLifecycleResult> {
  const { data } = await apiClient.post<ApiResponse<DeviceLifecycleResult>>(
    `/devices/${deviceId}/attach`,
    { deploymentId },
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Device-auth endpoints
// ---------------------------------------------------------------------------

export async function updateDeviceMetadata(
  payload: DeviceMetadataPayload,
  deviceAuth: { apiToken: string; deviceId: string },
): Promise<RegisteredDevice> {
  const { data } = await apiClient.patch<ApiResponse<RegisteredDevice>>(
    '/devices/me/metadata',
    payload,
    {
      headers: {
        Authorization: `Bearer ${deviceAuth.apiToken}`,
        'X-Device-Id': deviceAuth.deviceId,
      },
    },
  );
  return data.data;
}

export async function sendDeviceHeartbeat(
  payload: DeviceHeartbeatPayload,
  deviceAuth: { apiToken: string; deviceId: string },
): Promise<SuccessFlag> {
  const { data } = await apiClient.post<ApiResponse<SuccessFlag>>(
    '/devices/me/heartbeat',
    payload,
    {
      headers: {
        Authorization: `Bearer ${deviceAuth.apiToken}`,
        'X-Device-Id': deviceAuth.deviceId,
      },
    },
  );
  return data.data;
}
