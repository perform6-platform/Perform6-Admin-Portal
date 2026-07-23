import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '../types/api';
import { getAccessToken } from '../lib/authStorage';

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
