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
import {
  buildPartPlan,
  putBlobWithRetry,
  putPresignedFileWithProgress,
  retryApiCall,
  UPLOAD_PARALLEL_PARTS,
  UPLOAD_PART_BYTES,
} from '../lib/mediaUploadCore';
import {
  clearStoredUploadSession,
  loadStoredUploadSession,
  saveStoredUploadSession,
  type StoredUploadPart,
  type StoredUploadSession,
} from '../lib/uploadSessionStorage';
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

type InitMultipartUploadResult = {
  sessionId: string;
  asset: MediaAsset;
  version: { id: string };
  libraryType?: string | null;
  programId?: string | null;
  objectKey: string;
  uploadId: string;
  partSize: number;
  totalParts: number;
  expiresInSeconds: number;
  thumbnailUpload?: PresignedPutTarget;
};

type UploadSessionResponse = {
  id: string;
  assetId: string;
  versionId: string;
  objectKey: string;
  partSize: number;
  totalParts: number;
  completedParts: StoredUploadPart[];
  status: string;
  originalFilename: string;
  thumbnailObjectKey?: string | null;
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


async function fetchPartUrls(
  sessionId: string,
  partNumbers: number[],
): Promise<Record<number, string>> {
  const { data } = await apiClient.post<
    ApiResponse<{
      parts: { partNumber: number; uploadUrl: string }[];
    }>
  >('/media/upload/multipart/parts', { sessionId, partNumbers });
  const map: Record<number, string> = {};
  for (const part of data.data.parts) {
    map[part.partNumber] = part.uploadUrl;
  }
  return map;
}

async function recordParts(sessionId: string, parts: StoredUploadPart[]): Promise<void> {
  if (parts.length === 0) return;
  await apiClient.post('/media/upload/multipart/parts/record', { sessionId, parts });
}

async function uploadThumbnailIfNeeded(
  payload: UploadMediaPayload,
  thumbnailUpload: PresignedPutTarget | undefined,
  onProgress?: (percent: number) => void,
): Promise<string | undefined> {
  if (!payload.thumbnail || !thumbnailUpload) return undefined;
  const contentType =
    thumbnailUpload.headers['Content-Type'] ||
    thumbnailUpload.headers['content-type'] ||
    payload.thumbnail.type;
  await putPresignedFileWithProgress(
    thumbnailUpload.uploadUrl,
    payload.thumbnail,
    contentType,
    onProgress,
  );
  return thumbnailUpload.key;
}

async function completeDirectWithRetry(body: {
  assetId: string;
  versionId: string;
  objectKey: string;
  thumbnailObjectKey?: string;
  originalFilename: string;
}): Promise<MediaUploadResult> {
  const { data } = await retryApiCall(() =>
    apiClient.post<ApiResponse<MediaUploadResult>>('/media/upload/complete', body),
  );
  return data.data;
}

async function completeMultipartWithRetry(body: {
  sessionId: string;
  parts: StoredUploadPart[];
  thumbnailObjectKey?: string;
  originalFilename: string;
}): Promise<MediaUploadResult> {
  const { data } = await retryApiCall(() =>
    apiClient.post<ApiResponse<MediaUploadResult>>('/media/upload/multipart/complete', body),
  );
  return data.data;
}

async function uploadFileParts(params: {
  session: StoredUploadSession;
  file: File;
  initialCompleted?: StoredUploadPart[];
  onUploadProgress?: (percent: number) => void;
}): Promise<StoredUploadPart[]> {
  const plan = buildPartPlan(params.file.size, params.session.partSize);
  const completedMap = new Map<number, string>();
  for (const part of params.initialCompleted ?? []) {
    completedMap.set(part.partNumber, part.etag);
  }

  const pending = plan.filter((part) => !completedMap.has(part.partNumber));
  let uploadedBytes = plan
    .filter((part) => completedMap.has(part.partNumber))
    .reduce((sum, part) => sum + (part.end - part.start), 0);

  params.onUploadProgress?.(
    Math.min(100, Math.round((uploadedBytes / params.file.size) * 100)),
  );

  let cursor = 0;
  while (cursor < pending.length) {
    const batch = pending.slice(cursor, cursor + UPLOAD_PARALLEL_PARTS);
    cursor += UPLOAD_PARALLEL_PARTS;

    const partNumbers = batch.map((part) => part.partNumber);
    const urlMap = await fetchPartUrls(params.session.sessionId, partNumbers);

    await Promise.all(
      batch.map(async (part) => {
        const uploadUrl = urlMap[part.partNumber];
        if (!uploadUrl) {
          throw new Error(`Missing presigned URL for part ${part.partNumber}`);
        }
        const chunk = params.file.slice(part.start, part.end);
        const etag = await putBlobWithRetry(uploadUrl, chunk);
        completedMap.set(part.partNumber, etag);
        uploadedBytes += part.end - part.start;
        params.onUploadProgress?.(
          Math.min(100, Math.round((uploadedBytes / params.file.size) * 100)),
        );
      }),
    );

    const completedParts = [...completedMap.entries()]
      .map(([partNumber, etag]) => ({ partNumber, etag }))
      .sort((a, b) => a.partNumber - b.partNumber);

    await recordParts(params.session.sessionId, completedParts);

    saveStoredUploadSession({
      ...params.session,
      completedParts,
    });
  }

  return [...completedMap.entries()]
    .map(([partNumber, etag]) => ({ partNumber, etag }))
    .sort((a, b) => a.partNumber - b.partNumber);
}

async function uploadViaR2Multipart(payload: UploadMediaPayload): Promise<MediaUploadResult> {
  const contentType = payload.file.type || 'application/octet-stream';

  const { data: initWrap } = await apiClient.post<ApiResponse<InitMultipartUploadResult>>(
    '/media/upload/multipart/init',
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
  const init = initWrap.data;

  const storedSession: StoredUploadSession = {
    sessionId: init.sessionId,
    assetId: init.asset.id,
    versionId: init.version.id,
    objectKey: init.objectKey,
    fileName: payload.file.name,
    fileSize: payload.file.size,
    fileLastModified: payload.file.lastModified,
    partSize: init.partSize,
    totalParts: init.totalParts,
    completedParts: [],
    title: payload.title,
    updatedAt: Date.now(),
  };
  saveStoredUploadSession(storedSession);

  const thumbWeight = payload.thumbnail ? 0.08 : 0;
  const fileWeight = 1 - thumbWeight;

  const completedParts = await uploadFileParts({
    session: storedSession,
    file: payload.file,
    onUploadProgress: (percent) => {
      payload.onUploadProgress?.(Math.round(percent * fileWeight));
    },
  });

  const thumbnailObjectKey = await uploadThumbnailIfNeeded(
    payload,
    init.thumbnailUpload,
    (percent) => {
      const combined = Math.round(100 * fileWeight + percent * thumbWeight);
      payload.onUploadProgress?.(Math.min(100, combined));
    },
  );

  payload.onUploadProgress?.(100);

  const result = await completeMultipartWithRetry({
    sessionId: init.sessionId,
    parts: completedParts,
    thumbnailObjectKey,
    originalFilename: payload.file.name,
  });

  clearStoredUploadSession();
  return result;
}

async function uploadViaR2SinglePut(payload: UploadMediaPayload): Promise<MediaUploadResult> {
  const contentType = payload.file.type || 'application/octet-stream';

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
  const init = initWrap.data;

  const fileWeight = payload.thumbnail ? 0.92 : 1;
  const thumbWeight = payload.thumbnail ? 0.08 : 0;

  const uploadContentType =
    init.upload.headers['Content-Type'] ||
    init.upload.headers['content-type'] ||
    contentType;

  await putPresignedFileWithProgress(
    init.upload.uploadUrl,
    payload.file,
    uploadContentType,
    (percent) => {
      payload.onUploadProgress?.(Math.round(percent * fileWeight));
    },
  );

  const thumbnailObjectKey = await uploadThumbnailIfNeeded(
    payload,
    init.thumbnailUpload,
    (percent) => {
      const combined = Math.round(100 * fileWeight + percent * thumbWeight);
      payload.onUploadProgress?.(Math.min(100, combined));
    },
  );

  payload.onUploadProgress?.(100);

  return completeDirectWithRetry({
    assetId: init.asset.id,
    versionId: init.version.id,
    objectKey: init.upload.key,
    thumbnailObjectKey,
    originalFilename: payload.file.name,
  });
}

/** Resume an in-progress multipart upload (same file identity required). */
export async function resumeStoredUpload(
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<MediaUploadResult> {
  const stored = loadStoredUploadSession();
  if (!stored) {
    throw new Error('No upload session to resume');
  }

  const { data: sessionWrap } = await apiClient.get<ApiResponse<UploadSessionResponse>>(
    `/media/upload/session/${stored.sessionId}`,
  );
  const session = sessionWrap.data;

  if (session.status === 'UPLOADED' || session.status === 'ABORTED') {
    clearStoredUploadSession();
    throw new Error('Upload session is no longer active');
  }

  const mergedCompleted = session.completedParts ?? stored.completedParts ?? [];
  const activeSession: StoredUploadSession = {
    ...stored,
    assetId: session.assetId,
    versionId: session.versionId,
    objectKey: session.objectKey,
    partSize: session.partSize,
    totalParts: session.totalParts,
    completedParts: mergedCompleted,
  };
  saveStoredUploadSession(activeSession);

  const completedParts = await uploadFileParts({
    session: activeSession,
    file,
    initialCompleted: mergedCompleted,
    onUploadProgress,
  });

  onUploadProgress?.(100);

  const result = await completeMultipartWithRetry({
    sessionId: stored.sessionId,
    parts: completedParts,
    thumbnailObjectKey: session.thumbnailObjectKey ?? undefined,
    originalFilename: session.originalFilename ?? file.name,
  });

  clearStoredUploadSession();
  return result;
}

/** Retry BrightSign processing when upload succeeded but processing failed. */
export async function retryMediaProcessing(assetId: string): Promise<MediaUploadResult> {
  const { data } = await apiClient.post<ApiResponse<MediaUploadResult>>(
    `/media/${encodeURIComponent(assetId)}/retry-processing`,
  );
  return data.data;
}

/** Retry complete for assets where R2 upload succeeded but complete failed. */
export async function retryUploadComplete(params: {
  assetId: string;
  versionId: string;
  objectKey: string;
  originalFilename: string;
  thumbnailObjectKey?: string;
}): Promise<MediaUploadResult> {
  return completeDirectWithRetry(params);
}

export function getPendingUploadSession(): StoredUploadSession | null {
  return loadStoredUploadSession();
}

export function clearPendingUploadSession(): void {
  clearStoredUploadSession();
}

function formatDirectUploadError(error: unknown): Error {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);
  if (status === 404) {
    return new Error(
      'Direct-to-R2 upload is unavailable. The API may need a restart — contact support if this persists.',
    );
  }
  if (/STORAGE_DRIVER=r2|Direct-to-R2|multipart/i.test(message)) {
    return new Error(message);
  }
  return error instanceof Error ? error : new Error(message || 'Upload failed');
}

/** Direct-to-R2 upload (single PUT for small files, multipart for large). */
export async function uploadMedia(payload: UploadMediaPayload): Promise<MediaUploadResult> {
  try {
    if (payload.file.size > UPLOAD_PART_BYTES) {
      return await uploadViaR2Multipart(payload);
    }
    return await uploadViaR2SinglePut(payload);
  } catch (error) {
    throw formatDirectUploadError(error);
  }
}

export function assetHasPendingUpload(assetId: string): boolean {
  const session = loadStoredUploadSession();
  return session?.assetId === assetId;
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

export async function getLibrarySummary(): Promise<LibrarySummary> {
  const { data } = await apiClient.get<ApiResponse<LibrarySummary>>('/media/library-summary');
  return data.data;
}

export async function getMediaAsset(id: string): Promise<MediaAsset> {
  const { data } = await apiClient.get<ApiResponse<MediaAsset>>(`/media/${id}`);
  return data.data;
}

export async function updateMediaAsset(
  id: string,
  payload: UpdateMediaPayload,
): Promise<MediaAsset> {
  const { data } = await apiClient.patch<ApiResponse<MediaAsset>>(`/media/${id}`, payload);
  return data.data;
}

export async function deleteMediaAsset(id: string): Promise<DeleteMediaResult> {
  const { data } = await apiClient.delete<ApiResponse<DeleteMediaResult> | DeleteMediaResult>(
    `/media/${id}`,
  );
  if (data && typeof data === 'object' && 'data' in data && data.data) {
    return data.data;
  }
  return data as DeleteMediaResult;
}
