"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isAxiosError } from "axios";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Tên phải có ít nhất 2 ký tự.",
    }),
    email: z.string().email({
      message: "Email không đúng định dạng.",
    }),
    password: z.string().min(8, {
      message: "Mật khẩu phải có ít nhất 8 ký tự.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Vui lòng xác nhận mật khẩu.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"], 
  });

const OTP_LIFESPAN_SECONDS = 180;
const PENDING_VERIFICATION_KEY = "pendingVerification";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); 

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema), 
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      // Lưu thông tin OTP
      const newExpiry = Date.now() + OTP_LIFESPAN_SECONDS * 1000;
      const verificationData = {
        email: values.email,
        expiry: newExpiry,
      };
      localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(verificationData));

      router.push(`/verify?email=${encodeURIComponent(values.email)}`);

    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          errorMessage = "Email này đã được sử dụng.";
          form.setError("email", { message: errorMessage });
        } else if (err.response?.data) {
          errorMessage = err.response.data.message || "Đăng ký thất bại.";
        }
      }
      setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFormChange = () => {
    if (error) setError(null);
  };

  return (
    // Sử dụng Card không viền để khớp với Layout
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="space-y-2 text-center px-0">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Tạo tài khoản
        </CardTitle>
        <CardDescription className="text-base">
          Tham gia cộng đồng FoodHub ngay hôm nay
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-0">
          
          {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Đăng ký thất bại</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onChange={handleFormChange} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và Tên</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Nguyễn Văn A"
                      {...field}
                      disabled={isLoading}
                      className="h-11 bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      {...field}
                      disabled={isLoading}
                      className="h-11 bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Tạo mật khẩu"
                      {...field}
                      disabled={isLoading}
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
                      placeholder="Nhập lại mật khẩu"
                      {...field}
                      disabled={isLoading}
                      className="h-11 bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <Button type="submit" className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-500 mt-2" disabled={isLoading}>
                  {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                  "Tiếp tục"
                  )}
              </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center px-0 pb-0">
          <div className="text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link
                  href="/login"
                  className="font-semibold text-orange-600 hover:text-orange-500 hover:underline"
              >
                  Đăng nhập ngay
              </Link>
          </div>
      </CardFooter>
    </Card>
  );
}