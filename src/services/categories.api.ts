import type { ApiResponse } from '../types/api';
import type {
  ContentCategory,
  ContentCategoryDetail,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types/categories';
import { apiClient } from './axios';

/** GET /categories */
export async function getCategories(): Promise<ContentCategory[]> {
  const { data } = await apiClient.get<ApiResponse<ContentCategory[]>>('/categories');
  return data.data;
}

/** GET /categories/:id */
export async function getCategory(id: string): Promise<ContentCategoryDetail> {
  const { data } = await apiClient.get<ApiResponse<ContentCategoryDetail>>(
    `/categories/${id}`,
  );
  return data.data;
}

/** POST /categories */
export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<ContentCategory> {
  const { data } = await apiClient.post<ApiResponse<ContentCategory>>(
    '/categories',
    payload,
  );
  return data.data;
}

/** PATCH /categories/:id */
export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ContentCategory> {
  const { data } = await apiClient.patch<ApiResponse<ContentCategory>>(
    `/categories/${id}`,
    payload,
  );
  return data.data;
}

/** DELETE /categories/:id */
export async function deleteCategory(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data } = await apiClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
    `/categories/${id}`,
  );
  return data.data;
}
