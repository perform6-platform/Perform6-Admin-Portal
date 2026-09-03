import type { DeviceHealthEntity, RegisteredDevice } from './devices';

export interface FleetStatusSummary {
  total: number;
  active: number;
  offline: number;
  pending: number;
}

/** GET /monitoring/fleet/status */
export interface FleetStatus {
  summary: FleetStatusSummary;
  devices: RegisteredDevice[];
}

export interface HeartbeatRecord {
  id: string;
  deviceId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FleetHealthRecord extends DeviceHealthEntity {
  lastSyncAt?: string | null;
  lastPlaybackAt?: string | null;
  device?: RegisteredDevice;
}

/** GET /monitoring/fleet/health */
export interface FleetHealth {
  healthRecords: FleetHealthRecord[];
  recentHeartbeats: HeartbeatRecord[];
}

export interface AnalyticsEvent {
  id: string;
  deviceId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** GET /monitoring/analytics */
export interface AnalyticsResult {
  count: number;
  events: AnalyticsEvent[];
}

export interface AnalyticsQuery {
  from?: string;
  to?: string;
}

/** GET /monitoring/devices/:deviceId/live-playback */
export interface LivePlaybackScreen {
  screenKey: string;
  mediaVersionId: string | null;
  title: string | null;
  positionMs: number;
  durationMs: number | null;
  isPlaying: boolean;
  fileUrl: string | null;
  thumbnailUrl: string | null;
}

export interface LivePlaybackStatus {
  deviceId: string;
  deviceName: string | null;
  serialNumber: string | null;
  updatedAt: string | null;
  ageMs: number | null;
  isStale: boolean;
  isLive: boolean;
  screens: LivePlaybackScreen[];
  touchUi?: TouchUiSnapshot | null;
}

export interface TouchUiSnapshot {
  playbackState: string | null;
  currentContent: {
    slot?: string;
    title?: string | null;
    mediaVersionId?: string | null;
    screenKey?: string | null;
    sessionStartedAt?: number | null;
  } | null;
  updatedAt: string | null;
}

export type DeviceRemoteCommandAction =
  | 'PAUSE'
  | 'PLAY'
  | 'TOGGLE_PAUSE'
  | 'RETURN_TO_MENU'
  | 'SELECT_TOUCH_SLOT'
  | 'REBOOT'
  | 'SYNC_NOW'
  | 'CLEAR_SD_CACHE'
  | 'SD_LIST'
  | 'SD_READ'
  | 'SD_WRITE'
  | 'SD_DELETE';

export type TouchRemoteSlot =
  | 'touch-default'
  | 'start-here'
  | 'phase1'
  | 'phase2'
  | 'full-program';

export interface QueueDeviceRemoteCommandPayload {
  action: DeviceRemoteCommandAction;
  slot?: TouchRemoteSlot;
  path?: string;
  content?: string;
  encoding?: 'utf8' | 'base64' | string;
  forceOta?: boolean;
  skipOta?: boolean;
}

export interface SdFsEntry {
  name: string;
  size: number;
  kind: 'file' | 'dir' | string;
}

export interface SdFsLatestResult {
  commandId: string;
  action: string;
  ok: boolean;
  path: string;
  entries?: SdFsEntry[];
  content?: string;
  encoding?: string;
  error?: string | null;
  sizeBytes?: number | null;
  reportedAt?: string;
}

export interface SdFsPendingInfo {
  commandId: string;
  action: string;
  path?: string;
  queuedAt?: string;
}

export interface DeviceSdFsResponse {
  pending: SdFsPendingInfo | null;
  latest: SdFsLatestResult | null;
}
