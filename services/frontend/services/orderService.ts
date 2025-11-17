import apiClient from '@/lib/apiClient';
import { 
  type CreateOrderRequest, 
  type Order,
  type PageableResponse 
} from '@/types/order';

const createOrder = async (
  orderData: CreateOrderRequest
): Promise<Order> => {
  console.log("Đang gửi yêu cầu tạo đơn hàng (client)...");
  const response = await apiClient.post<Order>('/api/orders', orderData);
  return response.data;
};

const getMyOrders = async (): Promise<PageableResponse<Order>> => {
  console.log("Đang lấy lịch sử đơn hàng (client)...");
  
  const response = await apiClient.get<PageableResponse<Order>>( 
    '/api/orders/my'
  );
  
  return response.data;
};

export const orderService = {
  createOrder,
  getMyOrders,
};