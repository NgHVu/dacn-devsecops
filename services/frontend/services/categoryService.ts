import apiClient from '@/lib/apiClient';
import { Category } from '@/types/product';

const getAllCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/api/categories');
  return response.data;
};

const createCategory = async (data: { name: string; description?: string; icon?: string }): Promise<Category> => {
  const response = await apiClient.post<Category>('/api/categories', data);
  return response.data;
};

const updateCategory = async (id: number, data: { name: string; description?: string; icon?: string }): Promise<Category> => {
  const response = await apiClient.put<Category>(`/api/categories/${id}`, data);
  return response.data;
};

const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/categories/${id}`);
};

export const categoryService = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory 
};