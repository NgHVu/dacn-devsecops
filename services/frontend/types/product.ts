import * as z from 'zod';

export type Category = {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  productCount?: number; 
};

export type GetProductsParams = {
  page?: number;
  size?: number;
  sort?: string; 
  search?: string;
  categoryId?: number | string;
  minPrice?: number;
  maxPrice?: number;
};

// [CẬP NHẬT] Thêm type cho Review
export type Review = {
  id: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stockQuantity: number;
  
  category?: Category; 

  // [CẬP NHẬT] Thêm các trường thống kê mới
  averageRating?: number;
  reviewCount?: number;
  sold?: number;

  createdAt: string;
  updatedAt: string;
};

export type PageableResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number; 
  size: number;
  number: number;
  last?: boolean;   
  first?: boolean;
  empty?: boolean;
};

export const productSchema = z.object({
  name: z.string().min(3, { message: "Tên phải có ít nhất 3 ký tự." }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, { message: "Giá không thể âm." }),
  stockQuantity: z.coerce.number()
    .int({ message: "Số lượng phải là số nguyên." })
    .min(0, { message: "Số lượng không thể âm." }),
  categoryId: z.coerce.number()
    .min(1, { message: "Vui lòng chọn danh mục." }),
  image: z.string().trim().url({ message: "Phải là một đường dẫn URL hợp lệ." })
            .or(z.literal("")).optional(), 
});

export type ProductFormData = z.infer<typeof productSchema>;

export type CreateProductRequest = {
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  image: string | null;
  categoryId: number; 
};

export type UpdateProductRequest = Partial<CreateProductRequest>;

// [CẬP NHẬT] Type cho request tạo review
export type CreateReviewRequest = {
    productId: number;
    orderId: number;
    rating: number;
    comment: string;
    userName?: string;
};