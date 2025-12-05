export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  SHIPPING = "SHIPPING",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export type PageableResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
  empty: boolean;
};

export type CreateOrderItemRequest = {
  productId: number;
  quantity: number;
  note?: string; // Thêm note nếu cần
};

// [CẬP NHẬT] Thêm các trường cần thiết cho Checkout
export type CreateOrderRequest = {
  customerName: string;
  shippingAddress: string;
  phoneNumber: string;
  note?: string;
  paymentMethod: string; // "COD" | "VNPAY" ...
  items: CreateOrderItemRequest[];
};

export type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
  productImage?: string; // Optional nếu backend chưa trả về
};

export type Order = {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusUpdate = {
  status: OrderStatus;
};