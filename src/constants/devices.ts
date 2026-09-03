export type DeviceStatus = 'online' | 'offline';
export type BrightSignStatus = 'connected' | 'disconnected';

export interface Device {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  currentDay: string;
  brightSignStatus: BrightSignStatus;
  lastSync: string;
  /** Relative time of last autorun/UI boot heartbeat (when known). */
  lastBoot?: string;
  /** Last known SD card presence from heartbeat (null = never reported). */
  sdPresent?: boolean | null;
  sdEventAt?: string | null;
  model: string;
  serialNumber: string;
  firmware: string;
  /** BrightSign / player MAC when reported by GET /devices. */
  macAddress?: string;
  uptime: string;
  storageUsed: number;
  /** Registered device UUID — null while pending/claimed only. */
  deviceId?: string | null;
  pairingId?: string | null;
  deploymentId?: string | null;
  deploymentName?: string | null;
  deploymentType?: string | null;
  fieldCategory?: string | null;
  exerciseVariant?: string | null;
  activationStatus?: string | null;
  pairingStatus?: string | null;
  inventoryState?: 'pending' | 'claimed' | 'registered';
  pairingCode?: string | null;
  timezone?: string | null;
  rotationMode?: 'DEVICE' | 'GLOBAL';
  rotationDay?: number | null;
  screens?: Array<{
    screenKey: string;
    categoryId: string | null;
    categoryName: string | null;
    categorySlug?: string | null;
    playlistKey?: string | null;
    title: string | null;
    thumbnail: string | null;
  }>;
  touchUi?: {
    playbackState: string | null;
    currentContent: {
      slot?: string;
      title?: string | null;
      mediaVersionId?: string | null;
      screenKey?: string | null;
      sessionStartedAt?: number | null;
    } | null;
    updatedAt: string | null;
  } | null;
}

export const locationOptions = [
  { value: 'all', label: 'All Locations' },
  { value: 'new-york', label: 'New York Gym' },
  { value: 'chicago', label: 'Chicago Gym' },
  { value: 'dallas', label: 'Dallas Gym' },
  { value: 'los-angeles', label: 'Los Angeles Gym' },
  { value: 'miami', label: 'Miami Gym' },
  { value: 'boston', label: 'Boston Gym' },
] as const;

export const assignableLocations = locationOptions.filter((option) => option.value !== 'all');

const locationLabelByKey = Object.fromEntries(
  assignableLocations.map((option) => [option.value, option.label]),
) as Record<string, string>;

const locationKeyByLabel = Object.fromEntries(
  assignableLocations.map((option) => [option.label, option.value]),
) as Record<string, string>;

export function getLocationLabelFromKey(key: string): string {
  return locationLabelByKey[key] ?? key;
}

export function getLocationKeyFromLabel(label: string): string {
  return locationKeyByLabel[label] ?? assignableLocations[0]?.value ?? 'new-york';
}

export const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
] as const;
