export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  devices: {
    inventory: (query: unknown) => ['devices', 'inventory', query] as const,
    fleet: ['devices', 'fleet'] as const,
    detail: (id: string) => ['devices', id] as const,
    pairingsPending: ['devices', 'pairings', 'pending'] as const,
    pairingsClaimed: ['devices', 'pairings', 'claimed'] as const,
    pairingsHistory: ['devices', 'pairings', 'history'] as const,
    pairing: (id: string) => ['devices', 'pairings', id] as const,
    pairingByCode: (code: string, strict: boolean) =>
      ['devices', 'pairing', code, strict] as const,
  },
  deployments: {
    all: ['deployments'] as const,
    list: (query: unknown) => ['deployments', 'list', query] as const,
    types: ['deployments', 'types'] as const,
    categories: ['deployments', 'categories'] as const,
    variants: (categoryId: string) => ['deployments', 'categories', categoryId, 'variants'] as const,
    preview: (query: unknown) => ['deployments', 'preview', query] as const,
    detail: (id: string) => ['deployments', id] as const,
    branding: (id: string) => ['deployments', id, 'branding'] as const,
    hardwareProfiles: ['deployments', 'hardware-profiles'] as const,
    screenAssignments: (id: string) => ['deployments', id, 'screen-assignments'] as const,
    runtimeManifest: (id: string, query: unknown) =>
      ['deployments', id, 'runtime-manifest', query] as const,
    scheduleTable: (id: string, query: unknown) =>
      ['deployments', id, 'schedule-table', query] as const,
  },
  branding: {
    platformDefault: ['branding', 'platform-default'] as const,
    detail: (id: string) => ['branding', id] as const,
  },
  content: {
    category: (id: string) => ['content', 'category', id] as const,
    program: (id: string) => ['content', 'program', id] as const,
  },
  media: {
    all: ['media'] as const,
    list: (query: unknown) => ['media', 'list', query] as const,
    librarySummary: ['media', 'library-summary'] as const,
    detail: (id: string) => ['media', id] as const,
  },
  programs: {
    all: ['programs'] as const,
    detail: (id: string) => ['programs', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    detail: (id: string) => ['categories', id] as const,
  },
  rotation: {
    all: ['rotation'] as const,
    current: ['rotation', 'current'] as const,
    device: (deviceId: string) => ['rotation', 'devices', deviceId] as const,
    deviceCurrent: (deviceId: string) => ['rotation', 'devices', deviceId, 'current'] as const,
    devicePlayback: (deviceId: string) => ['rotation', 'devices', deviceId, 'playback'] as const,
    day: (day: number) => ['rotation', 'day', day] as const,
    category: (category: string) => ['rotation', category] as const,
    categoryDay: (category: string, day: number) => ['rotation', category, 'day', day] as const,
  },
  monitoring: {
    fleetStatus: ['monitoring', 'fleet', 'status'] as const,
    fleetHealth: ['monitoring', 'fleet', 'health'] as const,
    livePlayback: (deviceId: string) => ['monitoring', 'live-playback', deviceId] as const,
    analytics: (query: unknown) => ['monitoring', 'analytics', query] as const,
  },
  sync: {
    fleet: ['sync', 'fleet'] as const,
    deviceDetail: (id: string) => ['sync', 'devices', id] as const,
  },
  releases: {
    all: ['releases'] as const,
  },
  startupFiles: {
    all: ['startup-files'] as const,
  },
} as const;
