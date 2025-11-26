import apiClient from "@/lib/apiClient";
import { UserResponse, UpdateProfileRequest, ChangePasswordRequest } from "@/types/auth";

export type UserPageableResponse = {
  content: UserResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

// Lấy thông tin profile cá nhân
const getProfile = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>("/api/users/me");
  return response.data;
};

// Cập nhật thông tin cá nhân
const updateProfile = async (data: UpdateProfileRequest): Promise<UserResponse> => {
  const response = await apiClient.patch<UserResponse>("/api/users/me", data);
  return response.data;
};

// Đổi mật khẩu
const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await apiClient.post("/api/users/change-password", data);
};

// Upload Avatar
const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await apiClient.post<string>("/api/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// [NEW] Admin: Lấy danh sách user
// Tạm thời để size lớn để support client-side pagination giống Orders
const getAllUsers = async (page = 0, size = 1000): Promise<UserPageableResponse> => {
    const response = await apiClient.get<UserPageableResponse>("/api/users", {
        params: { page, size, sort: "id,desc" }
    });
    return response.data;
}

export const userService = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getAllUsers, // Export thêm hàm này
};