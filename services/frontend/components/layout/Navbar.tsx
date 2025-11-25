"use client";

import React, { useState, useEffect } from "react"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { ShoppingCart, User, LogOut, LayoutDashboard, UtensilsCrossed, Search, Menu, ClipboardList } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/layout/mode-toggle"; 
import { useAuth } from "@/context/AuthContext"; 
import { useCart } from "@/context/CartContext"; 
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout(); 
    router.push("/login"); 
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic search...
  };

  return (
    <nav 
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "border-b bg-background/80 backdrop-blur-md shadow-sm" 
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 md:px-6">
        
        {/* === MOBILE MENU === */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0 hover:bg-primary/10 hover:text-primary">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col p-0">
             <SheetHeader className="p-6 border-b text-left bg-orange-50/50 dark:bg-zinc-900/50">
                <SheetTitle className="flex items-center gap-2 text-xl font-bold text-orange-600">
                    <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                        <UtensilsCrossed className="h-5 w-5" />
                    </div>
                    FoodHub
                </SheetTitle>
             </SheetHeader>
             
             <div className="flex-1 overflow-y-auto py-4">
                <nav className="flex flex-col px-4 gap-1">
                    <p className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wider">Menu Chính</p>
                    <SheetClose asChild>
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">
                            Trang chủ
                        </Link>
                    </SheetClose>
                    <SheetClose asChild>
                        <Link href="/search?q=hot" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">
                            Món Hot & Bán Chạy
                            <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-700 text-[10px] hover:bg-orange-100">HOT</Badge>
                        </Link>
                    </SheetClose>
                    <SheetClose asChild>
                        <Link href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">
                            Đơn hàng của tôi
                        </Link>
                    </SheetClose>
                </nav>
             </div>
             
             <div className="p-4 border-t bg-muted/30">
                 {!isAuthenticated ? (
                     <Button asChild className="w-full bg-orange-600 hover:bg-orange-500">
                         <Link href="/login">Đăng nhập / Đăng ký</Link>
                     </Button>
                 ) : (
                     <div className="flex items-center gap-3">
                         <Avatar>
                             <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} />
                             <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                         </Avatar>
                         <div className="flex flex-col">
                             <span className="text-sm font-medium">{user?.name}</span>
                             <span className="text-xs text-muted-foreground">Thành viên</span>
                         </div>
                         <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-auto text-muted-foreground hover:text-red-600">
                             <LogOut className="h-5 w-5" />
                         </Button>
                     </div>
                 )}
             </div>
          </SheetContent>
        </Sheet>

        {/* === LOGO === */}
        <Link href="/" className="flex items-center gap-2 mr-4 shrink-0 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
             <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 hidden sm:inline-block tracking-tight">
            FoodHub
          </span>
        </Link>

        {/* === DESKTOP NAV (ĐÃ CẬP NHẬT) === */}
        <div className="hidden md:flex gap-1 items-center">
           {[
               { name: "Trang chủ", href: "/" },
               { name: "Món Hot", href: "/search?q=hot" }, // Dẫn đến trang tìm kiếm
               { name: "Đơn hàng", href: "/orders" },      // Đã thêm lại link Đơn hàng
           ].map((item) => (
               <Link 
                  key={item.name}
                  href={item.href} 
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                >
                    {item.name}
                </Link>
           ))}
        </div>

        {/* === SEARCH BAR === */}
        <div className="flex-1 max-w-sm mx-auto hidden sm:flex">
           <form onSubmit={handleSearch} className="relative w-full group">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="search"
                  placeholder="Tìm món ngon..."
                  className="w-full bg-muted/50 pl-10 pr-4 h-10 rounded-full border-transparent focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
             </div>
           </form>
        </div>

        {/* === ACTIONS === */}
        <div className="flex items-center gap-1 justify-end ml-auto">
          <ModeToggle /> 

          <Button variant="ghost" size="icon" asChild className="relative rounded-full hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-zinc-800 transition-colors">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-background animate-in zoom-in spin-in-12">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ml-1 h-9 w-9 border-2 border-transparent hover:border-primary/20 focus-visible:ring-0">
                  <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-md mb-2">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} />
                        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-semibold truncate max-w-[140px]">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</p>
                    </div>
                </div>
                
                {user?.role === "ROLE_ADMIN" && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer focus:bg-orange-50 dark:focus:bg-orange-900/20">
                      <Link href="/admin/products" className="text-orange-600 font-medium w-full flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Trang Quản trị
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="w-full flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/orders" className="w-full flex items-center">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Đơn hàng của tôi
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full px-6 font-semibold bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-500/20 ml-2 transition-all hover:shadow-orange-500/40">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}