"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isAxiosError } from "axios";
import { AlertCircle, CheckCircle2, Loader2, ChevronLeft, ShoppingBag, Mail } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email({
    message: "Email không đúng định dạng.", 
  }),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); 
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const message = await authService.forgotPassword(values);
      setSuccessMessage(message || "Link đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email.");
    } catch (err) {
      console.error("Lỗi khi yêu cầu reset mật khẩu:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = "Email này chưa được đăng ký trong hệ thống.";
        } else if (err.response?.data) {
          errorMessage = err.response.data.message || err.response.data;
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
    // Card "Vô hình" để khớp Layout
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="text-center px-0 pb-6">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            {/* Nếu thành công hiện icon Mail, chưa thì hiện Key/Bag */}
            {successMessage ? (
                 <Mail className="h-6 w-6 text-orange-600 animate-bounce" />
            ) : (
                 <ShoppingBag className="h-6 w-6 text-orange-600" />
            )}
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">
          {successMessage ? "Đã gửi Email" : "Quên mật khẩu?"}
        </CardTitle>
        <CardDescription className="text-base mt-2">
          {successMessage 
            ? "Vui lòng kiểm tra hộp thư đến (và cả mục Spam) để lấy lại mật khẩu." 
            : "Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-0">
          {/* ALERT THÀNH CÔNG */}
          {successMessage && (
            <Alert className="border-green-200 bg-green-50 text-green-800 animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 font-semibold">Hoàn tất!</AlertTitle>
              <AlertDescription>
                Link xác nhận đã được gửi đến <strong>{form.getValues("email")}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* ALERT LỖI */}
          {error && !successMessage && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Yêu cầu thất bại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* FORM: Chỉ hiển thị khi CHƯA thành công */}
          {!successMessage && (
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

                  <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-500" 
                      disabled={isLoading}
                  >
                  {isLoading ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                      </>
                  ) : (
                      "Gửi link khôi phục"
                  )}
                  </Button>
              </form>
              </Form>
          )}
      </CardContent>

      <CardFooter className="justify-center px-0 pb-0">
          <div className="text-center text-sm">
          <Link
              href="/login"
              className="font-semibold text-orange-600 hover:text-orange-500 hover:underline flex items-center justify-center gap-1"
          >
              <ChevronLeft className="h-4 w-4" />
              Quay lại đăng nhập
          </Link>
          </div>
      </CardFooter>
    </Card>
  );
}