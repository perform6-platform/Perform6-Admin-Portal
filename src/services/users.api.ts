import type { ApiResponse } from '../types/api';
import type { CreateUserPayload, User } from '../types/users';
import { apiClient } from './axios';

/** POST /users — PLATFORM_ADMIN only. */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<User>>('/users', payload);
  return data.data;
}

/** GET /users — PLATFORM_ADMIN only. */
export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<ApiResponse<User[]>>('/users');
  return data.data;
}

/** GET /users/:id */
export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
  return data.data;
}
