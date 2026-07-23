import type { ContentCategoryId, PlaybackCategoryId } from './contentPlayback';
import type { DeploymentBrandingMode } from './branding';
import type { DeploymentMode } from '../lib/deploymentHelpers';

export type DeploymentStatus = 'completed' | 'failed' | 'scheduled' | 'in-progress';

export type DeploymentTab = 'all' | 'scheduled';

export interface DeploymentScheduleEntry {
  day: number;
  videoTitle: string;
  categoryId: ContentCategoryId;
}

export interface DeploymentSubmitPayload {
  name: string;
  targetDevices: string;
  contentSchedule: string;
  status: DeploymentStatus;
  startedAt: string;
  completedAt: string;
  categoryId: ContentCategoryId;
  playbackCategory: PlaybackCategoryId;
  usesRotation: boolean;
  isBundleDeployment: boolean;
  deploymentMode: DeploymentMode;
  videoTitle: string;
  scheduleEntries: DeploymentScheduleEntry[];
  rotationDay: number;
  deviceId?: string;
  deviceName?: string;
  connectionStartDate?: string;
  brandingMode?: DeploymentBrandingMode;
  brandingLogoUrl?: string | null;
  companyName?: string;
}

export interface Deployment {
  id: string;
  name: string;
  targetDevices: string;
  contentSchedule: string;
  status: DeploymentStatus;
  startedAt: string;
  completedAt: string;
  categoryId?: ContentCategoryId;
  deploymentMode?: DeploymentMode;
  isBundleDeployment?: boolean;
  usesRotation?: boolean;
  rotationDay?: number;
  scheduleEntries?: DeploymentScheduleEntry[];
  deviceId?: string;
  deviceName?: string;
  connectionStartDate?: string;
  brandingMode?: DeploymentBrandingMode;
  brandingLogoUrl?: string | null;
  companyName?: string;
}

export const deploymentTabs: { value: DeploymentTab; label: string }[] = [
  { value: 'all', label: 'All Deployments' },
  { value: 'scheduled', label: 'Scheduled Deployments' },
];

export function getDeploymentStatusLabel(status: DeploymentStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'scheduled':
      return 'Scheduled';
    case 'in-progress':
      return 'In Progress';
    default:
      return status;
  }
}

export function getDeploymentStatusVariant(
  status: DeploymentStatus,
): 'success' | 'danger' | 'warning' | 'brand' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'scheduled':
      return 'brand';
    case 'in-progress':
      return 'warning';
    default:
      return 'neutral';
  }
}
