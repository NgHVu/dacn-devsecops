"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// SỬA LỖI ESLINT: Dùng 'type' alias thay vì 'interface' rỗng
export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Component Input mật khẩu chuyên biệt, tích hợp sẵn icon "con mắt"
 * để hiện/ẩn mật khẩu.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 inset-y-0 flex items-center justify-center w-10 text-muted-foreground hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          <span className="sr-only">
            {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          </span>
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };