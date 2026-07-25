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

type PresignedPutTarget = {
  uploadUrl: string;
  key: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
};

type InitDirectUploadResult = {
  asset: MediaAsset;
  version: { id: string };
  libraryType?: string | null;
  programId?: string | null;
  upload: PresignedPutTarget;
  thumbnailUpload?: PresignedPutTarget;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return error instanceof Error ? error.message : '';
  }
  const response = (error as { response?: { data?: { message?: string | string[] } } })
    .response;
  const message = response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string') return message;
  return error instanceof Error ? error.message : '';
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as { response?: { status?: number } }).response?.status;
}

/** PUT file to a presigned R2 URL with upload progress (0–100). */
function putPresignedFile(
  target: PresignedPutTarget,
  file: Blob,
  onUploadProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', target.uploadUrl, true);
    const contentType = target.headers['Content-Type'] || target.headers['content-type'];
    if (contentType) {
      xhr.setRequestHeader('Content-Type', contentType);
    }
    xhr.upload.onprogress = (event) => {
      if (!onUploadProgress || !event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onUploadProgress(percent);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onUploadProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`R2 upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('R2 upload network error'));
    xhr.onabort = () => reject(new Error('R2 upload aborted'));
    xhr.send(file);
  });
}

async function uploadMediaMultipart(
  payload: UploadMediaPayload,
): Promise<MediaUploadResult> {
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

/**
 * Prefer direct-to-R2 (presigned) for speed/scalability.
 * Falls back to multipart only when init is unsupported (local storage / old API).
 */
export async function uploadMedia(payload: UploadMediaPayload): Promise<MediaUploadResult> {
  const contentType = payload.file.type || 'application/octet-stream';

  let init: InitDirectUploadResult;
  try {
    const { data: initWrap } = await apiClient.post<ApiResponse<InitDirectUploadResult>>(
      '/media/upload/init',
      {
        title: payload.title,
        libraryType: payload.libraryType,
        programId: payload.programId,
        mediaType: payload.mediaType,
        durationSeconds: payload.durationSeconds,
        resolution: payload.resolution,
        codec: payload.codec,
        filename: payload.file.name,
        contentType,
        fileSize: payload.file.size,
        hasThumbnail: Boolean(payload.thumbnail),
        thumbnailContentType: payload.thumbnail?.type || undefined,
      },
    );
    init = initWrap.data;
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    const unsupported =
      status === 404 ||
      /STORAGE_DRIVER=r2|multipart POST \/media\/upload|Direct-to-R2/i.test(message);
    if (unsupported) {
      return uploadMediaMultipart(payload);
    }
    throw error;
  }

  const fileWeight = payload.thumbnail ? 0.9 : 1;
  const thumbWeight = payload.thumbnail ? 0.1 : 0;

  await putPresignedFile(init.upload, payload.file, (percent) => {
    payload.onUploadProgress?.(Math.round(percent * fileWeight));
  });

  if (payload.thumbnail && init.thumbnailUpload) {
    await putPresignedFile(init.thumbnailUpload, payload.thumbnail, (percent) => {
      const combined = Math.round(100 * fileWeight + percent * thumbWeight);
      payload.onUploadProgress?.(Math.min(100, combined));
    });
  }

  payload.onUploadProgress?.(100);

  const { data: completeWrap } = await apiClient.post<ApiResponse<MediaUploadResult>>(
    '/media/upload/complete',
    {
      assetId: init.asset.id,
      versionId: init.version.id,
      objectKey: init.upload.key,
      thumbnailObjectKey: init.thumbnailUpload?.key,
      originalFilename: payload.file.name,
    },
  );

  return completeWrap.data;
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
