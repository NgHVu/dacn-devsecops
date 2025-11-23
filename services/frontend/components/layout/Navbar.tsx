"use client"; 

import React from "react"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/layout/mode-toggle"; 
import { useAuth } from "@/context/AuthContext"; 
import { useCart } from "@/context/CartContext"; 
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();

  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout(); 
    router.push("/login"); 
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold text-primary">
            FoodApp
          </Link>
          <div className="hidden md:flex md:gap-4">
            <Button variant="ghost" asChild>
              <Link href="/">Sản Phẩm</Link> 
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/orders">Đơn Hàng</Link>
            </Button>
            
            {isAuthenticated && user?.role === "ROLE_ADMIN" && (
               <Button variant="ghost" asChild className="text-red-600 hover:text-red-700 hover:bg-red-50">
                 <Link href="/admin/products">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Quản lý
                 </Link>
               </Button>
            )}

          </div>
        </div>

        <div className="flex items-center gap-4">
          
          <Button variant="outline" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Giỏ hàng</span>
              {totalItems > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </Button>
          
          <ModeToggle /> 

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs font-bold text-blue-500 mt-1">
                      {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {user?.role === "ROLE_ADMIN" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/products" className="text-red-600 focus:text-red-600">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Trang Quản trị</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Tài khoản</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          ) : (
            <Button asChild>
              <Link href="/login">
                <User className="mr-2 h-4 w-4" />
                Đăng nhập
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}