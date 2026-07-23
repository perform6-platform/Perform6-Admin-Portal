import type { ApiResponse } from '../types/api';
import type {
  DeleteMediaResult,
  LibrarySummary,
  MediaAsset,
  MediaListQuery,
  MediaListResult,
  MediaUploadResult,
  UpdateMediaPayload,
  UploadMediaPayload,
} from '../types/media';
import { MULTIPART_HEADERS, toFormData } from '../lib/formData';
import { apiClient } from './axios';

/** POST /media/upload — multipart (libraryType or programId). */
export async function uploadMedia(payload: UploadMediaPayload): Promise<MediaUploadResult> {
  const form = toFormData({
    file: payload.file,
    title: payload.title,
    libraryType: payload.libraryType,
    programId: payload.programId,
    thumbnail: payload.thumbnail,
    mediaType: payload.mediaType,
    durationSeconds: payload.durationSeconds,
    resolution: payload.resolution,
    codec: payload.codec,
  });
  const { data } = await apiClient.post<ApiResponse<MediaUploadResult>>('/media/upload', form, {
    headers: MULTIPART_HEADERS,
    onUploadProgress: (event) => {
      if (!payload.onUploadProgress) return;
      const total = event.total ?? payload.file.size;
      if (!total) {
        payload.onUploadProgress(0);
        return;
      }
      const percent = Math.min(100, Math.round((event.loaded / total) * 100));
      payload.onUploadProgress(percent);
    },
  });
  return data.data;
}

/** GET /media/processing/:jobId — BullMQ progress 0–100. */
export async function getMediaProcessingProgress(
  jobId: string,
): Promise<{ jobId: string; progress: number; state: string }> {
  const { data } = await apiClient.get<
    ApiResponse<{ jobId: string; progress: number; state: string }>
  >(`/media/processing/${encodeURIComponent(jobId)}`);
  return data.data;
}

/**
 * GET /media — returns { items, meta }.
 * Normalizes a bare array as well, and uppercases sortOrder (ASC|DESC).
 */
export async function getMediaAssets(query: MediaListQuery = {}): Promise<MediaListResult> {
  const params: Record<string, string | number | undefined> = {
    libraryType: query.libraryType,
    status: query.status,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder ? query.sortOrder.toUpperCase() : undefined,
  };

  const { data } = await apiClient.get<ApiResponse<MediaAsset[] | MediaListResult>>('/media', {
    params,
  });
  const payload = data.data;
  if (Array.isArray(payload)) {
    return { items: payload, meta: undefined };
  }
  if (payload && Array.isArray(payload.items)) {
    return payload;
  }
  return { items: [], meta: undefined };
}

/** GET /media/library-summary */
export async function getLibrarySummary(): Promise<LibrarySummary> {
  const { data } = await apiClient.get<ApiResponse<LibrarySummary>>('/media/library-summary');
  return data.data;
}

/** GET /media/:id */
export async function getMediaAsset(id: string): Promise<MediaAsset> {
  const { data } = await apiClient.get<ApiResponse<MediaAsset>>(`/media/${id}`);
  return data.data;
}

/** PATCH /media/:id */
export async function updateMediaAsset(
  id: string,
  payload: UpdateMediaPayload,
): Promise<MediaAsset> {
  const { data } = await apiClient.patch<ApiResponse<MediaAsset>>(`/media/${id}`, payload);
  return data.data;
}

/** DELETE /media/:id — archives asset and removes files from storage. */
export async function deleteMediaAsset(id: string): Promise<DeleteMediaResult> {
  const { data } = await apiClient.delete<ApiResponse<DeleteMediaResult> | DeleteMediaResult>(
    `/media/${id}`,
  );
  if (data && typeof data === 'object' && 'data' in data && data.data) {
    return data.data;
  }
  return data as DeleteMediaResult;
}
