import type { IdSelectOption, SelectOption } from './api';
import type { HardwareProfileCode } from './devices';

// ---------------------------------------------------------------------------
// Wizard metadata
// ---------------------------------------------------------------------------

export type DeploymentTypeOption = SelectOption;
export type CategoryOption = IdSelectOption;
export type VariantOption = IdSelectOption;

export type BrandingMode = 'NONE' | 'PLATFORM_DEFAULT' | 'CUSTOM';

export type RotationMode = 'DEVICE' | 'GLOBAL';

export interface PreviewSlot {
  key: string;
  label: string;
  libraryType?: string | null;
  categoryId?: string | null;
  isRotating?: boolean;
}

export interface PreviewItem {
  day: number;
  video: string;
  order: number;
  thumbnail: string;
  duration: number;
  mediaVersionId: string;
  fileUrl: string;
}

/** Wizard preview slot — rotating libraries (phase1, phase2, fullProgram) are PreviewItem[]. */
export interface DeploymentPreviewSlotData {
  key: string;
  label: string;
  libraryType?: string;
  items: PreviewItem[];
}

/** GET /deployments/preview — wizard shows all assigned rotation videos per slot. */
export interface DeploymentPreview {
  deploymentType: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  rotationStartDate: string | null;
  rotationDay: number | null;
  slots: PreviewSlot[];
  default?: PreviewItem | PreviewItem[];
  startHere?: PreviewItem | PreviewItem[];
  phase1?: PreviewItem[];
  phase2?: PreviewItem[];
  fullProgram?: PreviewItem[];
  [slotKey: string]: unknown;
}

export interface DeploymentPreviewQuery {
  deploymentType: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  rotationMode?: RotationMode;
  rotationStartDate?: string;
  rotationMode?: RotationMode;
  /** Optional single-day filter — omit in wizard to load the full rotation list. */
  day?: number;
  /** DEFAULT_DEPLOYMENT: selected parent categories per screen. */
  screenCategories?: Array<{
    screenKey: string;
    categoryId: string;
    playlistKey?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Register — XC4055 / XT2145 / HD226
// ---------------------------------------------------------------------------

export interface Hd226ClusterMember {
  memberKey: 'DEVICE_A' | 'DEVICE_B' | 'DEVICE_C' | string;
  pairingId: string;
  deviceName?: string;
}

/** Gym/site owner contact stored on the device for scheduled offline prefetch emails. */
export interface DeviceSiteContact {
  ownerName: string;
  ownerEmail: string;
  siteAddress?: string;
  ownerPhone?: string;
}

/** Single-player register (XC4055 / XT2145). */
export interface RegisterSinglePayload {
  pairingId: string;
  deploymentType: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  rotationMode?: RotationMode;
  rotationStartDate?: string;
  deviceName?: string;
  hardwareProfile?: HardwareProfileCode;
  brandingMode: BrandingMode;
  brandingId?: string;
  /** DEFAULT_DEPLOYMENT: per-screen content category + optional named program. */
  screenCategories?: Array<{
    screenKey: string;
    categoryId: string;
    playlistKey?: string;
  }>;
  /** Gym/site owner — used for offline prefetch emails (stored on device). */
  siteContact?: DeviceSiteContact;
}

/** HD226 1–N player cluster register. */
export interface RegisterClusterPayload {
  hardwareProfile: 'HD226';
  members: Hd226ClusterMember[];
  deploymentType: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  rotationMode?: RotationMode;
  rotationStartDate?: string;
  brandingMode: BrandingMode;
  brandingId?: string;
  screenCategories?: Array<{
    screenKey: string;
    categoryId: string;
    playlistKey?: string;
  }>;
  /** Applied to every cluster member device. */
  siteContact?: DeviceSiteContact;
}

export type RegisterDeploymentPayload = RegisterSinglePayload | RegisterClusterPayload;

export interface RegisterDeploymentResult {
  deviceId?: string;
  deviceIds?: string[];
  apiToken?: string;
  apiTokens?: Record<string, string>;
  deploymentId: string;
  pairingId?: string;
  screenCount?: number;
  deploymentType: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  rotationMode?: RotationMode;
  rotationStartDate: string | null;
  playbackManifest?: PlaybackManifest;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Playback manifest
// ---------------------------------------------------------------------------

export interface ManifestContentItem {
  day: number;
  order: number;
  video: string;
  mediaVersionId: string;
  mediaAssetId: string;
  thumbnail: string;
  durationSeconds: number;
  checksum: string;
  fileUrl: string;
  title: string;
  description: string | null;
}

export interface ManifestSlot {
  slot: string;
  label: string;
  libraryType: string;
  programId: string;
  isRotating: boolean;
  items: ManifestContentItem[];
  metadata: {
    title: string;
    description: string | null;
    duration: number;
    thumbnail: string;
  };
}

export interface PlaybackManifest {
  deviceId: string;
  deploymentType: string;
  field: string;
  variant: string;
  rotationStartDate: string | null;
  rotationDay: number | null;
  branding: {
    brandName: string;
    logoUrl: string;
  } | null;
  runtimeUi: {
    touchMode: 'CONTROLLER' | null;
    displayMode: 'PLAYBACK' | 'PRESENTATION';
    supportsControls: boolean;
    uiMode: 'CONTROLLER' | 'PLAYBACK';
  };
  content: Record<string, ManifestSlot>;
  resolutionSource: string;
  hardwareProfileCode: string;
  screens: unknown[];
  targets: Record<string, unknown>;
  bindings: unknown[];
}

// ---------------------------------------------------------------------------
// Hardware abstraction
// ---------------------------------------------------------------------------

export interface HardwareProfile {
  id: string;
  code: HardwareProfileCode;
  name: string;
  outputCount: number;
  supportsTouch: boolean;
  isCluster: boolean;
}

export interface ScreenAssignment {
  id?: string;
  screenKey: string;
  contentSlot: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  playlistKey?: string | null;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  category?: { id: string; name: string; slug?: string } | null;
}

export interface CreateScreenAssignmentPayload {
  screenKey: string;
  contentSlot?: string;
  categoryId?: string;
  sortOrder: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateScreenAssignmentPayload {
  contentSlot?: string;
  categoryId?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface HardwareBindingPayload {
  hardwareProfileCode: string;
  bindings: Array<{
    screenAssignmentId: string;
    targetType: string;
    targetKey: string;
  }>;
}

export interface RuntimeManifestQuery {
  deviceId?: string;
  displayTarget?: string;
  clusterMember?: string;
  rotationStartDate?: string;
}

export interface RuntimeManifestResult {
  deploymentId: string;
  deviceId: string;
  resolutionMode: 'logical' | 'legacy';
  manifest: unknown;
}

export interface DeploymentScreenSummary {
  id?: string;
  screenKey: string;
  contentSlot?: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug?: string | null;
  playlistKey?: string | null;
  sortOrder?: number;
}

export interface DeploymentEntity {
  id: string;
  name?: string;
  description?: string | null;
  deploymentType: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  rotationStartDate?: string | null;
  config?: Record<string, unknown>;
  devices?: Array<{
    id: string;
    rotationMode?: RotationMode;
    rotationStartDate?: string | null;
    effectiveRotationStartDate?: string | null;
    [key: string]: unknown;
  }>;
  branding?: Array<{
    id: string;
    brandName?: string | null;
    logoUrl?: string | null;
    [key: string]: unknown;
  }>;
  screenAssignments?: ScreenAssignment[];
  /** Enriched by GET /deployments/:id */
  screens?: DeploymentScreenSummary[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ListDeploymentsQuery {
  page?: number;
  limit?: number;
  deploymentType?: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  search?: string;
}

export interface DeploymentListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DeploymentListResult {
  items: DeploymentEntity[];
  meta: DeploymentListMeta;
}

export interface UpdateDeploymentPayload {
  name?: string;
  description?: string;
  fieldCategory?: string | null;
  exerciseVariant?: string | null;
  brandingMode?: BrandingMode;
  brandingId?: string;
  screenCategories?: Array<{
    screenKey: string;
    categoryId: string;
    playlistKey?: string;
  }>;
}

// ---------------------------------------------------------------------------
// GET /deployments/:id/schedule-table
// ---------------------------------------------------------------------------

export interface DeploymentScheduleTableQuery {
  rotationStartDate: string;
  days?: number;
  fromDate?: string;
  /** HD226: scope columns to this device’s bound screen only */
  deviceId?: string;
  clusterMember?: string;
}

export interface DeploymentScheduleTableColumn {
  key: string;
  label: string;
  group?: string | null;
  libraryType?: string | null;
  categoryId?: string | null;
  isRotating?: boolean;
  /** Wall / No Wall / Fitness / Golf — shown under Phase 1 headers and in cells. */
  variantLabel?: string | null;
}

export interface DeploymentScheduleTableCell {
  title?: string | null;
  thumbnail?: string | null;
  assigned?: boolean;
  mediaVersionId?: string | null;
}

export interface DeploymentScheduleTableRow {
  day: number;
  dayLabel: string;
  dateLabel: string;
  rotationDay: number;
  cells: Record<string, DeploymentScheduleTableCell | null | undefined>;
}

export interface DeploymentScheduleTable {
  deploymentId: string;
  deploymentType: string;
  fieldCategory?: string;
  exerciseVariant?: string;
  rotationStartDate: string;
  days: number;
  columns: DeploymentScheduleTableColumn[];
  rows: DeploymentScheduleTableRow[];
}
