import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  createBranding,
  deleteBranding,
  getBranding,
  getPlatformDefaultBranding,
  updateBranding,
} from '../services/branding.api';
import type { CreateBrandingPayload, UpdateBrandingPayload } from '../types/branding';

/** GET /branding/platform-default */
export function usePlatformDefaultBranding() {
  return useQuery({
    queryKey: queryKeys.branding.platformDefault,
    queryFn: getPlatformDefaultBranding,
  });
}

/** GET /branding/:id */
export function useBranding(id: string | null) {
  return useQuery({
    queryKey: queryKeys.branding.detail(id ?? ''),
    queryFn: () => getBranding(id as string),
    enabled: Boolean(id),
  });
}

/** POST /branding */
export function useCreateBranding() {
  return useMutation({
    mutationFn: (payload: CreateBrandingPayload) => createBranding(payload),
  });
}

/** PATCH /branding/:id */
export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateBrandingPayload }) =>
      updateBranding(vars.id, vars.payload),
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.branding.detail(vars.id) }),
  });
}

/** DELETE /branding/:id */
export function useDeleteBranding() {
  return useMutation({ mutationFn: (id: string) => deleteBranding(id) });
}
