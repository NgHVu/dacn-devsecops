"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const pathname = usePathname(); 

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      toast.error("Phiên đăng nhập hết hạn hoặc không tồn tại.");
      
      const encodedRedirect = encodeURIComponent(pathname);
      const redirectUrl = `/login?redirect=${encodedRedirect}`;
      
      router.replace(redirectUrl);
      return;
    }

    if (user?.role !== "ROLE_ADMIN") {
      toast.error("Truy cập bị từ chối: Bạn không có quyền Quản trị viên.");
      router.replace("/"); 
      return;
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && user?.role === "ROLE_ADMIN") {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return null;
}