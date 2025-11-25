"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isAxiosError } from "axios";
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft, 
  KeyRound, 
  XCircle 
} from "lucide-react";

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
} from "@/components/ui/form"; 
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";

// --- VALIDATION SCHEMA ---
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
    path: ["confirmPassword"], 
  });

// --- WRAPPER FOR SUSPENSE ---
export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
      </div>
    }>
      <ResetPasswordPage />
    </Suspense>
  );
}

type TokenStatus = 'loading' | 'valid' | 'invalid' | 'success';

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [token, setToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');
  const [error, setError] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange", 
  });

  // 1. Validate Token on Mount
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");

    if (!tokenFromUrl) {
      setError("Đường dẫn không hợp lệ hoặc bị thiếu.");
      setTokenStatus('invalid');
      return;
    }

    setToken(tokenFromUrl);

    const validateToken = async () => {
      try {
        await authService.validateResetToken(tokenFromUrl);
        // Giả lập delay nhỏ để UX đỡ bị giật cục
        await new Promise(r => setTimeout(r, 500));
        setTokenStatus('valid');
      } catch (err) {
        console.error("Lỗi khi xác thực token:", err);
        let errorMessage = "Đường dẫn đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.";
        if (isAxiosError(err) && err.response?.data) {
          errorMessage = err.response.data.message || err.response.data;
        }
        setError(errorMessage);
        setTokenStatus('invalid');
      }
    };

    validateToken();
  }, [searchParams]);

  // 2. Handle Submit
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token || tokenStatus !== 'valid') return; 

    setIsSubmitting(true);
    setError(null);
    
    try {
      await authService.resetPassword({
        token: token,
        newPassword: values.newPassword,
      });
      setTokenStatus('success');
      
      // Redirect sau 3s
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err) {
      console.error("Lỗi khi reset mật khẩu:", err);
      let errorMessage = "Đã xảy ra lỗi khi cập nhật mật khẩu.";
      if (isAxiosError(err) && err.response?.data) {
        errorMessage = err.response.data.message || err.response.data;
      }
      setError(errorMessage);
      // Không set invalid ngay, cho phép user thử lại nếu lỗi mạng
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderHeaderIcon = () => {
    switch (tokenStatus) {
      case 'loading': return <Loader2 className="h-6 w-6 text-orange-600 animate-spin" />;
      case 'success': return <CheckCircle2 className="h-6 w-6 text-green-600 animate-bounce" />;
      case 'invalid': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <KeyRound className="h-6 w-6 text-orange-600" />;
    }
  };

  const renderTitle = () => {
    switch (tokenStatus) {
      case 'loading': return "Đang xác thực...";
      case 'invalid': return "Link không hợp lệ";
      case 'success': return "Đổi mật khẩu thành công";
      default: return "Đặt lại mật khẩu";
    }
  };

  const renderDescription = () => {
    switch (tokenStatus) {
      case 'loading': return "Vui lòng đợi trong giây lát.";
      case 'invalid': return "Đường dẫn này có thể đã hết hạn hoặc sai lệch.";
      case 'success': return "Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng...";
      default: return "Nhập mật khẩu mới để bảo vệ tài khoản.";
    }
  };

  return (
    // Card "Vô hình" để khớp Layout
    <Card className="w-full border-0 shadow-none bg-transparent transition-all duration-300">
      
      {/* HEADER DYNAMIC */}
      <CardHeader className="text-center px-0 pb-6">
        <div className="flex justify-center mb-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${tokenStatus === 'invalid' ? 'bg-red-100' : 'bg-orange-100'}`}>
            {renderHeaderIcon()}
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">{renderTitle()}</CardTitle>
        <CardDescription className="text-base mt-2">{renderDescription()}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-0">
        
        {/* TRƯỜNG HỢP 1: TOKEN HỢP LỆ -> HIỆN FORM */}
        {tokenStatus === 'valid' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {error && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in-95">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Lỗi</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Nhập mật khẩu mới"
                        {...field}
                        disabled={isSubmitting}
                        className="h-11 bg-background"
                      />
                    </FormControl>
                    <div className="pt-1">
                      <PasswordStrength password={field.value} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Nhập lại để xác nhận"
                        {...field}
                        disabled={isSubmitting}
                        className="h-11 bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-500 mt-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Xác nhận thay đổi"
                )}
              </Button>
            </form>
          </Form>
        )}

        {/* TRƯỜNG HỢP 2: THÀNH CÔNG -> HIỆN ALERT XANH */}
        {tokenStatus === 'success' && (
           <Alert className="border-green-200 bg-green-50 text-green-800 animate-in zoom-in-95 duration-300">
             <CheckCircle2 className="h-4 w-4 text-green-600" />
             <AlertTitle className="text-green-700 font-semibold">Thành công!</AlertTitle>
             <AlertDescription>
               Bạn sẽ được chuyển hướng đến trang Đăng nhập trong 3 giây...
             </AlertDescription>
           </Alert>
        )}

        {/* TRƯỜNG HỢP 3: INVALID -> HIỆN ALERT ĐỎ */}
        {tokenStatus === 'invalid' && (
           <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Yêu cầu không hợp lệ</AlertTitle>
             <AlertDescription>{error || "Link reset này đã hết hạn hoặc không tồn tại."}</AlertDescription>
           </Alert>
        )}

      </CardContent>

      <CardFooter className="justify-center px-0 pb-0">
        {/* Nút quay lại chỉ hiện khi không phải đang loading */}
        {tokenStatus !== 'loading' && (
          <div className="text-center text-sm">
            <Link
              href="/login"
              className="font-semibold text-orange-600 hover:text-orange-500 hover:underline flex items-center justify-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        )}
      </CardFooter>

    </Card>
  );
}