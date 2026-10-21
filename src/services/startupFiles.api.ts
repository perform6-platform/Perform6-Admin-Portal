import type { ApiResponse } from '../types/api';
import type { StartupFileInfo, StartupProfileId } from '../types/startupFiles';
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

export type DownloadStartupFolderResult = {
  packageName: string;
  fileCount: number;
  source: 'r2' | 'local';
};

function fileNameFromDisposition(disposition: unknown, fallback: string): string {
  if (typeof disposition !== 'string') return fallback;
  const match = disposition.match(/filename="([^"]+)"/i);
  return match?.[1]?.trim() || fallback;
}

/**
 * Downloads the startup package ZIP. A normal file download does not ask Chrome
 * for permission to edit a folder.
 */
export async function downloadStartupPackage(
  profile: StartupProfileId,
): Promise<DownloadStartupFolderResult> {
  try {
    const response = await apiClient.get<Blob>(`/startup-files/${profile}/download`, {
      responseType: 'blob',
    });
    const fileName = fileNameFromDisposition(
      response.headers['content-disposition'],
      `perform6-${profile}.zip`,
    );
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return {
      packageName: fileName.replace(/\.zip$/i, ''),
      fileCount: 0,
      source: 'r2',
    };
  } catch (error) {
    return rethrowBlobApiError(error);
  }
}
