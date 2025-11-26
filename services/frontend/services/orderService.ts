import apiClient from '@/lib/apiClient';
import { 
  type CreateOrderRequest, 
  type Order,
  type PageableResponse,
  type OrderStatus
} from '@/types/order';

const createOrder = async (
  orderData: CreateOrderRequest
): Promise<Order> => {
  const response = await apiClient.post<Order>('/api/orders', orderData);
  return response.data;
};

const getMyOrders = async (
  page = 0, 
  size = 10
): Promise<PageableResponse<Order>> => {
  const response = await apiClient.get<PageableResponse<Order>>( 
    '/api/orders/my',
    {
      params: { page, size, sort: "createdAt,desc" }
    }
  );
  return response.data;
};

const getOrderById = async (id: number): Promise<Order> => {
  const response = await apiClient.get<Order>(`/api/orders/${id}`);
  return response.data;
};

// API cho Admin
const getAllOrders = async (
  page = 0, 
  size = 20
): Promise<PageableResponse<Order>> => {
  const response = await apiClient.get<PageableResponse<Order>>("/api/orders", {
    params: { page, size, sort: "createdAt,desc" },
  });
  return response.data;
};

const updateOrderStatus = async (
  id: number, 
  status: OrderStatus
): Promise<Order> => {
  const response = await apiClient.patch<Order>(`/api/orders/${id}/status`, {
    status: status, 
  });
  return response.data;
};

export const orderService = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};