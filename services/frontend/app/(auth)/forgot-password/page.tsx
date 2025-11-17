"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { isAxiosError } from "axios";

const formSchema = z.object({
  email: z.string().email({
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
      setSuccessMessage(message);
    } catch (err) {
      console.error("Lỗi khi yêu cầu reset mật khẩu:", err);
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = err.response.data || "Email này chưa được đăng ký.";
          form.setError("email", { type: "server", message: errorMessage });
        } else if (err.response?.data) {
          errorMessage = err.response.data.message || err.response.data;
          setError(errorMessage);
        }
      } else {
         setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
          <CardDescription>
            Nhập email của bạn.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate> 
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
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder="example@gmail.com" 
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage /> 
                      </FormItem>
                    )}
                  />
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

            <CardFooter className="flex flex-col gap-4 pt-6">
              {!successMessage && (
                <Button
                  type="submit"
                  className="w-full"
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
            
          </form>
        </Form>
      </Card>
  );
}