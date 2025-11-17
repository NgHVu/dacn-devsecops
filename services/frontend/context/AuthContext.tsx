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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  const login = async (token: string) => {
    try {
      localStorage.setItem("authToken", token);
      
      const response = await apiClient.get<UserResponse>("/api/users/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUser(response.data);

    } catch (error) {
      console.error("Lỗi khi lấy thông tin user (trong hàm login):", error);
      logout(); 
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
  };

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          await login(storedToken);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra session:", error);
        logout();
      } finally {
        setIsLoading(false); 
      }
    };

    checkUserSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
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