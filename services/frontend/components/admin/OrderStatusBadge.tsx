import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils"; 
// [FIX] Import thêm type LucideIcon
import { CheckCircle2, Clock, Truck, XCircle, PackageCheck, type LucideIcon } from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  // [FIX] Thay 'any' bằng 'LucideIcon'
  const config: Record<OrderStatus, { color: string; icon: LucideIcon; label: string }> = {
    [OrderStatus.PENDING]: { 
        color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
        icon: Clock, 
        label: "Chờ xử lý" 
    },
    [OrderStatus.CONFIRMED]: { 
        color: "bg-blue-100 text-blue-700 border-blue-200", 
        icon: PackageCheck, 
        label: "Đã xác nhận" 
    },
    [OrderStatus.SHIPPING]: { 
        color: "bg-purple-100 text-purple-700 border-purple-200", 
        icon: Truck, 
        label: "Đang giao" 
    },
    [OrderStatus.DELIVERED]: { 
        color: "bg-green-100 text-green-700 border-green-200", 
        icon: CheckCircle2, 
        label: "Hoàn thành" 
    },
    [OrderStatus.CANCELLED]: { 
        color: "bg-red-100 text-red-700 border-red-200", 
        icon: XCircle, 
        label: "Đã hủy" 
    },
  };

  const { color, icon: Icon, label } = config[status] || { color: "bg-gray-100", icon: Clock, label: status };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border gap-1.5",
      color
    )}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}