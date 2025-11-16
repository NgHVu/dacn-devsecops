"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { isAxiosError } from "axios";

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Token không hợp lệ hoặc bị thiếu. Vui lòng thử lại.");
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Mật khẩu phải từ 8 ký tự trở lên.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setIsLoading(false);
      return;
    }

    try {
      const message = await authService.resetPassword({
        token: token,
        newPassword: password,
      });
      setSuccessMessage(message);

      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err) {
      console.error("Lỗi khi reset mật khẩu:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (isAxiosError(err) && err.response?.data) {
        errorMessage = err.response.data.message || err.response.data || "Token không hợp lệ hoặc đã hết hạn.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
          <CardDescription>
            Nhập mật khẩu mới cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!successMessage && (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Đặt lại thất bại</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <PasswordInput
                  id="password"
                  placeholder="Mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {successMessage && (
            <Alert className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Thành công!</AlertTitle>
              <AlertDescription>
                {successMessage} Bạn sẽ được chuyển hướng đến trang Đăng nhập
                trong 3 giây...
              </AlertDescription>
            </Alert>
          )}

        </CardContent>

        <CardFooter>
          {!successMessage && (
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isLoading || !token}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Cập nhật mật khẩu"
              )}
            </Button>
          )}

          {successMessage && (
            <Button asChild className="w-full">
              <Link href="/login">Đi đến Đăng nhập ngay</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}