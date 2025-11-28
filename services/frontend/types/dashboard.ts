import { Order } from "./order";

export type MonthlyStats = {
  name: string;
  total: number;
};

// Định nghĩa kiểu dữ liệu cho đơn hàng trong Dashboard (có thêm thông tin user để hiển thị)
export type DashboardRecentSale = {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  // Mở rộng thêm thông tin user để hiển thị trên Dashboard
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  amount: number; // Mapping từ totalAmount nếu cần, hoặc dùng totalAmount
};

export type DashboardStats = {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number; // Thêm trường này nếu Dashboard cần dùng
  newCustomers: number;
  activeProducts: number; // Thêm trường để sửa lỗi activeProducts missing
  monthlyRevenue: MonthlyStats[];
  recentSales: DashboardRecentSale[]; // Dùng kiểu riêng thay vì Order gốc để có trường user
};