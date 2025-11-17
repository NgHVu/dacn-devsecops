import apiClient from '@/lib/apiClient';
import { type Product, type PageableResponse } from '@/types/product';

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

  const response = await apiClient.get<PageableResponse<Product>>(
    url,
    {
      headers: {
        'X-Skip-Auth': 'true',
      },
    }
  );
  
  return response.data;
};

export const productService = {
  getProducts,
};