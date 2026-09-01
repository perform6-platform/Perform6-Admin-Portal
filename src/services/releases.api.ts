import type { ApiResponse } from '../types/api';
import type {
  AppRelease,
  CreateReleasePayload,
  DeployReleasePayload,
  DeployReleaseResult,
  OtaFleetOverview,
  UpdateReleasePayload,
} from '../types/releases';
import { MULTIPART_HEADERS, toFormData } from '../lib/formData';
import { apiClient } from './axios';

/** GET /releases/ota-fleet */
export async function getOtaFleet(): Promise<OtaFleetOverview> {
  const { data } = await apiClient.get<ApiResponse<OtaFleetOverview>>('/releases/ota-fleet');
  return data.data;
}

/** POST /releases/deploy — upload startup ZIP + register + publish (one step). */
export async function deployRelease(
  payload: DeployReleasePayload,
): Promise<DeployReleaseResult> {
  const form = toFormData({
    version: payload.version,
    profile: payload.profile,
    model: payload.model,
    releaseNotes: payload.releaseNotes,
    publish: payload.publish ?? true,
    file: payload.file,
  });
  const { data } = await apiClient.post<ApiResponse<DeployReleaseResult>>(
    '/releases/deploy',
    form,
    { headers: MULTIPART_HEADERS },
  );
  return data.data;
}

/** POST /releases — multipart (PLATFORM_ADMIN). */
export async function createRelease(payload: CreateReleasePayload): Promise<AppRelease> {
  const form = toFormData({
    version: payload.version,
    model: payload.model,
    releaseNotes: payload.releaseNotes,
    file: payload.file,
  });
  const { data } = await apiClient.post<ApiResponse<AppRelease>>('/releases', form, {
    headers: MULTIPART_HEADERS,
  });
  return data.data;
}

/** GET /releases */
export async function getReleases(): Promise<AppRelease[]> {
  const { data } = await apiClient.get<ApiResponse<AppRelease[]>>('/releases');
  return data.data;
}

/** PATCH /releases/:id */
export async function updateRelease(
  id: string,
  payload: UpdateReleasePayload,
): Promise<AppRelease> {
  const { data } = await apiClient.patch<ApiResponse<AppRelease>>(`/releases/${id}`, payload);
  return data.data;
}

/** POST /releases/publish */
export async function publishRelease(releaseId: string): Promise<AppRelease> {
  const { data } = await apiClient.post<ApiResponse<AppRelease>>('/releases/publish', {
    releaseId,
  });
  return data.data;
}
