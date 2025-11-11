// Định nghĩa các "yêu cầu" (Request) mà chúng ta gửi đi

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Định nghĩa "phản hồi" (Response) mà backend trả về

export interface AuthResponse {
  token: string;
  // (Backend của bạn có thể trả về thêm user info, v.v.)
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  // (Thêm các trường khác từ DTO UserResponse của bạn)
}