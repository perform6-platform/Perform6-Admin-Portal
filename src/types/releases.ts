export interface AppRelease {
  id: string;
  version: string;
  model: string | null;
  fileUrl: string | null;
  checksum: string | null;
  fileSize: string | null;
  releaseNotes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateReleasePayload {
  version: string;
  model?: string;
  releaseNotes?: string;
  file?: File;
}

export interface UpdateReleasePayload {
  releaseNotes?: string;
  fileUrl?: string;
  checksum?: string;
}
