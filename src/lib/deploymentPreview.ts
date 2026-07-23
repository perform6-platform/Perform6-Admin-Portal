import type { DeploymentPreview, PreviewItem, PreviewSlot } from '../types/deployments';

const FALLBACK_SLOT_KEYS = ['default', 'startHere', 'phase1', 'phase2', 'fullProgram'] as const;

const FALLBACK_SLOT_LABELS: Record<string, string> = {
  default: 'Default',
  startHere: 'Start Here',
  phase1: 'Phase 1',
  phase2: 'Phase 2',
  fullProgram: 'Full Program',
};

/** Slots whose preview payload is a rotation day list (not a single video). */
const ROTATING_SLOT_KEYS = new Set([
  'phase1',
  'phase2',
  'fullProgram',
  'PHASE_1',
  'PHASE_2',
  'FULL_PROGRAM',
]);

export interface DeploymentPreviewSlotView {
  key: string;
  label: string;
  libraryType?: string;
  isRotating: boolean;
  items: PreviewItem[];
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

/** Normalize one preview item from API (supports minor field aliases). */
export function normalizePreviewItem(raw: unknown): PreviewItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  const day = asNumber(item.day ?? item.dayNumber ?? item.rotationDay, 0);
  const video = asString(item.video ?? item.title ?? item.name);
  const mediaVersionId = asString(
    item.mediaVersionId ??
      (typeof item.mediaVersion === 'object' && item.mediaVersion !== null
        ? (item.mediaVersion as { id?: string }).id
        : undefined),
  );

  if (!video && !mediaVersionId && day <= 0) return null;

  return {
    day: day > 0 ? day : 1,
    video: video || `Day ${day > 0 ? day : 1}`,
    order: asNumber(item.order, day > 0 ? day : 1),
    thumbnail: asString(item.thumbnail ?? item.thumbnailUrl),
    duration: asNumber(item.duration ?? item.durationSeconds),
    mediaVersionId,
    fileUrl: asString(item.fileUrl),
  };
}

/** Coerce slot payload into PreviewItem[] — never collapse to only the first entry. */
export function normalizePreviewItems(value: unknown): PreviewItem[] {
  if (value == null) return [];

  const rawItems = Array.isArray(value) ? value : [value];
  const items = rawItems
    .map((entry) => normalizePreviewItem(entry))
    .filter((entry): entry is PreviewItem => entry !== null);

  return items.sort((a, b) => a.day - b.day || a.order - b.order);
}

export function isRotatingPreviewSlot(key: string): boolean {
  return ROTATING_SLOT_KEYS.has(key) || ROTATING_SLOT_KEYS.has(key.toUpperCase());
}

function resolveSlotLabel(slot: PreviewSlot): string {
  return slot.label?.trim() || FALLBACK_SLOT_LABELS[slot.key] || slot.key;
}

function readSlotItems(preview: DeploymentPreview, slotKey: string): PreviewItem[] {
  const direct = preview[slotKey];
  if (direct != null) return normalizePreviewItems(direct);

  const lowerKey = slotKey.toLowerCase();
  const matchedKey = Object.keys(preview).find(
    (key) => key.toLowerCase() === lowerKey && key !== 'slots',
  );
  if (matchedKey) return normalizePreviewItems(preview[matchedKey]);

  return [];
}

/** Parse GET /deployments/preview — all assigned videos per slot (arrays for rotating libraries). */
export function parseDeploymentPreviewSlots(preview: DeploymentPreview | null | undefined): DeploymentPreviewSlotView[] {
  if (!preview) return [];

  const slots = Array.isArray(preview.slots) ? preview.slots : [];

  if (slots.length > 0) {
    return slots
      .map((slot) => ({
        key: slot.key,
        label: resolveSlotLabel(slot),
        libraryType: slot.libraryType ?? undefined,
        isRotating:
          typeof slot.isRotating === 'boolean'
            ? slot.isRotating
            : isRotatingPreviewSlot(slot.key) ||
              Boolean(slot.libraryType?.includes('PHASE')) ||
              slot.libraryType === 'FULL_PROGRAM',
        items: readSlotItems(preview, slot.key),
      }))
      .filter((slot) => slot.items.length > 0 || Boolean(slot.label));
  }

  return FALLBACK_SLOT_KEYS.map((key) => ({
    key,
    label: FALLBACK_SLOT_LABELS[key] ?? key,
    libraryType: undefined,
    isRotating: isRotatingPreviewSlot(key),
    items: readSlotItems(preview, key),
  })).filter((slot) => slot.items.length > 0);
}

export function formatPreviewDuration(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  return `${totalMinutes} min`;
}
