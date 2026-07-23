import type { ApiResponse, SuccessFlag } from '../types/api';
import type { Branding, CreateBrandingPayload, UpdateBrandingPayload } from '../types/branding';
import { MULTIPART_HEADERS, toFormData } from '../lib/formData';
import { apiClient } from './axios';

/** POST /branding — multipart. */
export async function createBranding(payload: CreateBrandingPayload): Promise<Branding> {
  const form = toFormData({
    brandName: payload.brandName,
    deploymentId: payload.deploymentId,
    logo: payload.logo,
  });
  const { data } = await apiClient.post<ApiResponse<Branding>>('/branding', form, {
    headers: MULTIPART_HEADERS,
  });
  return data.data;
}

/** GET /branding/platform-default */
export async function getPlatformDefaultBranding(): Promise<Branding> {
  const { data } = await apiClient.get<ApiResponse<Branding>>('/branding/platform-default');
  return data.data;
}

/** GET /branding/:id */
export async function getBranding(id: string): Promise<Branding> {
  const { data } = await apiClient.get<ApiResponse<Branding>>(`/branding/${id}`);
  return data.data;
}

/** PATCH /branding/:id — multipart. */
export async function updateBranding(
  id: string,
  payload: UpdateBrandingPayload,
): Promise<Branding> {
  const form = toFormData({
    brandName: payload.brandName,
    deploymentId: payload.deploymentId,
    logo: payload.logo,
  });
  const { data } = await apiClient.patch<ApiResponse<Branding>>(`/branding/${id}`, form, {
    headers: MULTIPART_HEADERS,
  });
  return data.data;
}

/** DELETE /branding/:id — PLATFORM_ADMIN. */
export async function deleteBranding(id: string): Promise<SuccessFlag> {
  const { data } = await apiClient.delete<ApiResponse<SuccessFlag>>(`/branding/${id}`);
  return data.data;
}
