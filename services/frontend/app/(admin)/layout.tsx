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
  ShieldCheck,
  ChevronRight,
  Home
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
import { ScrollArea } from "@/components/ui/scroll-area"; // [FIX] Đã có component này

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

  // Fix Hydration Error
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true); 
  }, []);

  // --- 2. SECURITY LOGIC ---
  useEffect(() => {
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
  if (!isMounted || isLoading || !user || user.role !== "ROLE_ADMIN") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 gap-4">
        <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-orange-600" />
            </div>
        </div>
        <p className="text-zinc-500 font-medium animate-pulse">Đang xác thực quyền quản trị...</p>
      </div>
    );
  }

  // --- 4. MAIN ADMIN UI ---
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
      
      {/* --- SIDEBAR (DESKTOP) --- */}
      <div className="hidden border-r bg-zinc-900 text-zinc-100 md:block relative">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b border-white/10 px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-90 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-900/50">
                 <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <span>FoodHub <span className="text-orange-500 text-sm font-normal">Admin</span></span>
            </Link>
          </div>
          
          <ScrollArea className="flex-1 py-4">
            <nav className="grid items-start px-4 text-sm font-medium gap-1">
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                      isActive 
                        ? "bg-orange-600 text-white shadow-md shadow-orange-900/20" 
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-100"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          
          {/* Footer Sidebar */}
          <div className="mt-auto p-4 border-t border-white/10">
             <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-full bg-green-500/20">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-xs text-zinc-200">System Status</h4>
                        <p className="text-[10px] text-green-500 font-medium">● Online</p>
                    </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                    IP: 192.168.1.x detected
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-col bg-zinc-50/50 min-h-screen">
        
        {/* HEADER (Mobile Menu + User Profile) */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-6 shadow-sm">
          
          {/* Mobile Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-zinc-900 text-zinc-100 border-r-zinc-800">
              <nav className="grid gap-2 text-lg font-medium mt-6">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-6">
                   <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                   FoodHub Admin
                </Link>
                {menuItems.map((item) => (
                   <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 rounded-xl px-3 py-3 hover:text-white transition-colors ${
                        pathname.startsWith(item.href) ? "bg-orange-600 text-white" : "text-zinc-400"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Breadcrumb (Simple) */}
          <div className="hidden md:flex items-center text-sm text-zinc-500">
             <Link href="/admin/dashboard" className="hover:text-orange-600 transition-colors"><Home className="h-4 w-4" /></Link>
             <ChevronRight className="h-4 w-4 mx-2" />
             <span className="font-medium text-zinc-900">
                {menuItems.find(i => pathname.startsWith(i.href))?.label || "Dashboard"}
             </span>
          </div>

          <div className="ml-auto flex items-center gap-4">
             {/* User Dropdown */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-50 border border-transparent hover:border-orange-100">
                    <Avatar className="h-9 w-9 border border-zinc-200">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">AD</AvatarFallback>
                    </Avatar>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/')} className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" /> Về trang bán hàng
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}