"use client"; 

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react"; 
import { Button } from "@/components/ui/button";     

/**
 * Navbar (Thanh điều hướng) chính của trang web.
 * Đây là Client Component vì nó sẽ cần đọc Context (Auth, Cart) sau này.
 */
export default function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* === Phần Bên Trái: Logo & Điều hướng === */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-primary"
          >
            FoodApp
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex md:gap-4">
            <Button variant="ghost" asChild>
              <Link href="/products">Sản Phẩm</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/orders">Đơn Hàng</Link>
            </Button>
          </div>
        </div>

        {/* === Phần Bên Phải: Actions === */}
        <div className="flex items-center gap-4">
          {/* Nút Giỏ Hàng */}
          <Button variant="outline" size="icon" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Giỏ hàng</span>
            </Link>
          </Button>

          {/* Nút Đăng nhập */}
          <Button asChild>
            <Link href="/login">
              <User className="mr-2 h-4 w-4" />
              Đăng nhập
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}