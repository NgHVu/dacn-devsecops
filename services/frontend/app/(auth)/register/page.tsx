"use client";

import React, { useState, useEffect, useRef } from "react";
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
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { isAxiosError } from "axios";

const OTP_LIFESPAN = 180; 

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const otpInputRef = useRef<HTMLInputElement>(null);

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(OTP_LIFESPAN);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer); 
  }, [countdown]);

  useEffect(() => {
    otpInputRef.current?.focus();
  }, []);

  const handleVerify = async (finalOtp: string) => {
    if (isLoading) return; 
    
    setIsLoading(true);
    setError(null);
    setResendMessage(null);

    if (countdown <= 0) {
       setError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
       setIsLoading(false);
       return;
    }

    if (!email || finalOtp.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await authService.verifyAccount({ email, otp: finalOtp }); 
      await login(data.accessToken);
      router.push("/");
    } catch (err) {
      console.error("Lỗi khi xác thực OTP:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (isAxiosError(err)) {
        errorMessage = err.response?.data || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      }
      setError(errorMessage);
      setOtp(""); 
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending || countdown > 0) return;

    setIsResending(true);
    setError(null);
    setResendMessage(null);
    setOtp(""); 

    if (!email) {
      setError("Không tìm thấy email để gửi lại mã.");
      setIsResending(false);
      return;
    }
    try {
      const message = await authService.resendOtp(email);
      setResendMessage(message); 
      setCountdown(OTP_LIFESPAN); 
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

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (error) {
      setError(null); 
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Xác thực Email</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi mã OTP đến mail của bạn.
            Vui lòng nhập mã vào ô bên dưới.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Xác thực thất bại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {resendMessage && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>{resendMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col items-center gap-4"> 
            <InputOTP
              ref={otpInputRef}
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              onComplete={handleVerify}
              disabled={isLoading || isResending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Mã sẽ hết hạn sau: <span className="font-medium text-primary">{formatTime(countdown)}</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-destructive">
                Mã OTP đã hết hạn.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            onClick={() => handleVerify(otp)}
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
              disabled={isLoading || isResending || countdown > 0} 
            >
              {isResending ? "Đang gửi..." : "Gửi lại mã"}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}