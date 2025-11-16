"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { isAxiosError } from "axios";

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!validateEmail(email)) {
      setError("Vui lòng nhập email đúng định dạng.");
      return; 
    }
    
    setIsLoading(true);

    try {
      const message = await authService.forgotPassword({ email });
      setSuccessMessage(message);
    } catch (err) {
      console.error("Lỗi khi yêu cầu reset mật khẩu:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = err.response.data || "Email này chưa được đăng ký.";
        } else if (err.response?.data) {
          errorMessage = err.response.data.message || err.response.data;
        }
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
          <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
          <CardDescription>
            Nhập email của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!successMessage && (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Yêu cầu thất bại</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {successMessage && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Kiểm tra Email của bạn</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {!successMessage && (
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Gửi link Reset"
              )}
            </Button>
          )}

          <div className="text-center text-sm">
            <Link
              href="/login"
              className="font-medium text-primary underline"
            >
              Quay lại trang Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}