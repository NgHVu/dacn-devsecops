"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { isAxiosError } from "axios";

const OTP_LIFESPAN_SECONDS = 180;
const PENDING_VERIFICATION_KEY = "pendingVerification"; 

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Wrapper Suspense
export default function VerifyPageWrapper() {
  return (
    <Suspense fallback={
       <div className="w-full flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
       </div>
    }>
       <VerifyPage />
    </Suspense>
  )
}

function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const otpInputRef = useRef<HTMLInputElement>(null);

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // <--- THÊM STATE NÀY
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(OTP_LIFESPAN_SECONDS);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const email = searchParams.get("email") || "";

  // 1. Logic đếm ngược
  useEffect(() => {
    // Nếu đã thành công thì không cần chạy countdown nữa để tránh UI giật
    if (isSuccess) return; 

    const calculateRemainingTime = () => {
      const pendingData = localStorage.getItem(PENDING_VERIFICATION_KEY);

      if (!pendingData) {
        setCountdown(0);
        return;
      }

      try {
        const { expiry } = JSON.parse(pendingData);
        const remainingTimeMs = Number(expiry) - Date.now();
        const remainingTimeSec = Math.max(0, Math.floor(remainingTimeMs / 1000));
        
        setCountdown(remainingTimeSec);

        if (remainingTimeSec <= 0) {
          localStorage.removeItem(PENDING_VERIFICATION_KEY); 
        }
      } catch(e) {
        localStorage.removeItem(PENDING_VERIFICATION_KEY);
        setCountdown(0);
      }
    };

    calculateRemainingTime();
    const interval: NodeJS.Timeout = setInterval(calculateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [isResending, isSuccess]); // Thêm dependency isSuccess

  // Auto focus vào ô nhập đầu tiên khi tải trang
  useEffect(() => {
    const timer = setTimeout(() => {
        otpInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 2. Xử lý xác thực
  const handleVerify = async (finalOtp: string) => {
    if (isLoading || isSuccess) return; 
    
    setIsLoading(true);
    setError(null);
    setResendMessage(null);

    // Chỉ check countdown nếu chưa success
    if (countdown <= 0) {
        setError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        setIsLoading(false);
        return;
    }

    if (!email || finalOtp.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      setIsLoading(false);
      setTimeout(() => otpInputRef.current?.focus(), 50);
      return;
    }

    try {
      const data = await authService.verifyAccount({ email, otp: finalOtp }); 
      
      // --- KHẮC PHỤC TẠI ĐÂY ---
      setIsSuccess(true); // 1. Đánh dấu thành công ngay lập tức
      localStorage.removeItem(PENDING_VERIFICATION_KEY); 
      
      await login(data.accessToken);
      router.push("/"); 
    } catch (err) {
      console.error("Lỗi khi xác thực OTP:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.response?.data || "Mã OTP không hợp lệ.";
      }
      
      setError(errorMessage);
      setOtp(""); 
      setIsLoading(false); 

      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 50);
    }
  };

  // 3. Xử lý gửi lại mã
  const handleResendOtp = async () => {
    if (isResending || countdown > 0 || isSuccess) return;

    setIsResending(true);
    setError(null);
    setResendMessage(null);
    setOtp(""); 
    
    setTimeout(() => otpInputRef.current?.focus(), 50);

    if (!email) {
      setError("Không tìm thấy email để gửi lại mã.");
      setIsResending(false);
      return;
    }
    try {
      const message = await authService.resendOtp(email);
      setResendMessage(message); 
      
      const newExpiry = Date.now() + OTP_LIFESPAN_SECONDS * 1000;
      const verificationData = {
        email: email, 
        expiry: newExpiry,
      };
      localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(verificationData));
      
      // Reset countdown state ngay lập tức để UI cập nhật
      setCountdown(OTP_LIFESPAN_SECONDS);

    } catch (err) {
      console.error("Lỗi khi gửi lại OTP:", err);
      let errorMessage = "Không thể gửi lại mã OTP.";
      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.response?.data || "Lỗi gửi lại mã.";
      }
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (error) setError(null); 
  }

  const handleChangeEmail = () => {
    localStorage.removeItem(PENDING_VERIFICATION_KEY); 
    router.push("/register");
  };
  
  return (
    <Card className="w-full border-0 shadow-none bg-transparent transition-all">
      <CardHeader className="text-center px-0 pb-2">
        <div className="flex justify-center mb-4">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center animate-pulse ${isSuccess ? 'bg-green-100' : 'bg-orange-100'}`}>
            {isSuccess ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
                <ShieldCheck className="h-8 w-8 text-orange-600" />
            )}
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Xác thực tài khoản</CardTitle>
        <CardDescription className="text-base mt-2">
          Nhập mã 6 số chúng tôi vừa gửi đến
          <br />
          <span className="font-semibold text-foreground bg-orange-100 px-2 py-0.5 rounded">{email || "email của bạn"}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-4 px-0">
        
        {error && (
          <Alert variant="destructive" className="animate-in fade-in zoom-in-95 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi xác thực</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {resendMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800 animate-in zoom-in-95">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 font-semibold">Đã gửi lại mã!</AlertTitle>
            <AlertDescription>{resendMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* INPUT OTP */}
        <div className="flex flex-col items-center gap-6">
          <InputOTP
            ref={otpInputRef}
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            onComplete={handleVerify}
            disabled={isLoading || isResending || isSuccess} // Disable khi success
            className="gap-2"
          >
            <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                     <InputOTPSlot 
                        key={index}
                        index={index} 
                        className={`h-12 w-10 sm:w-12 border-gray-300 text-lg shadow-sm ${
                            isSuccess 
                            ? 'border-green-500 ring-green-500 text-green-600 bg-green-50' 
                            : 'focus:border-orange-500 focus:ring-orange-500'
                        }`} 
                     />
                ))}
            </InputOTPGroup>
          </InputOTP>
          
          <div className="min-h-[20px]">
            {isSuccess ? (
               // --- HIỂN THỊ TRẠNG THÁI THÀNH CÔNG ---
               <p className="text-sm font-medium text-green-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Xác thực thành công! Đang chuyển hướng...
               </p>
            ) : countdown > 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Hết hạn sau: <span className="font-bold text-orange-600 tabular-nums">{formatTime(countdown)}</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Mã OTP đã hết hạn
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 px-0 pb-0">
        <Button 
          className={`w-full h-11 text-base font-semibold ${isSuccess ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'}`}
          onClick={() => handleVerify(otp)}
          disabled={isLoading || isResending || otp.length < 6 || isSuccess}
        >
          {isLoading || isSuccess ? (
            <>
              {isSuccess ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSuccess ? "Đã xác thực" : "Đang kiểm tra..."}
            </>
          ) : (
            "Xác thực ngay"
          )}
        </Button>
        
        <div className="flex justify-between items-center w-full text-sm px-2">
          <button
            className="text-muted-foreground hover:text-orange-600 transition-colors flex items-center gap-1"
            onClick={handleChangeEmail}
            disabled={isLoading || isResending || isSuccess}
          >
            <ChevronLeft className="h-3 w-3" />
            Đổi email
          </button>

          <button
            className={`font-medium transition-colors ${
              countdown > 0 || isLoading || isResending || isSuccess
                ? "text-muted-foreground cursor-not-allowed opacity-50"
                : "text-orange-600 hover:text-orange-500 hover:underline"
            }`}
            onClick={handleResendOtp}
            disabled={isLoading || isResending || countdown > 0 || isSuccess} 
          >
            {isResending ? "Đang gửi lại..." : "Gửi lại mã mới"}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}