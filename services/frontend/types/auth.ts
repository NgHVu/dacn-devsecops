// Định nghĩa các "yêu cầu" mà chúng ta gửi đi
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Dùng cho việc xác thực OTP
export interface VerifyRequest {
  email: string;
  otp: string;
}

// Định nghĩa "phản hồi" mà backend trả về
export interface AuthResponse {
  accessToken: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}