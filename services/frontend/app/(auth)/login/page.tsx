// Đặt tại: app/(auth)/login/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // <-- 1. Import hook điều hướng
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
import { AlertCircle, Loader2 } from "lucide-react"; // <-- 2. Import icon Lỗi và Loading
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // <-- 3. Import Alert
import { authService } from "@/services/authService"; // <-- 4. Import service của chúng ta

export default function LoginPage() {
  const router = useRouter(); // <-- 5. Khởi tạo router
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 6. Thêm state mới cho loading và lỗi
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Để lưu tin nhắn lỗi

  /**
   * Xử lý logic khi nhấn nút Đăng nhập
   */
  const handleLogin = async () => {
    // 7. Bắt đầu gọi API
    setIsLoading(true);
    setError(null); // Xóa lỗi cũ (nếu có)

    try {
      // 8. Gọi hàm login từ service
      const data = await authService.login({ email, password });
      
      console.log("Đăng nhập thành công!", data);

      // TODO: Bước tiếp theo
      // Lưu token vào Context / localStorage
      // localStorage.setItem("authToken", data.token);

      // 9. Đăng nhập thành công, điều hướng về trang chủ
      router.push("/"); 

    } catch (err) {
      // 10. Xử lý khi API trả về lỗi
      console.error(err);
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      setIsLoading(false); // Dừng loading
    }
    // (setIsLoading(false) sẽ được xử lý ở `finally` nếu bạn muốn, 
    // nhưng ở đây chúng ta chỉ dừng loading nếu có lỗi, vì nếu thành công 
    // trang sẽ chuyển hướng luôn)
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 11. HIỂN THỊ LỖI (nếu có) */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đăng nhập thất bại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Email/Số điện thoại/Tên đăng nhập"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading} // Vô hiệu hóa khi đang loading
            />
          </div>
          
          <div className="space-y-2">
            <PasswordInput
              id="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading} // Vô hiệu hóa khi đang loading
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {/* 12. HIỂN THỊ ICON LOADING TRÊN NÚT */}
          <Button 
            className="w-full" 
            onClick={handleLogin} 
            disabled={isLoading} // Vô hiệu hóa nút khi đang loading
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // Icon quay
            ) : (
              "Đăng nhập" // Chữ bình thường
            )}
          </Button>
          
          <div className="text-center text-sm">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-medium text-primary underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}