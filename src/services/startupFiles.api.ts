import type { ApiResponse } from '../types/api';
import type {
  StartupFileInfo,
  StartupManifest,
  StartupProfileId,
} from '../types/startupFiles';
import axios from 'axios';
import { apiClient } from './axios';

async function rethrowBlobApiError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const parsed = JSON.parse(text) as { message?: string };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        throw new Error(parsed.message.trim());
      }
    } catch (inner) {
      if (inner instanceof Error && inner.message && !(inner instanceof SyntaxError)) {
        throw inner;
      }
    }
  }
  throw error;
}

/** GET /startup-files */
export async function getStartupFiles(): Promise<StartupFileInfo[]> {
  const { data } = await apiClient.get<ApiResponse<StartupFileInfo[]>>('/startup-files');
  return data.data;
}

/** GET /startup-files/:profile/manifest */
async function getStartupManifest(profile: StartupProfileId): Promise<StartupManifest> {
  const { data } = await apiClient.get<ApiResponse<StartupManifest>>(
    `/startup-files/${profile}/manifest`,
  );
  return data.data;
}

/** GET /startup-files/:profile/file?path= */
async function downloadStartupPackageFile(
  profile: StartupProfileId,
  relativePath: string,
): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>(`/startup-files/${profile}/file`, {
      params: { path: relativePath },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    return rethrowBlobApiError(error);
  }
}

async function writeBlobToDirectory(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  blob: Blob,
): Promise<void> {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Empty file path');
  }

  let dir = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    dir = await dir.getDirectoryHandle(parts[i], { create: true });
  }

  const fileHandle = await dir.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(blob);
  } finally {
    await writable.close();
  }
}

export type DownloadStartupFolderResult = {
  packageName: string;
  fileCount: number;
};

/**
 * Saves a real extracted folder (e.g. perform6-xt2145-0.1.0), not a ZIP.
 * Browser security requires choosing a parent folder once (e.g. Desktop or Downloads).
 */
export async function downloadStartupPackage(
  profile: StartupProfileId,
): Promise<DownloadStartupFolderResult> {
  if (typeof window === 'undefined' || typeof window.showDirectoryPicker !== 'function') {
    throw new Error(
      'Folder download needs Chrome or Edge. Safari/Firefox cannot save a folder without a ZIP.',
    );
  }

  const manifest = await getStartupManifest(profile);
  if (!manifest.files.length) {
    throw new Error('Package folder is empty. Rebuild with npm run release:zip for this profile.');
  }

  // User picks a parent (e.g. Downloads). We create perform6-xt2145-0.1.0 inside it.
  const parent = await window.showDirectoryPicker({ mode: 'readwrite' });
  const packageDir = await parent.getDirectoryHandle(manifest.packageName, {
    create: true,
  });

  for (const file of manifest.files) {
    const blob = await downloadStartupPackageFile(profile, file.path);
    await writeBlobToDirectory(packageDir, file.path, blob);
  }

  return {
    packageName: manifest.packageName,
    fileCount: manifest.files.length,
  };
}
