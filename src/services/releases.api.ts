import type { ApiResponse } from '../types/api';
import type { AppRelease, CreateReleasePayload, UpdateReleasePayload } from '../types/releases';
import { MULTIPART_HEADERS, toFormData } from '../lib/formData';
import { apiClient } from './axios';

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
