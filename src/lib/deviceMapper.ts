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

/** Map inventory row (GET /devices) into the UI Device shape. */
export function mapInventoryItem(item: DeviceInventoryItem): Device {
  const online = Boolean(item.isOnline);

  const rotationDay = item.rotationStartDate
    ? getRotationDayFromConnectionStart(item.rotationStartDate)
    : null;

  return {
    id: item.deviceId ?? item.pairingId ?? item.serialNumber ?? 'unknown',
    name: item.deviceName?.trim() || item.serialNumber || 'Unnamed device',
    location: item.location?.trim() || '—',
    status: online ? 'online' : 'offline',
    currentDay: rotationDay ? `Day ${rotationDay}` : '—',
    brightSignStatus: online ? 'connected' : 'disconnected',
    lastSync: relativeTime(item.lastSeenAt),
    model: item.model?.trim() || '—',
    serialNumber: item.serialNumber?.trim() || '—',
    firmware: item.firmwareVersion?.trim() || '—',
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
  const rotationDay = device.rotationStartDate
    ? getRotationDayFromConnectionStart(device.rotationStartDate)
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
    typeof device.rotationDay === 'number' ? device.rotationDay : rotationDay;

  return {
    id: device.id,
    name: device.deviceName || device.serialNumber || deploymentName || device.id.slice(0, 8),
    location: '—',
    status: online ? 'online' : 'offline',
    currentDay: apiRotationDay ? `Day ${apiRotationDay}` : '—',
    brightSignStatus: online ? 'connected' : 'disconnected',
    lastSync: relativeTime(device.lastSeenAt ?? device.health?.lastSyncAt ?? null),
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
    screens: device.screens ?? [],
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
