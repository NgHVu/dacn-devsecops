import { Order } from "./order";

export type MonthlyStats = {
  name: string;
  total: number;
};

export type DashboardStats = {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  newCustomers: number;
  monthlyRevenue: MonthlyStats[];
  recentSales: Order[]; 
};