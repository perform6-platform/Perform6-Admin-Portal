import type { ApiResponse } from '../types/api';
import type { Program } from '../types/content';
import { apiClient } from './axios';

/** GET /programs — no sessions by default. */
export async function getPrograms(): Promise<Program[]> {
  const { data } = await apiClient.get<ApiResponse<Program[]>>('/programs');
  return data.data;
}

/** GET /programs/:id — with sessions + sessionMedia + mediaVersion. */
export async function getProgram(id: string): Promise<Program> {
  const { data } = await apiClient.get<ApiResponse<Program>>(`/programs/${id}`);
  return data.data;
}
