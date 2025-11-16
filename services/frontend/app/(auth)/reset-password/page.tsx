"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // <-- IMPORT
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength"; // <-- IMPORT
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { isAxiosError } from "axios";

// === 1. ĐỊNH NGHĨA RESET PASSWORD SCHEMA ===
const formSchema = z
  .object({
    newPassword: z.string().min(8, {
      message: "Mật khẩu phải có ít nhất 8 ký tự.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Vui lòng xác nhận mật khẩu.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"], // Gán lỗi vào ô 'confirmPassword'
  });
// === KẾT THÚC SCHEMA ===

// Bọc component chính bằng Suspense (giữ nguyên)
export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

type TokenStatus = 'loading' | 'valid' | 'invalid';

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  
  // Xóa useState cho password, confirmPassword
  // const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Lỗi chung
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');

  // === 2. THIẾT LẬP REACT-HOOK-FORM ===
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange", // Để cập nhật thanh đo độ mạnh
  });
  // === KẾT THÚC THIẾT LẬP ===

  // useEffect để xác thực token (giữ nguyên logic)
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");

    if (!tokenFromUrl) {
      setError("Token không hợp lệ hoặc bị thiếu.");
      setTokenStatus('invalid');
      return;
    }

    setToken(tokenFromUrl);

    const validateToken = async () => {
      try {
        await authService.validateResetToken(tokenFromUrl);
        setTokenStatus('valid');
      } catch (err) {
        console.error("Lỗi khi xác thực token:", err);
        let errorMessage = "Link không hợp lệ.";
        if (isAxiosError(err) && err.response?.data) {
          errorMessage = err.response.data.message || err.response.data;
        }
        setError(errorMessage);
        setTokenStatus('invalid');
      }
    };

    validateToken();
    
  }, [searchParams]);

  // === 3. HÀM SUBMIT MỚI ===
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token || tokenStatus !== 'valid') return; 

    setIsLoading(true);
    setError(null);

    // Logic validation (8 ký tự, khớp) đã được Zod lo
    
    try {
      const message = await authService.resetPassword({
        token: token,
        newPassword: values.newPassword, // Lấy từ 'values'
      });
      setSuccessMessage(message);
      setTokenStatus('invalid'); // Vô hiệu hóa form

      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err) {
      console.error("Lỗi khi reset mật khẩu:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (isAxiosError(err) && err.response?.data) {
        errorMessage = err.response.data.message || err.response.data;
      }
      setError(errorMessage);
      setTokenStatus('invalid');
    } finally {
      setIsLoading(false);
    }
  };
  // === KẾT THÚC HÀM SUBMIT ===

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        
        {/* TRẠNG THÁI LOADING (giữ nguyên) */}
        {tokenStatus === 'loading' && (
          <CardHeader className="text-center p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p className="text-muted-foreground">Đang xác thực link...</p>
            </div>
          </CardHeader>
        )}

        {/* TRẠNG THÁI HỢP LỆ (Form đã refactor) */}
        {tokenStatus === 'valid' && (
          // === 4. BỌC <Form> VÀO ĐÂY ===
          <Form {...form}>
            {/* Thêm noValidate để tắt thông báo trình duyệt */}
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate> 
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
                <CardDescription>
                  Nhập mật khẩu mới cho tài khoản của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lỗi chung (ví dụ: 500) */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Đặt lại thất bại</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Ô Mật khẩu mới */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Mật khẩu mới của bạn"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      {/* === 5. THÊM THANH ĐO ĐỘ MẠNH === */}
                      <PasswordStrength password={field.value} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Ô Xác nhận mật khẩu mới */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Nhập lại mật khẩu mới"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              {/* === 6. SỬA LỖI LAYOUT (THÊM pt-6) === */}
              <CardFooter className="pt-6">
                <Button
                  type="submit" // <-- ĐỔI THÀNH TYPE "SUBMIT"
                  className="w-full"
                  disabled={isLoading || !token}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Cập nhật mật khẩu"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}

        {/* TRẠNG THÁI KHÔNG HỢP LỆ (giữ nguyên) */}
        {tokenStatus === 'invalid' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Link không hợp lệ</CardTitle>
            </CardHeader>
            <CardContent>
              {successMessage ? (
                // Nếu reset thành công
                <Alert className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Thành công!</AlertTitle>
                  <AlertDescription>
                    {successMessage} Bạn sẽ được chuyển hướng đến trang Đăng nhập
                    trong 3 giây...
                  </AlertDescription>
                </Alert>
              ) : (
                // Nếu link lỗi (hết hạn, đã dùng)
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Đặt lại thất bại</AlertTitle>
                  <AlertDescription>
                    {error || "Link reset này không còn hợp lệ."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/login">Quay lại trang Đăng nhập</Link>
              </Button>
            </CardFooter>
          </>
        )}
        
      </Card>
    </div>
  );
}