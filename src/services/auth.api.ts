import type { ApiResponse } from '../types/api';
import type { AuthUser, LoginData, LoginPayload } from '../types/auth';
import { apiClient } from './axios';

export interface LoginResult {
  data: LoginData;
  message: string;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await apiClient.post<ApiResponse<LoginData>>('/auth/login', payload);
  return { data: data.data, message: data.message };
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post<ApiResponse<{ success: boolean }>>('/auth/logout');
}

export async function getCurrentUserRequest(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}

export interface MessageResult {
  message: string;
}

export async function forgotPasswordRequest(email: string): Promise<MessageResult> {
  const { data } = await apiClient.post<ApiResponse<{ success: boolean }>>('/auth/forgot-password', { email });
  return { message: data.message };
}

export async function resetPasswordRequest(token: string, password: string): Promise<MessageResult> {
  const { data } = await apiClient.post<ApiResponse<{ success: boolean }>>('/auth/reset-password', { token, password });
  return { message: data.message };
}
