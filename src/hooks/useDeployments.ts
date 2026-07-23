import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  createScreenAssignment,
  getCategoryVariants,
  getDeployment,
  getDeploymentBranding,
  getDeploymentCategories,
  getDeploymentPreview,
  getDeployments,
  getDeploymentScheduleTable,
  getDeploymentTypes,
  getHardwareProfiles,
  getRuntimeManifest,
  getScreenAssignments,
  registerDeployment,
  updateDeployment,
  updateScreenAssignment,
} from '../services/deployments.api';
import type {
  CreateScreenAssignmentPayload,
  DeploymentPreviewQuery,
  DeploymentScheduleTableQuery,
  ListDeploymentsQuery,
  RegisterDeploymentPayload,
  RuntimeManifestQuery,
  UpdateDeploymentPayload,
  UpdateScreenAssignmentPayload,
} from '../types/deployments';

/** GET /deployments */
export function useDeploymentsList(query: ListDeploymentsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.deployments.list(query),
    queryFn: () => getDeployments(query),
  });
}

/** PATCH /deployments/:id */
export function useUpdateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateDeploymentPayload }) =>
      updateDeployment(vars.id, vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.deployments.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

/** GET /deployments/types */
export function useDeploymentTypes() {
  return useQuery({ queryKey: queryKeys.deployments.types, queryFn: getDeploymentTypes });
}

/** GET /deployments/categories */
export function useDeploymentCategories() {
  return useQuery({ queryKey: queryKeys.deployments.categories, queryFn: getDeploymentCategories });
}

/** GET /deployments/categories/:id/variants */
export function useCategoryVariants(categoryId: string | null) {
  return useQuery({
    queryKey: queryKeys.deployments.variants(categoryId ?? ''),
    queryFn: () => getCategoryVariants(categoryId as string),
    enabled: Boolean(categoryId),
  });
}

/** GET /deployments/preview */
export function useDeploymentPreview(query: DeploymentPreviewQuery | null) {
  return useQuery({
    queryKey: queryKeys.deployments.preview(query),
    queryFn: () => getDeploymentPreview(query as DeploymentPreviewQuery),
    enabled: Boolean(query?.deploymentType),
  });
}

/** GET /deployments/:id */
export function useDeployment(id: string | null) {
  return useQuery({
    queryKey: queryKeys.deployments.detail(id ?? ''),
    queryFn: () => getDeployment(id as string),
    enabled: Boolean(id),
  });
}

/** GET /deployments/:id/schedule-table */
export function useDeploymentScheduleTable(
  deploymentId: string | null,
  query: DeploymentScheduleTableQuery | null,
) {
  return useQuery({
    queryKey: queryKeys.deployments.scheduleTable(deploymentId ?? '', query),
    queryFn: () =>
      getDeploymentScheduleTable(deploymentId as string, query as DeploymentScheduleTableQuery),
    enabled: Boolean(deploymentId && query?.rotationStartDate),
  });
}

/** GET /deployments/:id/branding */
export function useDeploymentBranding(id: string | null) {
  return useQuery({
    queryKey: queryKeys.deployments.branding(id ?? ''),
    queryFn: () => getDeploymentBranding(id as string),
    enabled: Boolean(id),
  });
}

/** GET /deployments/hardware-profiles */
export function useHardwareProfiles() {
  return useQuery({
    queryKey: queryKeys.deployments.hardwareProfiles,
    queryFn: getHardwareProfiles,
  });
}

/** GET /deployments/:id/screen-assignments */
export function useScreenAssignments(id: string | null) {
  return useQuery({
    queryKey: queryKeys.deployments.screenAssignments(id ?? ''),
    queryFn: () => getScreenAssignments(id as string),
    enabled: Boolean(id),
  });
}

/** GET /deployments/:id/runtime-manifest */
export function useRuntimeManifest(id: string | null, query: RuntimeManifestQuery = {}) {
  return useQuery({
    queryKey: queryKeys.deployments.runtimeManifest(id ?? '', query),
    queryFn: () => getRuntimeManifest(id as string, query),
    enabled: Boolean(id),
  });
}

/** POST /deployments/register */
export function useRegisterDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterDeploymentPayload) => registerDeployment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
    },
  });
}

/** POST /deployments/:id/screen-assignments */
export function useCreateScreenAssignment(deploymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScreenAssignmentPayload) =>
      createScreenAssignment(deploymentId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.deployments.screenAssignments(deploymentId),
      }),
  });
}

/** PATCH /deployments/:id/screen-assignments/:assignmentId */
export function useUpdateScreenAssignment(deploymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { assignmentId: string; payload: UpdateScreenAssignmentPayload }) =>
      updateScreenAssignment(deploymentId, vars.assignmentId, vars.payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.deployments.screenAssignments(deploymentId),
      }),
  });
}
