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
}

export interface GoogleAuthRequest {
  code: string;
}