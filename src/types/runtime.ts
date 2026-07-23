import type { PlaybackManifest } from './deployments';

// ---------------------------------------------------------------------------
// Sync engine (device auth only)
// ---------------------------------------------------------------------------

export type SyncStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface SyncCheckPayload {
  runtimeVersion: string;
  cachedMediaVersionIds: string[];
  displayTarget?: string;
  clusterMember?: string;
}

export interface SyncCheckResult {
  syncJobId: string;
  device: {
    id: string;
    serialNumber: string;
    deviceName: string;
    screenCount: number;
    rotationStartDate: string | null;
    currentRotationDay: number;
  };
  runtime: {
    version: string;
    fileUrl: string;
    checksum: string;
    updateAvailable: boolean;
  };
  deployment: {
    id: string;
    deploymentType: string;
    fieldCategory: string;
    exerciseVariant: string;
  };
  config: Record<string, unknown>;
  playbackManifest: PlaybackManifest | null;
  targetManifest: unknown | null;
  schedule: Array<{ offset: number; rotationDay: number }>;
  media: Array<{
    mediaVersionId: string;
    fileUrl: string;
    checksum: string;
    fileSize: string;
    cached: boolean;
  }>;
  cacheWindow: {
    startsAt: string;
    expiresAt: string;
    days: number;
  };
}

export interface SyncStatusPayload {
  syncJobId: string;
  status: SyncStatus;
  message?: string;
}

export interface SyncDownloadCompletePayload {
  syncJobId: string;
  mediaVersionId: string;
  status: SyncStatus;
  bytesDownloaded: string;
  durationMs: number;
  errorMessage?: string | null;
}

// ---------------------------------------------------------------------------
// Runtime analytics (device auth only)
// ---------------------------------------------------------------------------

export interface RuntimeSessionEndPayload {
  session: string;
  duration: number;
  completed: boolean;
  metadata?: Record<string, unknown>;
}

export interface RuntimeEvent {
  eventId: string;
  eventType: string;
  recordedAt: string;
}

export interface HealthStatus {
  status: string;
  info: Record<string, unknown>;
  error: Record<string, unknown>;
  details: Record<string, unknown>;
}

export interface HeartbeatPing {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
}
