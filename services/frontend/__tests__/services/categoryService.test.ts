import apiClient from "@/lib/apiClient";
import { categoryService } from "@/services/categoryService";

jest.mock("@/lib/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("categoryService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllCategories: nên lấy danh sách danh mục thành công", async () => {
    const mockCategories = [{ id: 1, name: "Pizza" }, { id: 2, name: "Burger" }];
    mockedApiClient.get.mockResolvedValueOnce({ data: mockCategories });

    const result = await categoryService.getAllCategories();

    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/categories");
    expect(result).toEqual(mockCategories);
  });

  test("createCategory: nên gửi request POST với dữ liệu chính xác", async () => {
    const newCat = { name: "Món Mới", description: "Mô tả", icon: "icon-url" };
    mockedApiClient.post.mockResolvedValueOnce({ data: { id: 3, ...newCat } });

    const result = await categoryService.createCategory(newCat);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/categories", newCat);
    expect(result.id).toBe(3);
  });

  test("updateCategory: nên sử dụng method PUT để cập nhật", async () => {
    const updatedCat = { name: "Tên Đã Sửa" };
    mockedApiClient.put.mockResolvedValueOnce({ data: { id: 1, ...updatedCat } });

    await categoryService.updateCategory(1, updatedCat);

    expect(mockedApiClient.put).toHaveBeenCalledWith("/api/categories/1", updatedCat);
  });

  test("deleteCategory: nên gọi đúng ID cần xóa", async () => {
    mockedApiClient.delete.mockResolvedValueOnce({});

    await categoryService.deleteCategory(99);

    expect(mockedApiClient.delete).toHaveBeenCalledWith("/api/categories/99");
  });
});