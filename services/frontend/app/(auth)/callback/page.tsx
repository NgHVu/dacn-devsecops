"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); 

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(`Đăng nhập Google thất bại: ${errorParam}`);
        return;
      }

      if (!code) {
        setError("Không tìm thấy authorization code. Vui lòng thử lại.");
        return;
      }

      try {
        const data = await authService.loginWithGoogle({ code });

        await login(data.accessToken);

        router.push("/");

      } catch (err) {
        console.error("Lỗi khi xác thực Google Callback:", err);
        let errorMessage = "Đã xảy ra lỗi không xác định.";
        if (isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.response?.data || "Xác thực Google thất bại.";
        }
        setError(errorMessage);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router, login]); 

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      {error ? (
        // Nếu có lỗi, hiển thị thông báo lỗi
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive">
              Đăng nhập thất bại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đã xảy ra lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Quay lại trang Đăng nhập</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">
            Đang xác thực, vui lòng chờ...
          </p>
        </div>
      )}
    </div>
  );
}