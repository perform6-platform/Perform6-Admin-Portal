import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  createRelease,
  getReleases,
  publishRelease,
  updateRelease,
} from '../services/releases.api';
import type { CreateReleasePayload, UpdateReleasePayload } from '../types/releases';

/** GET /releases */
export function useReleases() {
  return useQuery({ queryKey: queryKeys.releases.all, queryFn: getReleases });
}

/** POST /releases */
export function useCreateRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReleasePayload) => createRelease(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.releases.all }),
  });
}

/** PATCH /releases/:id */
export function useUpdateRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateReleasePayload }) =>
      updateRelease(vars.id, vars.payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.releases.all }),
  });
}

/** POST /releases/publish */
export function usePublishRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (releaseId: string) => publishRelease(releaseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.releases.all }),
  });
}
