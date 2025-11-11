"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserResponse } from "@/types/auth"; // Import kiểu User
import apiClient from "@/lib/apiClient"; // Import apiClient
import { Loader2 } from "lucide-react"; // Import icon loading

// 1. Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
  user: UserResponse | null; // Thông tin user (hoặc null nếu chưa đăng nhập)
  isAuthenticated: boolean;    // Cờ (flag) tiện ích
  isLoading: boolean;          // Cờ kiểm tra phiên đăng nhập (session) khi tải trang
  login: (token: string) => Promise<void>; // Hàm để gọi sau khi API login thành công
  logout: () => void;                      // Hàm để đăng xuất
}

// 2. Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Tạo Provider (Component bọc ứng dụng)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu = true, vì ta cần kiểm tra session

  // Hàm này sẽ được gọi từ trang Login/Register
  const login = async (token: string) => {
    try {
      // 1. Lưu token vào localStorage (như cũ)
      localStorage.setItem("authToken", token);
      
      // 2. SỬA LỖI: Gọi API /me VÀ GỬI TOKEN TRỰC TIẾP
      //    Điều này tránh được "race condition" với interceptor
      const response = await apiClient.get<UserResponse>("/api/users/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 3. Lưu thông tin user vào state (như cũ)
      setUser(response.data);

    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
      // Nếu có lỗi (token hỏng, v.v.), hãy đăng xuất
      logout();
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    // 1. Xóa user khỏi state
    setUser(null);
    // 2. Xóa token khỏi localStorage
    localStorage.removeItem("authToken");
  };

  // 4. KIỂM TRA PHIÊN ĐĂNG NHẬP KHI TẢI TRANG
  useEffect(() => {
    const checkUserSession = async () => {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        // Nếu có token, thử đăng nhập bằng token đó
        await login(storedToken);
      }
      // Dù thành công hay không, cũng phải dừng loading
      setIsLoading(false); 
    };

    checkUserSession();
  }, []); // [] = Chỉ chạy 1 lần khi component được mount

  // 5. Nếu đang kiểm tra session, hiển thị màn hình loading toàn trang
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  // 6. Cung cấp state và các hàm cho toàn bộ ứng dụng
  const value = {
    user,
    isAuthenticated: !!user, // (true nếu user tồn tại, false nếu user là null)
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 7. Tạo Hook tùy chỉnh (để dễ dàng sử dụng)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được dùng bên trong một AuthProvider");
  }
  return context;
};