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

// [UPDATED] Thêm size vào request gửi đi
export type CreateOrderItemRequest = {
  productId: number;
  quantity: number;
  size?: string; // <-- Bổ sung field này
  note?: string;
};

export type CreateOrderRequest = {
  customerName: string;
  shippingAddress: string;
  phoneNumber: string;
  note?: string;
  paymentMethod: string;
  items: CreateOrderItemRequest[];
};

// [UPDATED] Thêm size vào response nhận về để hiển thị
export type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
  productImage?: string;
  size?: string; // <-- Bổ sung field này
  note?: string;
};

export type Order = {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus | string;
  createdAt: string;
  updatedAt: string;

  customerName: string;
  shippingAddress: string;
  phoneNumber: string;
  note?: string;
  paymentMethod: string;
  paymentStatus?: string;
};

export type OrderStatusUpdate = {
  status: OrderStatus;
};