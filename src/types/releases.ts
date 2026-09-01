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

export interface DeployReleasePayload {
  version: string;
  profile: 'xt2145' | 'xc4055' | 'hd226';
  model?: string;
  releaseNotes?: string;
  publish?: boolean;
  file: File;
}

export interface DeployReleaseResult {
  release: AppRelease;
  startup: {
    profile: string;
    packageName: string;
    filesUploaded: number;
    totalBytes: number;
    source: 'r2' | 'local';
  };
  published: boolean;
}

export type OtaFleetDeviceStatus =
  | 'UP_TO_DATE'
  | 'UPDATE_PENDING'
  | 'DOWNLOADING'
  | 'REBOOTING'
  | 'FAILED'
  | 'NO_RELEASE'
  | string;

export interface OtaFleetDeviceRow {
  deviceId: string;
  deviceName: string | null;
  serialNumber: string | null;
  model: string | null;
  isOnline: boolean;
  runtimeVersion: string | null;
  targetVersion: string | null;
  updateAvailable: boolean;
  otaStatus: OtaFleetDeviceStatus | null;
  otaDoneCount: number | null;
  otaTotalCount: number | null;
  otaCurrentPath: string | null;
  otaError: string | null;
  otaUpdatedAt: string | null;
  lastSeenAt: string | null;
}

export interface OtaFleetOverview {
  liveVersion: string | null;
  summary: {
    total: number;
    upToDate: number;
    updatePending: number;
    updating: number;
    failed: number;
  };
  devices: OtaFleetDeviceRow[];
}

export interface UpdateReleasePayload {
  releaseNotes?: string;
  fileUrl?: string;
  checksum?: string;
}
