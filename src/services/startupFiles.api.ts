import type { ApiResponse } from '../types/api';
import type { StartupFileInfo, StartupProfileId } from '../types/startupFiles';
import axios from 'axios';
import { apiClient } from './axios';

/** GET /startup-files */
export async function getStartupFiles(): Promise<StartupFileInfo[]> {
  const { data } = await apiClient.get<ApiResponse<StartupFileInfo[]>>('/startup-files');
  return data.data;
}

/** GET /startup-files/:profile/download — returns blob + suggested filename */
export async function downloadStartupFile(profile: StartupProfileId): Promise<{
  blob: Blob;
  fileName: string;
}> {
  try {
    const response = await apiClient.get<Blob>(`/startup-files/${profile}/download`, {
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const matched = disposition?.match(/filename="?([^";]+)"?/i);
    const fileName = matched?.[1]?.trim() || `perform6-${profile}.zip`;

    return { blob: response.data, fileName };
  } catch (error) {
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
}
