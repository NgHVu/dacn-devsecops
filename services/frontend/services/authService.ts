import apiClient from "@/lib/apiClient";
import { 
  type LoginRequest, 
  type RegisterRequest, 
  type AuthResponse,
  type VerifyRequest 
} from "@/types/auth"; 

/**
 * Gọi API để đăng nhập.
 * Không cần try...catch, vì apiClient interceptor sẽ tự động log lỗi.
 */
const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/api/auth/login", data);
  return response.data;
};

/**
 * Gọi API để đăng ký (gửi OTP).
 * Trả về message từ server (ví dụ: "Đã gửi OTP...").
 */
const register = async (data: RegisterRequest): Promise<string> => {
  const response = await apiClient.post<string>("/api/auth/register", data);
  return response.data;
};

/**
 * Gọi API để xác thực OTP.
 * Trả về AuthResponse (token).
 */
const verifyAccount = async (data: VerifyRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/api/auth/verify", data);
  return response.data;
};

// Export các hàm để UI có thể sử dụng
export const authService = {
  login,
  register,
  verifyAccount,
};