import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '../types/api';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import { getAuthSession } from '../lib/authStorage';
import { forceLogout } from '../lib/authSession';
import {
  ensureFreshAccessToken,
  isAuthPublicPath,
  refreshAccessToken,
} from './sessionRefresh';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (isAuthPublicPath(config.url)) {
    return config;
  }

  const token = await ensureFreshAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }
    const request = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    if (!request || request._retried || isAuthPublicPath(request.url)) {
      return Promise.reject(error);
    }

    if (!getAuthSession()?.refreshToken) {
      forceLogout('missing-refresh-token');
      return Promise.reject(error);
    }

    request._retried = true;

    try {
      const accessToken = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient.request(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
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
