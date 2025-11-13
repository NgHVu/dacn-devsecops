"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserResponse } from "@/types/auth";
import apiClient from "@/lib/apiClient"; 
import { Loader2 } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>; 
  logout: () => void;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu = true, để kiểm tra session

  // Hàm này sẽ được gọi từ trang Login hoặc Verify
  const login = async (token: string) => {
    try {
      // Lưu token vào localStorage
      localStorage.setItem("authToken", token);
      
      // Interceptor trong apiClient.ts sẽ tự động đọc token từ localstorage và đính kèm header.
      const response = await apiClient.get<UserResponse>("/api/users/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Lưu thông tin user vào state
      setUser(response.data);

    } catch (error) {
      console.error("Lỗi khi lấy thông tin user (trong hàm login):", error);
      logout(); 
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
  };

  // KIỂM TRA PHIÊN ĐĂNG NHẬP KHI TẢI TRANG
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          await login(storedToken);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra session:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    checkUserSession();
  }, []);

  // Hiển thị màn hình loading toàn trang
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  // Cung cấp state cho ứng dụng
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Tạo Hook tùy chỉnh
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được dùng bên trong một AuthProvider");
  }
  return context;
};