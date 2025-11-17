"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; 
import { useForm } from "react-hook-form"; 
import { zodResolver } from "@hookform/resolvers/zod"; 
import * as z from "zod"; 
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.34 2.06-4.1 2.06-4.92 0-8.92-4.02-8.92-8.94s4-8.94 8.92-8.94c2.6 0 4.52 1.04 5.9 2.38l-2.22 2.22c-.8-.76-1.82-1.22-3.18-1.22-3.76 0-6.82 3.06-6.82 6.84s3.06 6.84 6.82 6.84c4.32 0 6.22-3.2 6.5-4.82h-6.5v.02Z"
      fill="currentColor"
    />
  </svg>
);

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
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
        }
      }
      toast.error(message);
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

  return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate> 
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@gmail.com"
                        {...field}
                        disabled={isLoading}
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
                        placeholder="Mật khẩu của bạn"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-6">
              <div className="flex w-full justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Đăng nhập"
                )}
              </Button>
              <Button
                type="button" 
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <GoogleIcon className="mr-2 h-4 w-4" />
                Tiếp tục với Google
              </Button>
              <div className="text-center text-sm">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="font-medium text-primary underline">
                  Đăng ký ngay
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
  );
}