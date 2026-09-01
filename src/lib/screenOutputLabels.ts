export type HardwareProfileCode = 'XT2145' | 'XC4055' | 'HD226' | string;

const XT_LABELS: Record<string, string> = {
  SCREEN_1: 'Bluefin · HDMI-1',
  SCREEN_2: 'LED · HDMI-2',
};

const XC_LABELS: Record<string, string> = {
  SCREEN_1: 'LED 1 · HDMI-1',
  SCREEN_2: 'LED 2 · HDMI-2',
  SCREEN_3: 'LED 3 · HDMI-3',
};

const HD_LABELS: Record<string, string> = {
  SCREEN_1: 'LED · HDMI',
};

export function resolveScreenOutputLabel(
  screenKey: string,
  hardwareProfile?: string | null,
): string {
  const key = screenKey.toUpperCase();
  const profile = (hardwareProfile ?? '').toUpperCase();

  if (profile === 'XT2145') {
    return XT_LABELS[key] ?? screenKey.replace(/_/g, ' ');
  }
  if (profile === 'XC4055') {
    return XC_LABELS[key] ?? screenKey.replace(/_/g, ' ');
  }
  if (profile === 'HD226') {
    return HD_LABELS[key] ?? screenKey.replace(/_/g, ' ');
  }

  return screenKey.replace(/_/g, ' ');
}

export function isTouchscreenDeployment(
  deploymentType?: string | null,
  model?: string | null,
): boolean {
  if (deploymentType === 'TOUCHSCREEN_DEPLOYMENT') return true;
  return (model ?? '').toUpperCase() === 'XT2145';
}

const SLOT_LABELS: Record<string, string> = {
  'touch-default': 'Main menu',
  'start-here': 'Start Here',
  phase1: 'Phase 1',
  phase2: 'Phase 2',
  'full-program': 'Full Program',
};

export function formatTouchSlotLabel(slot?: string | null): string {
  if (!slot) return '—';
  return SLOT_LABELS[slot] ?? slot.replace(/-/g, ' ');
}

export function formatTouchPlaybackState(state?: string | null): string {
  switch (state) {
    case 'MENU':
      return 'Main menu';
    case 'MODAL':
      return 'Category overview';
    case 'PLAYING':
      return 'Session playing';
    case 'PAUSED':
      return 'Paused';
    default:
      return state?.replace(/_/g, ' ') ?? 'Unknown';
  }
}
