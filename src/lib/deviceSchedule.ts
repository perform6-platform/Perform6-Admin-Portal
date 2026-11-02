import { differenceInCalendarDays } from 'date-fns';
import type { Device } from '../constants/devices';
import type { Deployment } from '../constants/deployments';
import { ROTATION_DAYS } from '../constants/contentPlayback';
import {
  rotationEditableColumns,
  type RotationScheduleRow,
} from '../constants/rotationSchedule';

export function parseDeviceCurrentDay(device: Device): number {
  const match = device.currentDay.match(/(\d+)/);
  const day = match ? Number.parseInt(match[1]!, 10) : 1;
  return day >= 1 && day <= ROTATION_DAYS ? day : 1;
}

export function getRotationDayFromConnectionStart(
  connectionStartDate: string,
  today = new Date(),
): number {
  const [year, month, day] = connectionStartDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return 1;

  const start = new Date(year, month - 1, day);
  const daysSince = differenceInCalendarDays(today, start);
  if (daysSince < 0) return 1;

  return (daysSince % ROTATION_DAYS) + 1;
}

export function getLatestDeploymentForDevice(
  deployments: Deployment[],
  deviceId: string,
): Deployment | undefined {
  return deployments.find((deployment) => deployment.deviceId === deviceId);
}

export function getDeviceRotationDay(device: Device, deployment?: Deployment | null): number {
  if (typeof device.rotationDay === 'number' && device.rotationDay >= 1) {
    return device.rotationDay;
  }
  if (deployment?.connectionStartDate) {
    return getRotationDayFromConnectionStart(deployment.connectionStartDate);
  }
  return parseDeviceCurrentDay(device);
}

export function formatScheduleInstant(
  iso: string | null | undefined,
  timeZone: string | null | undefined,
): string | null {
  if (!iso || !timeZone) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return null;
  }
}

export interface DeviceScheduleVideo {
  group: string;
  label: string;
  video: string;
}

export function getDeviceVideosForDay(
  row: RotationScheduleRow | undefined,
): DeviceScheduleVideo[] {
  if (!row) return [];

  return rotationEditableColumns
    .map((column) => ({
      group: column.group,
      label: column.label,
      video: String(row[column.key]),
    }))
    .filter((entry) => entry.video.trim().length > 0);
}
