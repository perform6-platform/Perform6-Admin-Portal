import type { ApiResponse, SuccessFlag } from '../types/api';
import { normalizeRotationPrograms } from '../lib/rotationMapper';
import type { Program, ProgramSession } from '../types/content';
import type { PlaybackManifest } from '../types/deployments';
import type {
  CategoryRotationDay,
  CreateRotationSessionPayload,
  DeviceCurrentRotation,
  DeviceRotationStartDate,
  GlobalRotation,
  GlobalRotationSettings,
  ProgramRotationPatchPayload,
  RotationBulkPayload,
  RotationBulkSection,
  SetRotationStartDatePayload,
  UpdateGlobalRotationSettingsPayload,
  UpdateRotationSessionPayload,
} from '../types/rotation';
import { apiClient } from './axios';

/** GET /rotation/settings/global — portal global rotation start date. */
export async function getGlobalRotationSettings(): Promise<GlobalRotationSettings> {
  const { data } = await apiClient.get<ApiResponse<GlobalRotationSettings>>(
    '/rotation/settings/global',
  );
  return data.data;
}

/** PUT /rotation/settings/global — PLATFORM_ADMIN only. */
export async function updateGlobalRotationSettings(
  payload: UpdateGlobalRotationSettingsPayload,
): Promise<GlobalRotationSettings> {
  const { data } = await apiClient.put<ApiResponse<GlobalRotationSettings>>(
    '/rotation/settings/global',
    payload,
  );
  return data.data;
}

/** GET /rotation — all rotation programs with day order. */
export async function getRotationPrograms(): Promise<Program[]> {
  const { data } = await apiClient.get<ApiResponse<unknown>>('/rotation');
  return normalizeRotationPrograms(data.data);
}

/** POST /rotation — create a rotation session. */
export async function createRotationSession(
  payload: CreateRotationSessionPayload,
): Promise<ProgramSession> {
  const { data } = await apiClient.post<ApiResponse<ProgramSession>>('/rotation', payload);
  return data.data;
}

/** PATCH /rotation/bulk/:section — save an entire rotation section at once. */
export async function patchRotationBulk(
  section: RotationBulkSection,
  payload: RotationBulkPayload,
): Promise<Program[]> {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(
    `/rotation/bulk/${section}`,
    payload,
  );
  return normalizeRotationPrograms(data.data);
}

/** PATCH /rotation/programs/:programId — custom category day assignments. */
export async function patchRotationProgram(
  programId: string,
  payload: ProgramRotationPatchPayload,
): Promise<unknown> {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(
    `/rotation/programs/${programId}`,
    payload,
  );
  return data.data;
}

/** PATCH /rotation/devices/:deviceId/start-date — step 6 (PLATFORM_ADMIN). */
export async function setDeviceRotationStartDate(
  deviceId: string,
  payload: SetRotationStartDatePayload,
): Promise<DeviceRotationStartDate> {
  const { data } = await apiClient.patch<ApiResponse<DeviceRotationStartDate>>(
    `/rotation/devices/${deviceId}/start-date`,
    payload,
  );
  return data.data;
}

/** GET /rotation/devices/:deviceId/current */
export async function getDeviceCurrentRotation(
  deviceId: string,
): Promise<DeviceCurrentRotation> {
  const { data } = await apiClient.get<ApiResponse<DeviceCurrentRotation>>(
    `/rotation/devices/${deviceId}/current`,
  );
  return data.data;
}

/** GET /rotation/devices/:deviceId/playback */
export async function getDevicePlayback(deviceId: string): Promise<PlaybackManifest> {
  const { data } = await apiClient.get<ApiResponse<PlaybackManifest>>(
    `/rotation/devices/${deviceId}/playback`,
  );
  return data.data;
}

/** GET /rotation/current — legacy global. */
export async function getGlobalRotation(): Promise<GlobalRotation> {
  const { data } = await apiClient.get<ApiResponse<GlobalRotation>>('/rotation/current');
  return data.data;
}

/** GET /rotation/day/:day — preview day 1–36. */
export async function getRotationDay(day: number): Promise<unknown> {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/rotation/day/${day}`);
  return data.data;
}

/** GET /rotation/:category — e.g. FITNESS_WALL. */
export async function getCategoryRotation(category: string): Promise<unknown> {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/rotation/${category}`);
  return data.data;
}

/** GET /rotation/:category/day/:day */
export async function getCategoryRotationDay(
  category: string,
  day: number,
): Promise<CategoryRotationDay> {
  const { data } = await apiClient.get<ApiResponse<CategoryRotationDay>>(
    `/rotation/${category}/day/${day}`,
  );
  return data.data;
}

/** PATCH /rotation/:sessionId */
export async function updateRotationSession(
  sessionId: string,
  payload: UpdateRotationSessionPayload,
): Promise<ProgramSession> {
  const { data } = await apiClient.patch<ApiResponse<ProgramSession>>(
    `/rotation/${sessionId}`,
    payload,
  );
  return data.data;
}

/** DELETE /rotation/:sessionId */
export async function deleteRotationSession(sessionId: string): Promise<SuccessFlag> {
  const { data } = await apiClient.delete<ApiResponse<SuccessFlag>>(`/rotation/${sessionId}`);
  return data.data;
}
