"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserResponse } from "@/types/auth";
import apiClient from "@/lib/apiClient"; 
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>; 
  logout: () => void;
  refreshProfile: () => Promise<void>; // [NEW] Hàm làm mới thông tin user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  const fetchUser = async () => {
      try {
        const response = await apiClient.get<UserResponse>("/api/users/me");
        setUser(response.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
        throw error;
      }
  };

  const login = async (token: string) => {
    try {
      localStorage.setItem("authToken", token);
      // Cấu hình header cho các request tiếp theo (nếu apiClient không tự handle qua interceptor)
      // Tuy nhiên apiClient thường dùng interceptor để lấy token từ localStorage
      await fetchUser();
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      logout(); 
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    // Có thể cần xóa cookie hoặc gọi API logout nếu backend yêu cầu
  };

  // [NEW] Hàm này được gọi sau khi update profile thành công
  const refreshProfile = async () => {
      if (localStorage.getItem("authToken")) {
          await fetchUser();
      }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          await fetchUser();
        }
      } catch (error) {
        console.error("Phiên đăng nhập không hợp lệ:", error);
        logout();
      } finally {
        setIsLoading(false); 
      }
    };

    checkUserSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được dùng bên trong một AuthProvider");
  }
  return context;
};