import apiClient from '@/lib/apiClient';
import { 
  type Product, 
  type PageableResponse,
  type CreateProductRequest,
  type UpdateProductRequest
} from '@/types/product';

export type GetProductsParams = {
  page?: number;
  size?: number;
  sort?: string; 
  name?: string;
};

const getProducts = async (
  params: GetProductsParams = {}
): Promise<PageableResponse<Product>> => { 
  
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', String(params.page));
  if (params.size !== undefined) queryParams.append('size', String(params.size));
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.name) queryParams.append('name', params.name);

  const url = `/api/products?${queryParams.toString()}`;

  const response = await apiClient.get<PageableResponse<Product>>(url);
  
  return response.data;
};

const createProduct = async (
  data: CreateProductRequest
): Promise<Product> => {
  const response = await apiClient.post<Product>('/api/products', data);
  return response.data;
};

const updateProduct = async (
  id: number,
  data: UpdateProductRequest
): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/api/products/${id}`, data);
  return response.data;
};

const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/products/${id}`);
};

export const productService = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};