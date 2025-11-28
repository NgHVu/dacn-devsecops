import apiClient from "@/lib/apiClient";
import { DashboardStats } from "@/types/dashboard";

const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>("/api/orders/admin/dashboard");
  return response.data;
};

export const adminService = {
  getDashboardStats,
};