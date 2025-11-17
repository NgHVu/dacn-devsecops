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
};
export type CreateOrderRequest = {
  items: CreateOrderItemRequest[];
};

export type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
};

export type Order = {
  id: number; 
  userId: string;
  items: OrderItem[];
  totalAmount: number; 
  status: string;
  createdAt: string;
};