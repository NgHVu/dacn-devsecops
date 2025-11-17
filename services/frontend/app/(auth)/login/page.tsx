"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(values);
      
      console.log("Đăng nhập thành công!", data);
      
      await login(data.accessToken);

      router.push("/");

    } catch (err) {
      console.error(err);
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error("Thiếu cấu hình Google Client ID hoặc Redirect URI");
      setError("Đăng nhập Google hiện không khả dụng. Vui lòng thử lại sau.");
      return;
    }

    const scope = "openid email profile";
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scope,
        access_type: "offline",
        prompt: "consent",
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
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Đăng nhập thất bại</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
              
              <Button
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
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