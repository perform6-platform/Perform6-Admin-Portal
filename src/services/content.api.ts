import type { ApiResponse } from '../types/api';
import type { CategoryContent, Program } from '../types/content';
import { apiClient } from './axios';

/** GET /content/category/:id — :id = FITNESS | GOLF. */
export async function getCategoryContent(categoryId: string): Promise<CategoryContent> {
  const { data } = await apiClient.get<ApiResponse<CategoryContent>>(
    `/content/category/${categoryId}`,
  );
  return data.data;
}

/** GET /content/program/:id — full program with nested sessions + media. */
export async function getProgramContent(programId: string): Promise<Program> {
  const { data } = await apiClient.get<ApiResponse<Program>>(`/content/program/${programId}`);
  return data.data;
}
