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
