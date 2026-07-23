import type { ApiResponse } from '../types/api';
import type { Branding } from '../types/branding';
import type {
  CategoryOption,
  CreateScreenAssignmentPayload,
  DeploymentEntity,
  DeploymentListResult,
  DeploymentPreview,
  DeploymentPreviewQuery,
  DeploymentScheduleTable,
  DeploymentScheduleTableQuery,
  DeploymentTypeOption,
  HardwareBindingPayload,
  HardwareProfile,
  ListDeploymentsQuery,
  RegisterDeploymentPayload,
  RegisterDeploymentResult,
  RuntimeManifestQuery,
  RuntimeManifestResult,
  ScreenAssignment,
  UpdateDeploymentPayload,
  UpdateScreenAssignmentPayload,
  VariantOption,
} from '../types/deployments';
import { normalizeDeploymentScheduleTable } from '../lib/scheduleTable';
import { apiClient } from './axios';

/** GET /deployments — paginated fleet list. */
export async function getDeployments(
  query: ListDeploymentsQuery = {},
): Promise<DeploymentListResult> {
  const { data } = await apiClient.get<ApiResponse<DeploymentListResult>>('/deployments', {
    params: query,
  });
  return data.data;
}

/** PATCH /deployments/:id */
export async function updateDeployment(
  id: string,
  payload: UpdateDeploymentPayload,
): Promise<DeploymentEntity> {
  const { data } = await apiClient.patch<ApiResponse<DeploymentEntity>>(
    `/deployments/${id}`,
    payload,
  );
  return data.data;
}

/** GET /deployments/types */
export async function getDeploymentTypes(): Promise<DeploymentTypeOption[]> {
  const { data } = await apiClient.get<ApiResponse<DeploymentTypeOption[]>>('/deployments/types');
  return data.data;
}

/** GET /deployments/categories */
export async function getDeploymentCategories(): Promise<CategoryOption[]> {
  const { data } = await apiClient.get<ApiResponse<CategoryOption[]>>('/deployments/categories');
  return data.data;
}

/** GET /deployments/categories/:id/variants */
export async function getCategoryVariants(categoryId: string): Promise<VariantOption[]> {
  const { data } = await apiClient.get<ApiResponse<VariantOption[]>>(
    `/deployments/categories/${categoryId}/variants`,
  );
  return data.data;
}

/** GET /deployments/preview */
export async function getDeploymentPreview(
  query: DeploymentPreviewQuery,
): Promise<DeploymentPreview> {
  const { data } = await apiClient.get<ApiResponse<DeploymentPreview>>('/deployments/preview', {
    params: {
      deploymentType: query.deploymentType,
      fieldCategory: query.fieldCategory,
      exerciseVariant: query.exerciseVariant,
      rotationStartDate: query.rotationStartDate,
      day: query.day,
      screenCategories:
        query.screenCategories && query.screenCategories.length > 0
          ? JSON.stringify(query.screenCategories)
          : undefined,
    },
  });
  return data.data;
}

export interface RegisterDeploymentResponse {
  data: RegisterDeploymentResult;
  message: string;
}

/** POST /deployments/register — XC4055 / XT2145 / HD226 payloads. */
export async function registerDeployment(
  payload: RegisterDeploymentPayload,
): Promise<RegisterDeploymentResponse> {
  const { data } = await apiClient.post<ApiResponse<RegisterDeploymentResult>>(
    '/deployments/register',
    payload,
  );
  return { data: data.data, message: data.message };
}

/** GET /deployments/:id */
export async function getDeployment(id: string): Promise<DeploymentEntity> {
  const { data } = await apiClient.get<ApiResponse<DeploymentEntity>>(`/deployments/${id}`);
  return data.data;
}

/** GET /deployments/:id/schedule-table */
export async function getDeploymentScheduleTable(
  id: string,
  query: DeploymentScheduleTableQuery,
): Promise<DeploymentScheduleTable> {
  const { data } = await apiClient.get<ApiResponse<unknown>>(
    `/deployments/${id}/schedule-table`,
    { params: query },
  );
  return normalizeDeploymentScheduleTable(data.data, id);
}

/** GET /deployments/:id/branding */
export async function getDeploymentBranding(id: string): Promise<Branding[]> {
  const { data } = await apiClient.get<ApiResponse<Branding[]>>(`/deployments/${id}/branding`);
  return data.data;
}

/** GET /deployments/hardware-profiles */
export async function getHardwareProfiles(): Promise<HardwareProfile[]> {
  const { data } = await apiClient.get<ApiResponse<HardwareProfile[]>>(
    '/deployments/hardware-profiles',
  );
  return data.data;
}

/** GET /deployments/:id/screen-assignments */
export async function getScreenAssignments(id: string): Promise<ScreenAssignment[]> {
  const { data } = await apiClient.get<ApiResponse<ScreenAssignment[]>>(
    `/deployments/${id}/screen-assignments`,
  );
  return data.data;
}

/** POST /deployments/:id/screen-assignments */
export async function createScreenAssignment(
  id: string,
  payload: CreateScreenAssignmentPayload,
): Promise<ScreenAssignment> {
  const { data } = await apiClient.post<ApiResponse<ScreenAssignment>>(
    `/deployments/${id}/screen-assignments`,
    payload,
  );
  return data.data;
}

/** PATCH /deployments/:id/screen-assignments/:assignmentId */
export async function updateScreenAssignment(
  id: string,
  assignmentId: string,
  payload: UpdateScreenAssignmentPayload,
): Promise<ScreenAssignment> {
  const { data } = await apiClient.patch<ApiResponse<ScreenAssignment>>(
    `/deployments/${id}/screen-assignments/${assignmentId}`,
    payload,
  );
  return data.data;
}

/** POST /deployments/:id/hardware-bindings */
export async function createHardwareBindings(
  id: string,
  payload: HardwareBindingPayload,
): Promise<unknown> {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/deployments/${id}/hardware-bindings`,
    payload,
  );
  return data.data;
}

/** GET /deployments/:id/runtime-manifest */
export async function getRuntimeManifest(
  id: string,
  query: RuntimeManifestQuery = {},
): Promise<RuntimeManifestResult> {
  const { data } = await apiClient.get<ApiResponse<RuntimeManifestResult>>(
    `/deployments/${id}/runtime-manifest`,
    { params: query },
  );
  return data.data;
}
