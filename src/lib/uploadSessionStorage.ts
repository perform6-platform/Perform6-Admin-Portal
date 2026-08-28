const STORAGE_KEY = 'perform6:media-upload-session';

export type StoredUploadPart = {
  partNumber: number;
  etag: string;
};

export type StoredUploadSession = {
  sessionId: string;
  assetId: string;
  versionId: string;
  objectKey: string;
  fileName: string;
  fileSize: number;
  fileLastModified: number;
  partSize: number;
  totalParts: number;
  completedParts: StoredUploadPart[];
  thumbnailObjectKey?: string;
  title?: string;
  updatedAt: number;
};

export function loadStoredUploadSession(): StoredUploadSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUploadSession;
    if (!parsed?.sessionId || !parsed.assetId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredUploadSession(session: StoredUploadSession): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...session, updatedAt: Date.now() }),
  );
}

export function clearStoredUploadSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function fileMatchesStoredSession(file: File, session: StoredUploadSession): boolean {
  return (
    file.name === session.fileName &&
    file.size === session.fileSize &&
    file.lastModified === session.fileLastModified
  );
}

export function getUploadResumePercent(session: StoredUploadSession): number {
  if (!session.fileSize || session.totalParts <= 0) return 0;
  const uploadedBytes = session.completedParts.reduce((sum, part) => {
    const start = (part.partNumber - 1) * session.partSize;
    const end = Math.min(session.fileSize, start + session.partSize);
    return sum + (end - start);
  }, 0);
  return Math.min(99, Math.round((uploadedBytes / session.fileSize) * 100));
}
