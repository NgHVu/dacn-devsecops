// Đặt tại: app/(auth)/register/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input"; 
import { AlertCircle, Loader2 } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { authService } from "@/services/authService"; 
import { useAuth } from "@/context/AuthContext"; // <-- 1. IMPORT USEAUTH

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth(); // <-- 2. LẤY HÀM LOGIN TỪ CONTEXT 
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null); 

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp. Vui lòng thử lại.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await authService.register({ name, email, password });
      
      console.log("Đăng ký thành công!", data);

      await login(data.token);

      router.push("/"); 

    } catch (err) {
      console.error(err);
      setError("Đăng ký thất bại. Email có thể đã tồn tại."); 
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Tạo tài khoản</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đăng ký thất bại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Input
              id="name"
              type="text"
              placeholder="Họ và Tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading} 
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
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <PasswordInput
              id="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <PasswordInput
              id="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            onClick={handleRegister} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Đăng ký"
            )}
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