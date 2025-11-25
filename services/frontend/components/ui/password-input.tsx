"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// SỬA LỖI ESLINT: Dùng 'type' alias thay vì 'interface' rỗng
export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Component Input mật khẩu chuyên biệt
 * - Tự động căn giữa icon theo chiều dọc (h-full)
 * - Bỏ qua tab index cho nút ẩn/hiện
 * - Xử lý ẩn icon mặc định của trình duyệt
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    
    // Disable nút mắt nếu input bị disable
    const disabled = props.disabled;

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("hide-password-toggle pr-10", className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          // QUAN TRỌNG: Bỏ qua nút này khi nhấn Tab
          tabIndex={-1}
        >
          {showPassword ? (
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          </span>
        </Button>

        {/* Ẩn icon con mắt mặc định của Edge/IE */}
        <style jsx>{`
          .hide-password-toggle::-ms-reveal,
          .hide-password-toggle::-ms-clear {
            visibility: hidden;
            pointer-events: none;
            display: none;
          }
        `}</style>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };