import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  createRotationSession,
  deleteRotationSession,
  getCategoryRotationDay,
  getDeviceCurrentRotation,
  getDevicePlayback,
  getGlobalRotation,
  getGlobalRotationSettings,
  getRotationDay,
  getRotationPrograms,
  patchRotationBulk,
  patchRotationProgram,
  setDeviceRotationStartDate,
  updateGlobalRotationSettings,
  updateRotationSession,
} from '../services/rotation.api';
import { normalizeRotationPrograms } from '../lib/rotationMapper';
import type {
  CreateRotationSessionPayload,
  ProgramRotationPatchPayload,
  RotationBulkPayload,
  RotationBulkSection,
  SetRotationStartDatePayload,
  UpdateGlobalRotationSettingsPayload,
  UpdateRotationSessionPayload,
} from '../types/rotation';

/** GET /rotation */
export function useRotationPrograms() {
  return useQuery({ queryKey: queryKeys.rotation.all, queryFn: getRotationPrograms });
}

/** GET /rotation/settings/global */
export function useGlobalRotationSettings() {
  return useQuery({
    queryKey: queryKeys.rotation.globalSettings,
    queryFn: getGlobalRotationSettings,
  });
}

/** PUT /rotation/settings/global */
export function useUpdateGlobalRotationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGlobalRotationSettingsPayload) =>
      updateGlobalRotationSettings(payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.rotation.globalSettings, settings);
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.globalSettings });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.fleet });
    },
  });
}

/** GET /rotation/current */
export function useGlobalRotation() {
  return useQuery({ queryKey: queryKeys.rotation.current, queryFn: getGlobalRotation });
}

/** GET /rotation/day/:day */
export function useRotationDay(day: number | null) {
  return useQuery({
    queryKey: queryKeys.rotation.day(day ?? 0),
    queryFn: () => getRotationDay(day as number),
    enabled: day != null,
  });
}

/** GET /rotation/:category/day/:day */
export function useCategoryRotationDay(category: string | null, day: number | null) {
  return useQuery({
    queryKey: queryKeys.rotation.categoryDay(category ?? '', day ?? 0),
    queryFn: () => getCategoryRotationDay(category as string, day as number),
    enabled: Boolean(category) && day != null,
  });
}

/** GET /rotation/devices/:deviceId/current */
export function useDeviceCurrentRotation(deviceId: string | null) {
  return useQuery({
    queryKey: queryKeys.rotation.deviceCurrent(deviceId ?? ''),
    queryFn: () => getDeviceCurrentRotation(deviceId as string),
    enabled: Boolean(deviceId),
  });
}

/** GET /rotation/devices/:deviceId/playback */
export function useDevicePlayback(
  deviceId: string | null,
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: queryKeys.rotation.devicePlayback(deviceId ?? ''),
    queryFn: () => getDevicePlayback(deviceId as string),
    enabled: Boolean(deviceId),
    refetchInterval: options?.refetchInterval,
  });
}

/** POST /rotation */
export function useCreateRotationSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRotationSessionPayload) => createRotationSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.current });
    },
  });
}

/** PATCH /rotation/bulk/:section */
export function usePatchRotationBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { section: RotationBulkSection; payload: RotationBulkPayload }) =>
      patchRotationBulk(vars.section, vars.payload),
    onSuccess: (programs) => {
      const normalized = normalizeRotationPrograms(programs);
      if (normalized.length > 0) {
        queryClient.setQueryData(queryKeys.rotation.all, normalized);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.current });
    },
  });
}

/** PATCH /rotation/programs/:programId */
export function usePatchRotationProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { programId: string; payload: ProgramRotationPatchPayload }) =>
      patchRotationProgram(vars.programId, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.current });
    },
  });
}

/** PATCH /rotation/devices/:deviceId/start-date */
export function useSetDeviceRotationStartDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { deviceId: string; payload: SetRotationStartDatePayload }) =>
      setDeviceRotationStartDate(vars.deviceId, vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.deviceCurrent(vars.deviceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.fleet });
    },
  });
}

/** PATCH /rotation/:sessionId */
export function useUpdateRotationSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { sessionId: string; payload: UpdateRotationSessionPayload }) =>
      updateRotationSession(vars.sessionId, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.current });
    },
  });
}

/** DELETE /rotation/:sessionId */
export function useDeleteRotationSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteRotationSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rotation.current });
    },
  });
}
