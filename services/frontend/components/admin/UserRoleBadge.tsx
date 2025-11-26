import React from "react";
import { ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRoleBadgeProps {
  role: string;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const isAdmin = role === "ROLE_ADMIN";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border gap-1.5 shadow-sm",
        isAdmin
          ? "bg-red-100 text-red-700 border-red-200"
          : "bg-blue-50 text-blue-700 border-blue-200"
      )}
    >
      {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {isAdmin ? "Quản trị viên" : "Khách hàng"}
    </span>
  );
}