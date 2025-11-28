import apiClient from '@/lib/apiClient';
import { Category } from '@/types/product';

const getAllCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/api/categories');
  return response.data;
};

const createCategory = async (name: string, description?: string): Promise<Category> => {
  const response = await apiClient.post<Category>('/api/categories', { name, description });
  return response.data;
};

export const categoryService = {
  getAllCategories,
  createCategory
};