import apiClient from '@/lib/apiClient';
import { 
  type Product, 
  type PageableResponse,
  type CreateProductRequest,
  type UpdateProductRequest,
  type GetProductsParams,
  type Review,               // [CẬP NHẬT] Import thêm
  type CreateReviewRequest   // [CẬP NHẬT] Import thêm
} from '@/types/product';

const getProducts = async (
  params: GetProductsParams = {}
): Promise<PageableResponse<Product>> => { 
  
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', String(params.page));
  if (params.size !== undefined) queryParams.append('size', String(params.size));
  if (params.sort) queryParams.append('sort', params.sort);
  
  if (params.search) queryParams.append('search', params.search);
  
  if (params.categoryId) queryParams.append('categoryId', String(params.categoryId));
  if (params.minPrice) queryParams.append('minPrice', String(params.minPrice));
  if (params.maxPrice) queryParams.append('maxPrice', String(params.maxPrice));

  const url = `/api/products?${queryParams.toString()}`;

  const response = await apiClient.get<PageableResponse<Product>>(url);
  
  return response.data;
};

const getProductById = async (id: number): Promise<Product> => {
  const response = await apiClient.get<Product>(`/api/products/${id}`);
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

const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await apiClient.post<string>("/api/products/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
  });
  
  return response.data;
};

// [CẬP NHẬT] Hàm lấy danh sách review
const getProductReviews = async (productId: number, page = 0, size = 5): Promise<PageableResponse<Review>> => {
    const response = await apiClient.get<PageableResponse<Review>>(`/api/reviews/product/${productId}?page=${page}&size=${size}`);
    return response.data;
};

// [CẬP NHẬT] Hàm tạo review
const createReview = async (data: CreateReviewRequest): Promise<Review> => {
    const response = await apiClient.post<Review>('/api/reviews', data);
    return response.data;
};

export const productService = {
  getProducts,
  getProductById, 
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getProductReviews, // Export mới
  createReview,      // Export mới
};