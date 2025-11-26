export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  // Thêm các trường mở rộng (có thể backend chưa trả về, ta để optional để UI không lỗi)
  phoneNumber?: string;
  avatar?: string;
  address?: string;
}

export interface GoogleAuthRequest {
  code: string;
}

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

// [NEW] Request cập nhật thông tin
export interface UpdateProfileRequest {
  name: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
}

// [NEW] Request đổi mật khẩu
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmationPassword: string;
}