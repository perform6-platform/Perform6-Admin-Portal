import type { MediaVersion } from './media';
import type { RotationMode } from './rotation';

// ---------------------------------------------------------------------------
// Device pairing (device boot + admin claim)
// ---------------------------------------------------------------------------

export type PairingStatus = 'ONLINE' | 'ADMIN_CLAIMED' | 'REGISTERED' | 'EXPIRED';
export type PairingRegistrationStatus = 'PENDING' | 'CLAIMED' | 'REGISTERED';

/** Device inventory filter — GET /devices?state= */
export type DeviceInventoryState = 'all' | 'pending' | 'claimed' | 'registered';

export type HardwareProfileCode = 'XC4055' | 'XT2145' | 'HD226' | string;

/** POST /devices/pair — device boot (server generates the pairing code). */
export interface PairDevicePayload {
  serialNumber: string;
  model: string;
  firmwareVersion: string;
  ipAddress?: string;
  macAddress?: string;
  hardwareInfo?: Record<string, unknown>;
}

export interface PairDeviceData {
  pairingId: string;
  pairingCode: string;
  serialNumber: string;
  deviceName: string | null;
  status: PairingStatus;
  expiresAt: string;
}

/** POST /devices/pairings/claim — admin claims an ONLINE device. */
export interface ClaimPairingPayload {
  pairingCode: string;
  deviceName: string;
}

/** Shared PairingObject shape returned by the pairing endpoints. */
export interface PairingObject {
  id: string;
  pairingId: string;
  registrationStatus: PairingRegistrationStatus;
  pairingCode: string;
  serialNumber: string;
  model: string;
  firmwareVersion: string;
  deviceName: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  hardwareInfo: Record<string, unknown>;
  status: PairingStatus;
  lastSeenAt: string | null;
  expiresAt: string;
  claimedAt: string | null;
  registeredAt: string | null;
  isOnline: boolean;
  registeredDeviceId: string | null;
  createdAt: string;
}

/** GET /devices/pairing/:code?strict=true response. */
export interface StrictPairingLookup extends PairingObject {
  valid: boolean;
}

// ---------------------------------------------------------------------------
// Unified inventory row — GET /devices?state=&hardwareProfile=&search=&page=
// ---------------------------------------------------------------------------

export interface DeviceInventoryItem {
  state: 'pending' | 'claimed' | 'registered';
  pairingId: string | null;
  deviceId: string | null;
  serialNumber: string | null;
  deviceName: string | null;
  model: string | null;
  location: string | null;
  timezone: string | null;
  deploymentId: string | null;
  deploymentName?: string | null;
  deploymentType?: string | null;
  fieldCategory?: string | null;
  exerciseVariant?: string | null;
  /** Screen → category snapshot for Field/Content display when axes are derived. */
  screens?: Array<{
    screenKey: string;
    categoryId: string | null;
    categoryName: string | null;
    categorySlug?: string | null;
    playlistKey?: string | null;
  }>;
  activationStatus?: string | null;
  pairingStatus?: string | null;
  lastSeenAt: string | null;
  claimedAt: string | null;
  registeredAt: string | null;
  pairingCode: string | null;
  firmwareVersion?: string | null;
  macAddress?: string | null;
  /** Full BrightSign / player JSON from POST /devices/pair (when present). */
  hardwareInfo?: Record<string, unknown> | null;
  hardwareProfile?: HardwareProfileCode | null;
  isOnline?: boolean;
  rotationMode?: RotationMode;
  rotationStartDate?: string | null;
  effectiveRotationStartDate?: string | null;
  rotationDay?: number | null;
  /** Site owner contact (offline prefetch emails). */
  ownerName?: string | null;
  ownerEmail?: string | null;
  siteAddress?: string | null;
  ownerPhone?: string | null;
}

export interface DeviceInventoryMeta {
  page: number;
  limit: number;
  total: number;
  counts: {
    pending: number;
    claimed: number;
    registered: number;
  };
}

export interface DeviceInventoryResult {
  items: DeviceInventoryItem[];
  meta: DeviceInventoryMeta;
}

export interface DeviceInventoryQuery {
  state?: DeviceInventoryState;
  hardwareProfile?: HardwareProfileCode;
  search?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Registered device detail — GET /devices/:id
// ---------------------------------------------------------------------------

export type DeviceActivationStatus = 'ACTIVE' | 'INACTIVE' | 'OFFLINE' | 'PENDING' | string;
export type PlaybackState = 'IDLE' | 'MENU' | 'PLAYING' | 'PAUSED' | 'MODAL';

export interface DeviceHealthEntity {
  deviceId: string;
  status: DeviceActivationStatus;
  firmwareVersion?: string;
  storageUsedBytes?: string;
  storageCapacityBytes?: string;
  lastSyncAt?: string | null;
  lastPlaybackAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DeploymentSummary {
  id: string;
  name?: string | null;
  deploymentType: string;
  fieldCategory: string;
  exerciseVariant: string;
  config?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface RegisteredDevice {
  id: string;
  deploymentId: string;
  pairingId?: string | null;
  serialNumber?: string;
  deviceName?: string;
  model?: string;
  firmwareVersion?: string;
  screenCount: number;
  runtimeVersion?: string | null;
  activationStatus: DeviceActivationStatus;
  lastSeenAt: string | null;
  storageUsed: string;
  rotationMode?: RotationMode;
  rotationStartDate: string | null;
  effectiveRotationStartDate?: string | null;
  /** Presence from lastSeenAt (5 min window) — set by GET /monitoring/fleet/status */
  isOnline?: boolean;
  registrationStatus?: PairingRegistrationStatus;
  deployment?: DeploymentSummary | null;
  health?: DeviceHealthEntity | null;
  /** Enriched by GET /monitoring/fleet/status — today's content per screen */
  rotationDay?: number | null;
  screens?: Array<{
    screenKey: string;
    categoryId: string | null;
    categoryName: string | null;
    title: string | null;
    thumbnail: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Prefer DeviceInventoryResult — kept for transitional mapping. */
export interface FleetOverview {
  registered: RegisteredDevice[];
  pendingDevices: PairingObject[];
  claimedDevices: PairingObject[];
  pendingPairings: PairingObject[];
  total: number;
}

/** PATCH /devices/me/metadata — device auth. */
export interface DeviceMetadataPayload {
  deviceName?: string;
  firmwareVersion?: string;
  runtimeVersion?: string;
}

/** POST /devices/me/heartbeat — device auth. */
export interface DeviceHeartbeatPayload {
  runtimeVersion: string;
  firmwareVersion: string;
  storageUsedBytes: string;
  storageCapacityBytes: string;
  playbackState: PlaybackState;
  currentContent?: {
    slot: string;
    title: string;
    mediaVersionId: string;
    screenKey: string;
  };
  metadata?: Record<string, unknown>;
}

export type { MediaVersion };
