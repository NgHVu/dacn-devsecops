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
  phoneNumber?: string;
  avatar?: string;
  address?: string;
  accountNonLocked?: boolean; 
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

export interface UpdateProfileRequest {
  name: string;
  phoneNumber?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;      
  newPassword: string;
  confirmPassword: string; 
}