export type MediaType = 'VIDEO' | 'IMAGE' | 'AUDIO' | string;
export type MediaStatus = 'READY' | 'PROCESSING' | 'FAILED' | 'ARCHIVED' | string;

/** Required on POST /media/upload and filterable on GET /media. */
export type LibraryType =
  | 'DEFAULT_FITNESS'
  | 'DEFAULT_GOLF'
  | 'START_HERE_FITNESS'
  | 'START_HERE_GOLF'
  | 'FITNESS_WALL'
  | 'FITNESS_NO_WALL'
  | 'GOLF_WALL'
  | 'GOLF_NO_WALL'
  | 'PHASE_2'
  | 'FULL_PROGRAM'
  | string;

export interface MediaAsset {
  id: string;
  title: string;
  mediaType: MediaType;
  libraryType?: LibraryType | null;
  programId?: string | null;
  durationSeconds: number | null;
  fileSize: string;
  thumbnailUrl: string | null;
  status: MediaStatus;
  createdAt: string;
  updatedAt: string;
  versions?: MediaVersion[];
}

export interface MediaVersion {
  id: string;
  mediaAssetId: string;
  fileUrl: string;
  checksum: string;
  codec: string | null;
  resolution: string | null;
  fileSize: string;
  isActive: boolean;
}

export interface MediaUploadResult {
  asset: MediaAsset;
  version: MediaVersion;
  libraryType?: LibraryType | null;
  programId?: string | null;
  processingJobId?: string;
}

export interface UploadMediaPayload {
  file: File;
  title: string;
  libraryType?: LibraryType;
  programId?: string;
  /** Optional — if omitted, backend extracts a frame (~1s) via ffmpeg for videos. */
  thumbnail?: File;
  mediaType?: MediaType;
  durationSeconds?: number;
  resolution?: string;
  codec?: string;
  /** Axios upload progress 0–100 for HTTP transfer phase. */
  onUploadProgress?: (percent: number) => void;
}

export interface MediaListResult {
  items: MediaAsset[];
  meta?: MediaListMeta;
}

export interface UpdateMediaPayload {
  title?: string;
  libraryType?: LibraryType;
  status?: MediaStatus;
  durationSeconds?: number;
}

export interface MediaListQuery {
  libraryType?: LibraryType;
  status?: MediaStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  /** Backend validation requires uppercase ASC | DESC. */
  sortOrder?: 'ASC' | 'DESC';
}

export interface MediaListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface DeleteMediaResult {
  id: string;
  deleted?: boolean;
  message?: string;
}


export interface LibrarySummaryItem {
  libraryType: LibraryType;
  label?: string;
  count: number;
}

export type LibrarySummary = LibrarySummaryItem[] | Record<string, number>;
