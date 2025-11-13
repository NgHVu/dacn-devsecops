import apiClient from "@/lib/apiClient";
import { 
  type LoginRequest, 
  type RegisterRequest, 
  type AuthResponse,
  type VerifyRequest 
} from "@/types/auth"; 

// Gọi API để đăng nhập.
const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/api/auth/login", data);
  return response.data;
};

// Gọi API để đăng ký (gửi OTP).
const register = async (data: RegisterRequest): Promise<string> => {
  const response = await apiClient.post<string>("/api/auth/register", data);
  return response.data;
};


// Gọi API để xác thực OTP.
const verifyAccount = async (data: VerifyRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/api/auth/verify", data);
  return response.data;
};

// Gửi lại lại mã
const resendOtp = async (email: string): Promise<string> => {
  const response = await apiClient.post<string>("/api/auth/resend-otp", { email });
  return response.data; 
}

// Export các hàm để UI có thể sử dụng
export const authService = {
  login,
  register,
  verifyAccount,
  resendOtp,
};