"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { isAxiosError } from "axios";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const state = searchParams.get("state"); 

      if (errorParam) {
        setError(`Đăng nhập Google thất bại: ${errorParam}`);
        return;
      }

      if (!code) {
        setError("Không tìm thấy mã xác thực. Vui lòng thử lại.");
        return;
      }

      let redirectUrl = "/"; 
      if (state) {
        try {
          const decodedState = JSON.parse(atob(state));
          if (decodedState.redirect) {
            redirectUrl = decodedState.redirect;
          }
        } catch (e) {
          console.error("Lỗi giải mã state:", e);
        }
      }

      try {
        const data = await authService.loginWithGoogle({ code });
        await login(data.accessToken); 
        router.push(redirectUrl); 
      } catch (err) {
        console.error("Lỗi xác thực Google:", err);
        let errorMessage = "Đã xảy ra lỗi không xác định.";
        if (isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.response?.data || "Xác thực Google thất bại.";
        }
        setError(errorMessage);
      }
    };

    if (hasProcessed.current === false) {
      hasProcessed.current = true;
      handleGoogleCallback();
    }
  }, [searchParams, router, login]); 

  return (
    // Card "Vô hình" để khớp Layout
    <Card className="w-full border-0 shadow-none bg-transparent transition-all">
      
      {error ? (
        // TRẠNG THÁI LỖI
        <>
          <CardHeader className="text-center px-0">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-destructive">
              Đăng nhập thất bại
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi xác thực</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="px-0">
            <Button asChild className="w-full h-11 bg-orange-600 hover:bg-orange-500">
              <Link href="/login" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </Button>
          </CardFooter>
        </>
      ) : (
        // TRẠNG THÁI LOADING (ĐANG XỬ LÝ)
        <div className="py-12 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            {/* Hiệu ứng 2 vòng tròn xoay nhìn cho "nguy hiểm" hơn */}
            <div className="absolute inset-0 rounded-full border-4 border-orange-200 opacity-20 animate-ping"></div>
            <Loader2 className="h-12 w-12 animate-spin text-orange-600 relative z-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Đang kết nối với Google...</h3>
            <p className="text-sm text-muted-foreground">
              Vui lòng không tắt trình duyệt
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}