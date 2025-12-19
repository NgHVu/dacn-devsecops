import apiClient from "@/lib/apiClient";
import { userService } from "@/services/userService";

// Mock apiClient để không gọi API thật
jest.mock("@/lib/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("userService", () => {
  const mockUser = { id: 1, name: "Test User", email: "me@test.com" };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. Profile Retrieval & Update ---
  test("getProfile: nên lấy thông tin cá nhân", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: mockUser });

    const result = await userService.getProfile();

    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/users/me");
    expect(result).toEqual(mockUser);
  });

  test("updateProfile: nên dùng method PATCH", async () => {
    const updateData = { name: "New Name" };
    mockedApiClient.patch.mockResolvedValueOnce({ data: { ...mockUser, ...updateData } });

    const result = await userService.updateProfile(updateData);

    expect(mockedApiClient.patch).toHaveBeenCalledWith("/api/users/me", updateData);
    expect(result.name).toBe("New Name");
  });

  // --- 2. Password & Security (Vá dòng 23-24) ---
  test("changePassword: nên gửi request POST đổi mật khẩu", async () => {
    const passData = { oldPassword: "123", newPassword: "456", confirmPassword: "456" };
    mockedApiClient.post.mockResolvedValueOnce({});

    await userService.changePassword(passData);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/users/change-password", passData);
  });

  // --- 3. Avatar Upload (Vá dòng 27-34) ---
  test("uploadAvatar: nên sử dụng FormData và multipart header", async () => {
    const file = new File([""], "avatar.png", { type: "image/png" });
    mockedApiClient.post.mockResolvedValueOnce({ data: "/uploads/new-avatar.png" });

    const result = await userService.uploadAvatar(file);

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/users/avatar",
      expect.any(FormData),
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" }
      })
    );
    expect(result).toBe("/uploads/new-avatar.png");
  });

  // --- 4. Admin Operations (Vá dòng 37-41) ---
  test("getAllUsers: nên truyền tham số phân trang chính xác", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { content: [mockUser] } });

    await userService.getAllUsers(2, 50);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        params: { page: 2, size: 50, sort: "id,desc" }
      })
    );
  });

  test("lockUser: nên truyền đúng param locked", async () => {
    mockedApiClient.patch.mockResolvedValueOnce({});

    await userService.lockUser(10, true);

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/api/users/10/lock",
      null,
      expect.objectContaining({
        params: { locked: true }
      })
    );
  });
});