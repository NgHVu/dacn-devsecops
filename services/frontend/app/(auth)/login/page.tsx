"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle } from "lucide-react"; 
import { FaGoogle } from "react-icons/fa";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  email: z.string().email({
    message: "Email không đúng định dạng.",
  }),
  password: z.string().min(1, {
    message: "Vui lòng nhập mật khẩu.",
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setAuthError(null); 
    try {
      const data = await authService.login(values);
      await login(data.accessToken);
      toast.success("Đăng nhập thành công!");
      
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      let message = "Đã xảy ra lỗi. Vui lòng thử lại.";
      
      if (isAxiosError(err)) {
        if (err.response?.status === 400 || err.response?.status === 401) {
          message = "Email hoặc mật khẩu không đúng.";
        } else if (err.response?.data?.message) {
            message = err.response.data.message;
        }
      }
      
      setAuthError(message); 
      toast.error(message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error("Thiếu cấu hình Google Client ID hoặc Redirect URI");
      toast.error("Đăng nhập Google hiện không khả dụng.");
      return;
    }

    const redirectUrl = searchParams.get("redirect") || "/";
    const state = btoa(JSON.stringify({ redirect: redirectUrl }));

    const scope = "openid email profile";
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scope,
        access_type: "offline",
        prompt: "consent",
        state: state,
      }
    )}`;

    window.location.href = googleAuthUrl;
  };

  const handleFormChange = () => {
      if (authError) setAuthError(null);
  };

  return (
    // Card Container: border-0 shadow-none để hòa nhập vào Layout
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="space-y-2 text-center px-0">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-base">
          Nhập email và mật khẩu để truy cập tài khoản của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-0">
        
        {/* Thông báo lỗi */}
        {authError && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi đăng nhập</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onChange={handleFormChange} className="space-y-4">
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
                  <div className="flex items-center justify-between">
                      <FormLabel>Mật khẩu</FormLabel>
                      <Link
                          href="/forgot-password"
                          className="text-sm font-medium text-orange-600 hover:text-orange-500 hover:underline"
                          tabIndex={-1}
                      >
                          Quên mật khẩu?
                      </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      placeholder="Nhập mật khẩu"
                      {...field}
                      disabled={isLoading}
                      className="h-11 bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-500" disabled={isLoading}>
                {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                "Đăng nhập"
                )}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
          Google
        </Button>

      </CardContent>
      
      <CardFooter className="justify-center px-0 pb-0">
        <div className="text-sm text-muted-foreground">
          Bạn chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500 hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}