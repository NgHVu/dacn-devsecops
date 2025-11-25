"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Loader2, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Menu,
  UtensilsCrossed,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // --- 1. CONFIG MENU ITEMS ---
  const menuItems = [
    {
      href: "/admin/dashboard",
      label: "Tổng quan",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/products",
      label: "Quản lý Món ăn",
      icon: Package,
    },
    {
      href: "/admin/orders",
      label: "Quản lý Đơn hàng",
      icon: ShoppingCart,
    },
    {
      href: "/admin/users",
      label: "Người dùng",
      icon: Users,
    },
  ];

  // Fix Hydration Error (Client-side only rendering)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);
  }, []);

  // --- 2. SECURITY LOGIC ---
  useEffect(() => {
    // Chỉ chạy logic redirect khi component đã mount và auth đã load xong
    if (!isMounted || isLoading) return;

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để truy cập Admin.");
      const encodedRedirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${encodedRedirect}`);
      return;
    }

    if (user?.role !== "ROLE_ADMIN") {
      toast.error("Truy cập bị từ chối: Bạn không phải Admin.");
      router.replace("/");
      return;
    }
  }, [isMounted, isLoading, isAuthenticated, user, router, pathname]);

  // --- 3. LOADING STATE ---
  // Hiển thị màn hình chờ trong lúc đang check quyền hoặc đang mount
  if (!isMounted || isLoading || !user || user.role !== "ROLE_ADMIN") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang xác thực quyền quản trị...</p>
      </div>
    );
  }

  // --- 4. MAIN ADMIN UI ---
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      
      {/* --- SIDEBAR (DESKTOP) --- */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                 <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="">FoodApp Admin</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 pt-4">
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                      isActive 
                        ? "bg-primary/10 text-primary font-bold" 
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Footer Sidebar */}
          <div className="mt-auto p-4">
             <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-orange-600" />
                    <h4 className="font-semibold text-xs text-orange-800">Admin Zone</h4>
                </div>
                <p className="text-[10px] text-orange-600/80">
                    Hệ thống quản trị bảo mật. IP của bạn đang được ghi lại.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-col">
        
        {/* HEADER (Mobile Menu + User Profile) */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          
          {/* Mobile Trigger (Chỉ hiện trên mobile) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                   <UtensilsCrossed className="h-6 w-6 text-primary" />
                   FoodApp Admin
                </Link>
                {menuItems.map((item) => (
                   <Link
                    key={item.href}
                    href={item.href}
                    className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground ${
                        pathname.startsWith(item.href) ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            {/* Chỗ này để Search Bar sau này */}
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`} />
                    <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Xin chào, {user?.name || 'Admin'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/')}>
                Về trang bán hàng
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}