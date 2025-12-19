import apiClient from "@/lib/apiClient";
import { orderService } from "@/services/orderService";
import { OrderStatus } from "@/types/order";

// Mock apiClient để không gửi request thật lên server
jest.mock("@/lib/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("orderService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("createOrder: nên gọi đúng API tạo đơn hàng", async () => {
    const orderReq = { customerName: "Vũ", items: [], paymentMethod: "COD" };
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 100, ...orderReq } });

    // @ts-expect-error - Chấp nhận lỗi ép kiểu nhanh cho request data để tập trung test luồng API
    const result = await orderService.createOrder(orderReq);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/orders", orderReq);
    expect(result.id).toBe(100);
  });

  test("getMyOrders: nên truyền đúng tham số phân trang", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { content: [] } });

    await orderService.getMyOrders(1, 5);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/orders/my",
      expect.objectContaining({
        params: { page: 1, size: 5, sort: "createdAt,desc" }
      })
    );
  });

  test("getOrderById: nên truy xuất thông tin đơn lẻ", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { id: 1 } });

    await orderService.getOrderById(1);

    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/orders/1");
  });

  test("getAllOrders: Admin nên lấy được toàn bộ đơn hàng", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { content: [] } });

    await orderService.getAllOrders(0, 20);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        params: { page: 0, size: 20, sort: "createdAt,desc" }
      })
    );
  });

  test("updateOrderStatus: nên sử dụng method PATCH để cập nhật trạng thái", async () => {
    mockedApiClient.patch.mockResolvedValueOnce({ data: { id: 1, status: "DELIVERED" } });

    // Ép kiểu chuỗi về OrderStatus để thỏa mãn TypeScript
    await orderService.updateOrderStatus(1, "DELIVERED" as OrderStatus);

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/api/orders/1/status",
      { status: "DELIVERED" }
    );
  });
});