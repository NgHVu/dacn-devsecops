import apiClient from "@/lib/apiClient";
import { adminService } from "@/services/adminService";

// Mock apiClient để không gửi request thật lên server
jest.mock("@/lib/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("adminService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getDashboardStats: nên gọi đúng endpoint admin dashboard", async () => {
    const mockStats = {
      totalRevenue: 5000000,
      totalOrders: 150,
      newCustomers: 10,
      activeProducts: 45,
      revenueGrowth: 5.5,
      ordersGrowth: 2.1,
      monthlyRevenue: [],
      recentSales: []
    };

    mockedApiClient.get.mockResolvedValueOnce({ data: mockStats });

    const result = await adminService.getDashboardStats();

    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/orders/admin/dashboard");
    expect(result).toEqual(mockStats);
  });
});