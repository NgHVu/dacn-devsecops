import apiClient from "@/lib/apiClient";
import { UserResponse, UpdateProfileRequest, ChangePasswordRequest } from "@/types/auth";

export type UserPageableResponse = {
  content: UserResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

const getProfile = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>("/api/users/me");
  return response.data;
};

const updateProfile = async (data: UpdateProfileRequest): Promise<UserResponse> => {
  const response = await apiClient.patch<UserResponse>("/api/users/me", data);
  return response.data;
};

const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await apiClient.post("/api/users/change-password", data);
};

const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await apiClient.post<string>("/api/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const getAllUsers = async (page = 0, size = 1000): Promise<UserPageableResponse> => {
    const response = await apiClient.get<UserPageableResponse>("/api/users", {
        params: { page, size, sort: "id,desc" }
    });
    return response.data;
}

const lockUser = async (id: number, locked: boolean): Promise<void> => {
  await apiClient.patch(`/api/users/${id}/lock`, null, {
    params: { locked } 
  });
};

export const userService = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getAllUsers,
  lockUser, 
};