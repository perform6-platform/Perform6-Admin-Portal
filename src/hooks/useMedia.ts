import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  deleteMediaAsset,
  getLibrarySummary,
  getMediaAsset,
  getMediaAssets,
  updateMediaAsset,
  uploadMedia,
} from '../services/media.api';
import type {
  MediaAsset,
  MediaListQuery,
  MediaListResult,
  UpdateMediaPayload,
  UploadMediaPayload,
} from '../types/media';

type MediaListOptions = Omit<
  UseQueryOptions<MediaListResult, Error, MediaListResult, ReturnType<typeof queryKeys.media.list>>,
  'queryKey' | 'queryFn'
>;

type MediaDetailOptions = Omit<
  UseQueryOptions<MediaAsset, Error, MediaAsset, ReturnType<typeof queryKeys.media.detail>>,
  'queryKey' | 'queryFn' | 'enabled'
>;

/** GET /media?libraryType=&status=&page=&limit= */
export function useMediaAssets(query: MediaListQuery = {}, options?: MediaListOptions) {
  return useQuery({
    queryKey: queryKeys.media.list(query),
    queryFn: () => getMediaAssets(query),
    ...options,
  });
}

/** GET /media/library-summary */
export function useLibrarySummary() {
  return useQuery({
    queryKey: queryKeys.media.librarySummary,
    queryFn: getLibrarySummary,
  });
}

/** GET /media/:id */
export function useMediaAsset(id: string | null, options?: MediaDetailOptions) {
  return useQuery({
    queryKey: queryKeys.media.detail(id ?? ''),
    queryFn: () => getMediaAsset(id as string),
    enabled: Boolean(id),
    ...options,
  });
}

/** POST /media/upload */
export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadMediaPayload) => uploadMedia(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

/** PATCH /media/:id */
export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateMediaPayload }) =>
      updateMediaAsset(vars.id, vars.payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });
}

/** DELETE /media/:id */
export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMediaAsset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });
}
