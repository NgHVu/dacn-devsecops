"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService"; 
import { useAuth } from "@/context/AuthContext";
import { isAxiosError } from "axios";

const RESEND_COOLDOWN = 60; 

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer); 
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    setResendMessage(null); // Xóa thông báo gửi lại (nếu có)

    if (!email || otp.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await authService.verifyAccount({ email, otp });
      await login(data.accessToken);
      router.push("/"); 

    } catch (err) {
      console.error("Lỗi khi xác thực OTP:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (isAxiosError(err)) {
        errorMessage = err.response?.data || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Hàm xử lý khi nhấn "Gửi lại mã"
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return; 

    setIsResending(true); 
    setError(null);
    setResendMessage(null);

    if (!email) {
      setError("Không tìm thấy email để gửi lại mã.");
      setIsResending(false);
      return;
    }

    try {
      const message = await authService.resendOtp(email);
      
      setResendMessage(message); 
      setResendCooldown(RESEND_COOLDOWN); 

    } catch (err) {
      console.error("Lỗi khi gửi lại OTP:", err);
      let errorMessage = "Không thể gửi lại mã OTP.";
      if (isAxiosError(err)) {
        errorMessage = err.response?.data || "Không thể gửi lại mã vào lúc này.";
      }
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Xác thực Email</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi mã 6 chữ số đến <strong>{email}</strong>.
            Vui lòng nhập mã vào ô bên dưới.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Alert Lỗi */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đã xảy ra lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Alert Thành công (chỉ cho việc gửi lại) */}
          {resendMessage && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>{resendMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              disabled={isLoading || isResending} 
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            onClick={handleVerify} 
            disabled={isLoading || isResending || otp.length < 6}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Xác thực"
            )}
          </Button>
          
          <div className="text-center text-sm">
            Chưa nhận được mã?{" "}
            <button
              className="font-medium text-primary underline disabled:cursor-not-allowed disabled:text-muted-foreground"
              onClick={handleResendOtp}
              disabled={isLoading || isResending || resendCooldown > 0}
            >
              {isResending ? "Đang gửi..." : (resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : "Gửi lại mã")}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}