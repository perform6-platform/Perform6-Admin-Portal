export type StartupProfileId = 'xt2145' | 'xc4055' | 'hd226';

export type StartupFileInfo = {
  profile: StartupProfileId;
  label: string;
  description: string;
  available: boolean;
  fileName: string | null;
  sizeBytes: number | null;
  updatedAt: string | null;
};
