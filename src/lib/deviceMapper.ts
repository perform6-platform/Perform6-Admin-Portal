import { format, formatDistanceToNow } from 'date-fns';
import type { Device } from '../constants/devices';
import type { ContentItem } from '../constants/contentLibrary';
import { defaultContentThumbnail } from '../constants/contentLibrary';
import type { DeviceInventoryItem, RegisteredDevice } from '../types/devices';
import type { MediaAsset } from '../types/media';
import { getRotationDayFromConnectionStart } from './deviceSchedule';
import { libraryTypeToCategory, resolveStorageUrl } from './libraryType';

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  return formatDistanceToNow(date, { addSuffix: true });
}

function storagePercent(used?: string, capacity?: string): number {
  const usedBytes = Number(used ?? 0);
  const capacityBytes = Number(capacity ?? 0);
  if (!capacityBytes || Number.isNaN(usedBytes) || Number.isNaN(capacityBytes)) return 0;
  return Math.min(100, Math.round((usedBytes / capacityBytes) * 100));
}

function formatDuration(seconds: number | null | undefined): string | undefined {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return undefined;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

const PROFILE_CODES = new Set(['XT2145', 'XC4055', 'HD226']);

/** Top-level serial is sometimes the model/profile when BS unique id was missing. */
function isPlaceholderSerial(serial: string | null, model: string | null): boolean {
  if (!serial) return true;
  const upper = serial.toUpperCase();
  if (PROFILE_CODES.has(upper)) return true;
  if (model && serial.toLowerCase() === model.trim().toLowerCase()) return true;
  return false;
}

function isPlaceholderFirmware(firmware: string | null): boolean {
  if (!firmware) return true;
  const lower = firmware.toLowerCase();
  return lower === 'unknown' || lower === 'n/a' || lower === 'na' || lower === '—';
}

function isMacLike(value: string): boolean {
  return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(value);
}

/**
 * Prefer top-level fleet fields; when they are placeholders, fall back to
 * hardwareInfo from POST /devices/pair (device + BrightSign raw snapshot).
 */
function resolveSerialAndFirmware(item: {
  serialNumber?: string | null;
  model?: string | null;
  firmwareVersion?: string | null;
  macAddress?: string | null;
  hardwareInfo?: Record<string, unknown> | null;
}): { serialNumber: string; firmware: string } {
  const hw = asRecord(item.hardwareInfo) ?? {};
  const device = asRecord(hw.device) ?? {};

  const topSerial = readString(item.serialNumber);
  const model = readString(item.model, device.model, hw.model);

  const serialCandidates = [
    device.serialNumber,
    hw.uniqueId,
    hw.serialNumber,
    device.uniqueId,
    hw.autorunSerial,
  ]
    .map((v) => readString(v))
    .filter((v): v is string => Boolean(v))
    .filter((s) => !isPlaceholderSerial(s, model))
    .filter((s) => s !== '00:00:00:00:00:00')
    // Never promote ethernet MAC into the Serial Number field.
    .filter((s) => !isMacLike(s));

  const serialFromHw = serialCandidates[0] ?? null;

  const serialNumber =
    (!isPlaceholderSerial(topSerial, model) && !isMacLike(topSerial) && topSerial !== '00:00:00:00:00:00'
      ? topSerial
      : null) ||
    serialFromHw ||
    (!isMacLike(topSerial || '') && topSerial !== '00:00:00:00:00:00' ? topSerial : null) ||
    '—';

  const topFirmware = readString(item.firmwareVersion);
  const firmwareFromHw = readString(
    device.firmwareVersion,
    hw.osVersion,
    hw.bootVersion,
    hw.firmwareVersion,
    hw.autorunFw,
    device.osVersion,
    device.bootVersion,
  );

  const firmware =
    (!isPlaceholderFirmware(topFirmware) ? topFirmware : null) ||
    (!isPlaceholderFirmware(firmwareFromHw) ? firmwareFromHw : null) ||
    topFirmware ||
    firmwareFromHw ||
    '—';

  return { serialNumber, firmware };
}

function resolveMacAddress(item: {
  macAddress?: string | null;
  hardwareInfo?: Record<string, unknown> | null;
}): string {
  const hw = asRecord(item.hardwareInfo) ?? {};
  const device = asRecord(hw.device) ?? {};
  const mac = readString(
    item.macAddress,
    device.macAddress,
    hw.macAddress,
    hw.autorunMac,
  );
  if (!mac || mac === '00:00:00:00:00:00' || !isMacLike(mac)) return '—';
  return mac;
}

/** Map inventory row (GET /devices) into the UI Device shape. */
export function mapInventoryItem(item: DeviceInventoryItem): Device {
  const online = Boolean(item.isOnline);

  const effectiveStart =
    item.effectiveRotationStartDate ?? item.rotationStartDate ?? null;
  const rotationDay =
    typeof item.rotationDay === 'number'
      ? item.rotationDay
      : effectiveStart
        ? getRotationDayFromConnectionStart(effectiveStart)
        : null;

  const { serialNumber, firmware } = resolveSerialAndFirmware(item);

  return {
    id: item.deviceId ?? item.pairingId ?? serialNumber ?? 'unknown',
    name: item.deviceName?.trim() || serialNumber || 'Unnamed device',
    location: item.location?.trim() || '—',
    status: online ? 'online' : 'offline',
    currentDay: rotationDay ? `Day ${rotationDay}` : '—',
    brightSignStatus: online ? 'connected' : 'disconnected',
    lastSync: relativeTime(item.lastSeenAt),
    lastBoot: relativeTime(item.lastBootAt),
    sdPresent: typeof item.sdPresent === 'boolean' ? item.sdPresent : null,
    sdEventAt: item.sdEventAt ?? null,
    model: item.model?.trim() || '—',
    serialNumber,
    firmware,
    macAddress: resolveMacAddress(item),
    uptime: '—',
    storageUsed: 0,
    deviceId: item.deviceId,
    pairingId: item.pairingId,
    deploymentId: item.deploymentId,
    deploymentName: item.deploymentName ?? null,
    deploymentType: item.deploymentType ?? null,
    fieldCategory: item.fieldCategory ?? null,
    exerciseVariant: item.exerciseVariant ?? null,
    screens: item.screens ?? [],
    activationStatus: item.activationStatus ?? null,
    pairingStatus: item.pairingStatus ?? null,
    inventoryState: item.state,
    pairingCode: item.pairingCode ?? null,
    timezone: item.timezone ?? null,
    rotationDay,
    rotationMode: item.rotationMode,
  };
}

/** Map a registered device detail / fleet-status row into the UI Device shape. */
export function mapRegisteredDevice(device: RegisteredDevice): Device {
  const online =
    typeof device.isOnline === 'boolean'
      ? device.isOnline
      : Boolean(
          device.lastSeenAt &&
            Date.now() - new Date(device.lastSeenAt).getTime() < 5 * 60 * 1000 &&
            device.activationStatus !== 'DISABLED',
        );
  const effectiveStart =
    device.effectiveRotationStartDate ?? device.rotationStartDate ?? null;
  const computedDay = effectiveStart
    ? getRotationDayFromConnectionStart(effectiveStart)
    : null;

  const deploymentName =
    typeof device.deployment?.name === 'string' ? device.deployment.name : undefined;
  const hardwareProfile =
    device.deployment &&
    typeof device.deployment.config === 'object' &&
    device.deployment.config !== null &&
    'hardwareProfileCode' in device.deployment.config
      ? String((device.deployment.config as { hardwareProfileCode?: unknown }).hardwareProfileCode ?? '')
      : '';

  const apiRotationDay =
    typeof device.rotationDay === 'number' ? device.rotationDay : computedDay;

  return {
    id: device.id,
    name: device.deviceName || device.serialNumber || deploymentName || device.id.slice(0, 8),
    location: '—',
    status: online ? 'online' : 'offline',
    currentDay: apiRotationDay ? `Day ${apiRotationDay}` : '—',
    brightSignStatus: online ? 'connected' : 'disconnected',
    lastSync: relativeTime(device.lastSeenAt ?? device.health?.lastSyncAt ?? null),
    lastBoot: relativeTime(
      typeof device.health?.metadata?.lastBootAt === 'string'
        ? device.health.metadata.lastBootAt
        : null,
    ),
    sdPresent:
      typeof device.health?.metadata?.sdPresent === 'boolean'
        ? device.health.metadata.sdPresent
        : null,
    sdEventAt:
      typeof device.health?.metadata?.sdEventAt === 'string'
        ? device.health.metadata.sdEventAt
        : null,
    model: device.model || hardwareProfile || '—',
    serialNumber: device.serialNumber || '—',
    firmware: device.firmwareVersion || device.health?.firmwareVersion || '—',
    uptime: '—',
    storageUsed: storagePercent(
      device.health?.storageUsedBytes,
      device.health?.storageCapacityBytes,
    ),
    deviceId: device.id,
    deploymentId: device.deploymentId,
    deploymentName: deploymentName ?? null,
    deploymentType: device.deployment?.deploymentType ?? null,
    fieldCategory: device.deployment?.fieldCategory ?? null,
    exerciseVariant: device.deployment?.exerciseVariant ?? null,
    activationStatus: device.activationStatus,
    inventoryState: 'registered',
    rotationDay: apiRotationDay,
    rotationMode: device.rotationMode,
    screens: device.screens ?? [],
    touchUi: device.touchUi ?? null,
  };
}

/** Map API media asset into ContentItem for the library UI. */
export function mapMediaAssetToContentItem(asset: MediaAsset): ContentItem | null {
  const systemCategoryId = libraryTypeToCategory(asset.libraryType ?? undefined);
  const categoryId =
    systemCategoryId ??
    (asset.programId ? (asset.programId as ContentItem['categoryId']) : null);
  if (!categoryId) return null;

  const activeVersion = asset.versions?.find((v) => v.isActive) ?? asset.versions?.[0];
  const mediaType =
    asset.mediaType === 'IMAGE'
      ? 'image'
      : asset.mediaType === 'VIDEO'
        ? 'video'
        : 'video';

  const resolvedThumb =
    resolveStorageUrl(asset.thumbnailUrl) ??
    (asset.status === 'READY' ? resolveStorageUrl(activeVersion?.fileUrl) : null);

  // Bust browser cache when asset updates after processing finishes.
  const thumbnailUrl = resolvedThumb
    ? `${resolvedThumb}${resolvedThumb.includes('?') ? '&' : '?'}v=${encodeURIComponent(asset.updatedAt ?? asset.id)}`
    : defaultContentThumbnail;

  return {
    id: asset.id,
    title: asset.title,
    mediaType,
    categoryId,
    duration: formatDuration(asset.durationSeconds),
    dateLabel: asset.createdAt ? format(new Date(asset.createdAt), 'd MMM yyyy') : '—',
    format: activeVersion?.codec?.toUpperCase() ?? 'MP4',
    thumbnailUrl,
    videoUrl:
      asset.status === 'READY'
        ? resolveStorageUrl(activeVersion?.fileUrl) ?? undefined
        : undefined,
    mediaVersionId: activeVersion?.id,
    libraryType: asset.libraryType ?? undefined,
    programId: asset.programId ?? undefined,
    status: asset.status,
    updatedAt: asset.updatedAt,
  };
}
