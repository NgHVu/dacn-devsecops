import apiClient from "@/lib/apiClient";
import { 
  type LoginRequest, 
  type RegisterRequest, 
  type AuthResponse,
  type VerifyRequest,
  type GoogleAuthRequest,
  type ForgotPasswordRequest, 
  type ResetPasswordRequest   
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

// Gửi authorization_code lên backend để đổi lấy JWT token
const loginWithGoogle = async (data: GoogleAuthRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/api/auth/oauth/google", data, {
    headers: {
      'X-Skip-Auth': 'true'
    }
  });
  return response.data;
};


// Yêu cầu backend gửi email reset mật khẩu.
const forgotPassword = async (data: ForgotPasswordRequest): Promise<string> => {
  const response = await apiClient.post<string>(
    '/api/auth/forgot-password',
    data,
    {
      headers: {
        'X-Skip-Auth': 'true', 
      },
    }
  );
  return response.data;
};

const validateResetToken = async (token: string): Promise<void> => {
  await apiClient.get(
    `/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
    {
      headers: {
        'X-Skip-Auth': 'true',
      },
    }
  );

};

// Gửi token và mật khẩu mới lên backend.
const resetPassword = async (data: ResetPasswordRequest): Promise<string> => {
  const response = await apiClient.post<string>(
    '/api/auth/reset-password',
    data,
    {
      headers: {
        'X-Skip-Auth': 'true',
      },
    }
  );
  return response.data;
};

export const authService = {
  login,
  register,
  verifyAccount,
  resendOtp,
  loginWithGoogle,
  forgotPassword,
  validateResetToken, 
  resetPassword, 
};