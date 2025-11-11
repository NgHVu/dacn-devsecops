import apiClient from "@/lib/apiClient";
import { 
  type LoginRequest, 
  type RegisterRequest, 
  type AuthResponse 
} from "@/types/auth"; // Import các kiểu dữ liệu chúng ta vừa định nghĩa

/**
 * Gọi API để đăng nhập
 */
const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    // Gọi đến endpoint /api/auth/login của users-service
    const response = await apiClient.post<AuthResponse>("/api/auth/login", data);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    // (Sau này chúng ta sẽ xử lý lỗi này tốt hơn)
    throw error;
  }
};

/**
 * Gọi API để đăng ký
 */
const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  try {
    // Gọi đến endpoint /api/auth/register của users-service
    const response = await apiClient.post<AuthResponse>("/api/auth/register", data);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    throw error;
  }
};

// Export các hàm để UI có thể sử dụng
export const authService = {
  login,
  register,
};