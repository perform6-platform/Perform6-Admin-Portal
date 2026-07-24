export type StartupProfileId = 'xt2145' | 'xc4055' | 'hd226';

export type StartupPackageKind = 'folder' | 'zip';

export type StartupFileInfo = {
  profile: StartupProfileId;
  label: string;
  description: string;
  available: boolean;
  fileName: string | null;
  packageKind: StartupPackageKind | null;
  sizeBytes: number | null;
  updatedAt: string | null;
  source: 'r2' | 'local';
  downloadUrl: string | null;
};

export type StartupManifestFile = {
  path: string;
  sizeBytes: number;
  url?: string;
};

export type StartupManifest = {
  profile: StartupProfileId;
  packageName: string;
  packageKind: StartupPackageKind;
  source: 'r2' | 'local';
  files: StartupManifestFile[];
};
