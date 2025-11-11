"use client"; 

import Link from "next/link";
// 1. IMPORT THÊM ICON LogOut
import { ShoppingCart, User, LogOut } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { useAuth } from "@/context/AuthContext"; // <-- 2. IMPORT HOOK AUTH

// 3. IMPORT CÁC COMPONENT MỚI
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
  AvatarImage,
} from "@/components/ui/avatar";

export default function Navbar() {
  // 4. LẤY TRẠNG THÁI TỪ CONTEXT
  const { user, isAuthenticated, logout } = useAuth();

  // Hàm tiện ích lấy 2 chữ cái đầu của tên (ví dụ: "Vũ Nguyễn" -> "VN")
  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* === Phần Bên Trái (Giữ nguyên) === */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold text-primary">
            FoodApp
          </Link>
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
          <Button variant="outline" size="icon" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>
          
          <ModeToggle /> 

          {/* === 5. LOGIC HIỂN THỊ ĐIỀU KIỆN === */}
          {isAuthenticated ? (
            // --- NẾU ĐÃ ĐĂNG NHẬP: HIỂN THỊ AVATAR & DROPDOWN ---
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    {/* (Sau này có thể thêm AvatarImage nếu user có ảnh) */}
                    {/* <AvatarImage src={user?.avatarUrl} alt={user?.name} /> */}
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
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Tài khoản</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          ) : (
            // --- NẾU CHƯA ĐĂNG NHẬP: HIỂN THỊ NÚT ĐĂNG NHẬP ---
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