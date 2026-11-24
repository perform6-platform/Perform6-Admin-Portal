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
import type {
  DeviceSdFsResponse,
  QueueDeviceRemoteCommandPayload,
} from '../types/monitoring';
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

export interface UpdateFacilityPayload {
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string | null;
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityState?: string | null;
  facilityZip?: string | null;
  timezone?: string;
}

/** PATCH /devices/:id/name — admin rename (deviceId or pairingId). */
export async function updateDeviceName(
  id: string,
  deviceName: string,
): Promise<{
  deviceId: string | null;
  pairingId: string;
  deviceName: string;
  deploymentId: string | null;
  deploymentName: string | null;
}> {
  const { data } = await apiClient.patch<
    ApiResponse<{
      deviceId: string | null;
      pairingId: string;
      deviceName: string;
      deploymentId: string | null;
      deploymentName: string | null;
    }>
  >(`/devices/${id}/name`, { deviceName });
  return data.data;
}

/** PATCH /devices/:id/facility — contact, address, timezone after registration. */
export async function updateDeviceFacility(
  deviceId: string,
  payload: UpdateFacilityPayload,
): Promise<{
  deviceId: string;
  location: string | null;
  timezone: string | null;
  facilityCity: string | null;
  facilityState: string | null;
  facilityZip: string | null;
}> {
  const { data } = await apiClient.patch<
    ApiResponse<{
      deviceId: string;
      location: string | null;
      timezone: string | null;
      facilityCity: string | null;
      facilityState: string | null;
      facilityZip: string | null;
    }>
  >(`/devices/${deviceId}/facility`, payload);
  return data.data;
}

/** PATCH /devices/:id/schedule-timezone — admin confirms the gym IANA zone. */
export async function updateScheduleTimezone(
  deviceId: string,
  timezone: string,
): Promise<{
  deviceId: string;
  timezone: string;
  rotationDay: number;
  scheduleTimeZone: string;
  scheduleToday: string;
  nextRotationAt: string;
}> {
  const { data } = await apiClient.patch<
    ApiResponse<{
      deviceId: string;
      timezone: string;
      rotationDay: number;
      scheduleTimeZone: string;
      scheduleToday: string;
      nextRotationAt: string;
    }>
  >(`/devices/${deviceId}/schedule-timezone`, { timezone });
  return data.data;
}

/** GET /devices/:id — registered device detail. */
export async function getDeviceById(id: string): Promise<RegisteredDevice> {
  const { data } = await apiClient.get<ApiResponse<RegisteredDevice>>(`/devices/${id}`);
  return data.data;
}

export interface DeviceLifecycleResult {
  action: 'disconnect' | 'disable' | 'attach' | 'restore';
  deviceId?: string;
  deviceIds?: string[];
  deploymentId?: string | null;
  deploymentName?: string;
  cluster?: boolean;
  /** Disconnect queues CLEAR_SD_CACHE so the player wipes media and stops playback. */
  contentCleared?: boolean;
  reservedMemberKey?: string | null;
  reservedScreenKey?: string | null;
  restoredMemberKey?: string | null;
  restoredScreenKey?: string | null;
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

/** POST /devices/:id/ota-retry — clear staged OTA fail state and queue SYNC_NOW. */
export async function retryDeviceOta(
  deviceId: string,
  options?: { reboot?: boolean },
): Promise<{ ok: boolean; cleared: boolean }> {
  const q = options?.reboot ? '?reboot=1' : '';
  const { data } = await apiClient.post<
    ApiResponse<{ ok: boolean; cleared: boolean }>
  >(`/devices/${deviceId}/ota-retry${q}`);
  return data.data;
}

/** POST /devices/:id/media-retry — queue media-only SYNC_NOW (no OTA). */
export async function retryDeviceMedia(
  deviceId: string,
): Promise<{ ok: boolean }> {
  const { data } = await apiClient.post<ApiResponse<{ ok: boolean }>>(
    `/devices/${deviceId}/media-retry`,
  );
  return data.data;
}

/** GET /devices/:id/sd-fs — pending + latest mini-DWS SD result. */
export async function getDeviceSdFs(deviceId: string): Promise<DeviceSdFsResponse> {
  const { data } = await apiClient.get<ApiResponse<DeviceSdFsResponse>>(
    `/devices/${deviceId}/sd-fs`,
  );
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

/** POST /devices/:id/restore — re-open a disabled device for re-pair and attach. */
export async function restoreDevice(deviceId: string): Promise<DeviceLifecycleResult> {
  const { data } = await apiClient.post<ApiResponse<DeviceLifecycleResult>>(
    `/devices/${deviceId}/restore`,
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

export interface CardRecoveryStatus {
  allowed: boolean;
  expiresAt: string | null;
  usedAt: string | null;
  cancelledAt: string | null;
  grantId: string | null;
}

export interface CardRecoveryAllowResult {
  action: 'allow_card_recovery';
  deviceId: string;
  serialNumber: string;
  expiresAt: string;
  grantId: string;
  cardRecovery: CardRecoveryStatus;
}

export interface CardRecoveryCancelResult {
  action: 'cancel_card_recovery';
  deviceId: string;
  cancelledCount: number;
  cardRecovery: CardRecoveryStatus;
}

/** GET /devices/:id/card-recovery */
export async function getDeviceCardRecovery(deviceId: string): Promise<CardRecoveryStatus> {
  const { data } = await apiClient.get<ApiResponse<CardRecoveryStatus>>(
    `/devices/${deviceId}/card-recovery`,
  );
  return data.data;
}

/** POST /devices/:id/card-recovery/allow — 15-minute single-use blank-card approval. */
export async function allowDeviceCardRecovery(
  deviceId: string,
): Promise<CardRecoveryAllowResult> {
  const { data } = await apiClient.post<ApiResponse<CardRecoveryAllowResult>>(
    `/devices/${deviceId}/card-recovery/allow`,
  );
  return data.data;
}

/** POST /devices/:id/card-recovery/cancel */
export async function cancelDeviceCardRecovery(
  deviceId: string,
): Promise<CardRecoveryCancelResult> {
  const { data } = await apiClient.post<ApiResponse<CardRecoveryCancelResult>>(
    `/devices/${deviceId}/card-recovery/cancel`,
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
