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
  Home,
  Layers
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/layout/mode-toggle"; 

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

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
      href: "/admin/categories",
      label: "Quản lý Danh mục",
      icon: Layers,
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);
  }, []);

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

  if (!isMounted || isLoading || !user || user.role !== "ROLE_ADMIN") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-orange-600" />
            </div>
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Đang xác thực quyền quản trị...</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">

      <div className="hidden border-r bg-card text-card-foreground md:block relative">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-90 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                 <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <span>FoodHub <span className="text-orange-600 text-sm font-normal">Admin</span></span>
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
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          
          <div className="mt-auto p-4 border-t">
             <div className="bg-muted/50 border rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-full bg-green-500/20">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-xs text-foreground">System Status</h4>
                        <p className="text-[10px] text-green-600 font-medium">● Online</p>
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                    IP: 192.168.61.x detected
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-muted/40 min-h-screen">
        
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 shadow-sm">
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-background text-foreground">
              <nav className="grid gap-2 text-lg font-medium mt-6">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-6">
                   <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                   FoodHub Admin
                </Link>
                {menuItems.map((item) => (
                   <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 rounded-xl px-3 py-3 hover:text-foreground transition-colors ${
                        pathname.startsWith(item.href) ? "bg-orange-600 text-white" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center text-sm text-muted-foreground">
             <Link href="/admin/dashboard" className="hover:text-orange-600 transition-colors"><Home className="h-4 w-4" /></Link>
             <ChevronRight className="h-4 w-4 mx-2" />
             <span className="font-medium text-foreground">
                {menuItems.find(i => pathname.startsWith(i.href))?.label || "Dashboard"}
             </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
             
             <ModeToggle />

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted border border-transparent hover:border-border ml-2">
                    <Avatar className="h-9 w-9 border border-border">
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
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}