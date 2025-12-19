import apiClient from "@/lib/apiClient";
import { productService } from "@/services/productService";

jest.mock("@/lib/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("productService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. Retrieval ---
  test("getProducts: nên build URL query params chính xác", async () => {
    const params = { search: "pizza", categoryId: 5, minPrice: 100 };
    mockedApiClient.get.mockResolvedValueOnce({ data: { content: [] } });

    await productService.getProducts(params);

    const calledUrl = mockedApiClient.get.mock.calls[0][0];
    expect(calledUrl).toContain("search=pizza");
    expect(calledUrl).toContain("categoryId=5");
    expect(calledUrl).toContain("minPrice=100");
  });

  test("getProductById: nên gọi đúng ID sản phẩm", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { id: 1, name: "Sản phẩm 1" } });
    const result = await productService.getProductById(1);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/products/1");
    expect(result.name).toBe("Sản phẩm 1");
  });

  // --- 2. Product Management (Vá dòng 50-57) ---
  test("createProduct: nên gửi request POST với dữ liệu sản phẩm", async () => {
    const newProduct = { name: "Pizza", price: 100, categoryId: 1, description: "Ngon", stockQuantity: 10, image: "" };
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 99, ...newProduct } });

    const result = await productService.createProduct(newProduct);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/products', newProduct);
    expect(result.id).toBe(99);
  });

  test("updateProduct: nên sử dụng method PATCH", async () => {
    const updateData = { price: 150 };
    mockedApiClient.patch.mockResolvedValueOnce({ data: { id: 1, price: 150 } });

    await productService.updateProduct(1, updateData);

    expect(mockedApiClient.patch).toHaveBeenCalledWith("/api/products/1", updateData);
  });

  test("deleteProduct: nên gọi đúng API delete", async () => {
    mockedApiClient.delete.mockResolvedValueOnce({});
    await productService.deleteProduct(1);
    expect(mockedApiClient.delete).toHaveBeenCalledWith("/api/products/1");
  });

  // --- 3. Reviews System (Vá dòng 72-92) ---
  test("getProductReviews: nên gọi đúng endpoint review với phân trang", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { content: [] } });

    await productService.getProductReviews(1, 0, 5);

    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/reviews/product/1?page=0&size=5");
  });

  test("createReview: nên gửi request POST review", async () => {
    const reviewData = { productId: 1, orderId: 10, rating: 5, comment: "Tuyệt" };
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 50, ...reviewData } });

    await productService.createReview(reviewData);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/reviews', reviewData);
  });

  test("updateReview: nên sử dụng method PUT", async () => {
    const reviewData = { productId: 1, orderId: 10, rating: 4, comment: "Sửa" };
    mockedApiClient.put.mockResolvedValueOnce({ data: { id: 50, ...reviewData } });

    await productService.updateReview(50, reviewData);

    expect(mockedApiClient.put).toHaveBeenCalledWith("/api/reviews/50", reviewData);
  });

  test("deleteReview: nên gọi đúng API xóa review", async () => {
    mockedApiClient.delete.mockResolvedValueOnce({});
    await productService.deleteReview(50);
    expect(mockedApiClient.delete).toHaveBeenCalledWith("/api/reviews/50");
  });

  test("uploadImage: nên sử dụng FormData và đúng Header", async () => {
    const file = new File([""], "test.png", { type: "image/png" });
    mockedApiClient.post.mockResolvedValueOnce({ data: "/url-anh.png" });

    await productService.uploadImage(file);

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/products/upload",
      expect.any(FormData),
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" }
      })
    );
  });
});