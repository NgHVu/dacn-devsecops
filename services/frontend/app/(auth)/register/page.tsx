"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// Bỏ import Eye, EyeOff
// import { Eye, EyeOff } from "lucide-react"; 
// 1. IMPORT COMPONENT MỚI
import { PasswordInput } from "@/components/ui/password-input";

export default function RegisterPage() {
  // 2. BỔ SUNG STATE CHO `name` (Backend cần)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 3. XÓA 2 STATE "con mắt" (vì PasswordInput tự quản lý)
  // const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      console.error("Mật khẩu không khớp!");
      // (Sau này chúng ta sẽ hiển thị lỗi này ra UI)
      return;
    }
    // 4. BỔ SUNG `name` VÀO LOGIC
    console.log("Đang đăng ký với:", { name, email, password });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Tạo tài khoản</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 5. THÊM Ô NHẬP TÊN */}
          <div className="space-y-2">
            <Input
              id="name"
              type="text"
              placeholder="Họ và Tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 6. DÙNG COMPONENT MỚI */}
          <div className="space-y-2">
            <PasswordInput
              id="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* 7. DÙNG COMPONENT MỚI LẦN NỮA */}
          <div className="space-y-2">
            <PasswordInput
              id="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleRegister}>
            Đăng ký
          </Button>
          
          <div className="text-center text-sm">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium text-primary underline">
              Đăng nhập ngay
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}