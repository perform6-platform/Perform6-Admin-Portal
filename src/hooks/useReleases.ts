import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  createRelease,
  deployRelease,
  getOtaFleet,
  getReleases,
  publishRelease,
  updateRelease,
} from '../services/releases.api';
import type {
  CreateReleasePayload,
  DeployReleasePayload,
  UpdateReleasePayload,
} from '../types/releases';

/** GET /releases */
export function useReleases() {
  return useQuery({ queryKey: queryKeys.releases.all, queryFn: getReleases });
}

/** GET /releases/ota-fleet */
export function useOtaFleet() {
  return useQuery({
    queryKey: queryKeys.releases.otaFleet,
    queryFn: getOtaFleet,
    refetchInterval: (query) => {
      const updating = (query.state.data?.summary.updating ?? 0) > 0;
      return updating ? 5_000 : 15_000;
    },
  });
}

/** POST /releases/deploy */
export function useDeployRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeployReleasePayload) => deployRelease(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.otaFleet });
      void queryClient.invalidateQueries({ queryKey: queryKeys.startupFiles.all });
    },
  });
}

/** POST /releases */
export function useCreateRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReleasePayload) => createRelease(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.otaFleet });
    },
  });
}

/** PATCH /releases/:id */
export function useUpdateRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateReleasePayload }) =>
      updateRelease(vars.id, vars.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.otaFleet });
    },
  });
}

/** POST /releases/publish */
export function usePublishRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (releaseId: string) => publishRelease(releaseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.otaFleet });
    },
  });
}
