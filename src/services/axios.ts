import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '../types/api';
import {
  clearAuthSession,
  getAccessToken,
  getAuthSession,
  updateAuthTokens,
} from '../lib/authStorage';

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  return withProtocol.endsWith('/api/v1') ? withProtocol : `${withProtocol}/api/v1`;
}

const baseURL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
);

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }
    const request = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (!request || request._retried || request.url?.includes('/auth/')) {
      return Promise.reject(error);
    }
    const refreshToken = getAuthSession()?.refreshToken;
    if (!refreshToken) return Promise.reject(error);

    request._retried = true;
    refreshPromise ??= axios
      .post(`${baseURL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const data = response.data?.data;
        if (!data?.accessToken || !data?.refreshToken) throw new Error('Invalid refresh response');
        updateAuthTokens(data.accessToken, data.refreshToken);
        return data.accessToken as string;
      })
      .catch((refreshError) => {
        clearAuthSession();
        throw refreshError;
      })
      .finally(() => {
        refreshPromise = null;
      });

    const accessToken = await refreshPromise;
    request.headers.Authorization = `Bearer ${accessToken}`;
    return apiClient.request(request);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data as ApiErrorBody | string | undefined;

  if (data && typeof data === 'object') {
    const { message } = data;

    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }

    if (Array.isArray(message)) {
      const lines = message
        .filter((line): line is string => typeof line === 'string' && line.trim().length > 0)
        .map((line) => line.trim());
      if (lines.length > 0) {
        return lines.join('. ');
      }
    }

    const fieldMessage = data.details?.fields
      ? Object.values(data.details.fields).find((value) => value?.trim())
      : undefined;
    if (fieldMessage) return fieldMessage;

    if (data.error?.trim()) return data.error;
  }

  return error.message ?? fallback;
}
