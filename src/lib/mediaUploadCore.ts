/** R2 multipart part size — must match backend MEDIA_UPLOAD_PART_BYTES (16 MB). */
export const UPLOAD_PART_BYTES = 16 * 1024 * 1024;

/** Parallel part uploads. */
export const UPLOAD_PARALLEL_PARTS = 4;

/** Retries per part PUT. */
export const UPLOAD_PART_MAX_RETRIES = 4;

/** Retries for complete API calls. */
export const UPLOAD_COMPLETE_MAX_RETRIES = 5;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export type UploadPartPlan = {
  partNumber: number;
  start: number;
  end: number;
};

export function buildPartPlan(fileSize: number, partSize = UPLOAD_PART_BYTES): UploadPartPlan[] {
  const totalParts = Math.max(1, Math.ceil(fileSize / partSize));
  const parts: UploadPartPlan[] = [];
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * partSize;
    const end = Math.min(fileSize, start + partSize);
    parts.push({ partNumber, start, end });
  }
  return parts;
}

export function putBlobWithRetry(
  uploadUrl: string,
  blob: Blob,
  maxRetries = UPLOAD_PART_MAX_RETRIES,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const run = () => {
      attempt += 1;
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag') ?? xhr.getResponseHeader('etag');
          if (!etag) {
            reject(new Error('R2 part upload missing ETag header'));
            return;
          }
          resolve(etag.replace(/"/g, ''));
          return;
        }
        if (attempt < maxRetries) {
          void sleep(500 * attempt).then(run);
          return;
        }
        reject(new Error(`R2 part upload failed (${xhr.status})`));
      };
      xhr.onerror = () => {
        if (attempt < maxRetries) {
          void sleep(500 * attempt).then(run);
          return;
        }
        reject(new Error('R2 part upload network error'));
      };
      xhr.onabort = () => reject(new Error('R2 part upload aborted'));
      xhr.send(blob);
    };

    run();
  });
}

export function putPresignedFileWithProgress(
  uploadUrl: string,
  file: Blob,
  contentType: string | undefined,
  onUploadProgress?: (percent: number) => void,
  maxRetries = UPLOAD_PART_MAX_RETRIES,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const run = () => {
      attempt += 1;
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
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
        if (attempt < maxRetries) {
          void sleep(1000 * attempt).then(run);
          return;
        }
        reject(new Error(`R2 upload failed (${xhr.status})`));
      };
      xhr.onerror = () => {
        if (attempt < maxRetries) {
          void sleep(1000 * attempt).then(run);
          return;
        }
        reject(new Error('R2 upload network error'));
      };
      xhr.onabort = () => reject(new Error('R2 upload aborted'));
      xhr.send(file);
    };

    run();
  });
}

export async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxRetries = UPLOAD_COMPLETE_MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        throw error;
      }
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw lastError;
}
