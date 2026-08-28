const DB_NAME = 'perform6-upload-cache';
const DB_VERSION = 1;
const STORE = 'files';

export type CachedUploadFileMeta = {
  fileName: string;
  fileSize: number;
  fileLastModified: number;
  assetId?: string;
  cachedAt: number;
};

function cacheKey(meta: Pick<CachedUploadFileMeta, 'fileName' | 'fileSize' | 'fileLastModified'>): string {
  return `${meta.fileName}:${meta.fileSize}:${meta.fileLastModified}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

export async function cacheUploadFile(file: File, assetId?: string): Promise<void> {
  try {
    const db = await openDb();
    const key = cacheKey({
      fileName: file.name,
      fileSize: file.size,
      fileLastModified: file.lastModified,
    });
    const meta: CachedUploadFileMeta = {
      fileName: file.name,
      fileSize: file.size,
      fileLastModified: file.lastModified,
      assetId,
      cachedAt: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ blob: file, meta }, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
    });
    db.close();
  } catch {
    // Cache is best-effort — resume can fall back to file picker.
  }
}

export async function loadCachedUploadFile(
  meta: Pick<CachedUploadFileMeta, 'fileName' | 'fileSize' | 'fileLastModified'>,
): Promise<File | null> {
  try {
    const db = await openDb();
    const key = cacheKey(meta);
    const record = await new Promise<{ blob: Blob; meta: CachedUploadFileMeta } | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result as { blob: Blob; meta: CachedUploadFileMeta } | undefined);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
      },
    );
    db.close();
    if (!record?.blob) return null;
    return new File([record.blob], meta.fileName, {
      type: record.blob.type || 'video/mp4',
      lastModified: meta.fileLastModified,
    });
  } catch {
    return null;
  }
}

export async function clearCachedUploadFile(
  meta: Pick<CachedUploadFileMeta, 'fileName' | 'fileSize' | 'fileLastModified'>,
): Promise<void> {
  try {
    const db = await openDb();
    const key = cacheKey(meta);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
    });
    db.close();
  } catch {
    // ignore
  }
}

/** Prompt user to pick a file (hidden input) — used only when IndexedDB cache miss. */
export function pickVideoFile(existingName?: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      document.body.removeChild(input);
      resolve(file);
    };
    input.oncancel = () => {
      document.body.removeChild(input);
      resolve(null);
    };
    input.click();
  });
}

export function isInterruptedUploadAsset(
  assetId: string,
  assetStatus?: string,
): boolean {
  if (assetStatus !== 'PROCESSING') return false;
  try {
    const raw = localStorage.getItem('perform6:media-upload-session');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { assetId?: string };
    return parsed?.assetId === assetId;
  } catch {
    return false;
  }
}
