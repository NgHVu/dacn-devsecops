import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  CheckCircle2, 
  Truck, 
  PackageCheck, 
  XCircle,
  ChefHat 
} from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function UserOrderStatusBadge({ status }: OrderStatusBadgeProps) {
  
  // Cấu hình Style + Icon + Label cho từng trạng thái
  const config: Record<OrderStatus, { 
    style: string; 
    icon: React.ElementType; 
    label: string;
    animate?: boolean;
  }> = {
    [OrderStatus.PENDING]: {
      style: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 ring-yellow-500/20",
      icon: Clock,
      label: "Chờ xử lý"
    },
    [OrderStatus.CONFIRMED]: {
      style: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20 ring-blue-500/20",
      icon: ChefHat, // Dùng mũ đầu bếp thay vì check, ý nghĩa là "Đang nấu/Chuẩn bị"
      label: "Đã xác nhận"
    },
    [OrderStatus.SHIPPING]: {
      style: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20 ring-purple-500/20",
      icon: Truck,
      label: "Đang giao hàng",
      animate: true // Thêm hiệu ứng rung nhẹ cho xe hàng
    },
    [OrderStatus.DELIVERED]: {
      style: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20 ring-green-500/20",
      icon: PackageCheck,
      label: "Hoàn thành"
    },
    [OrderStatus.CANCELLED]: {
      style: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20 ring-red-500/20",
      icon: XCircle,
      label: "Đã hủy"
    },
  };

  const current = config[status] || {
    style: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20",
    icon: Clock,
    label: status
  };

  const Icon = current.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ring-1 ring-inset transition-colors",
      current.style
    )}>
      <Icon className={cn("h-3.5 w-3.5", current.animate && "animate-pulse")} />
      {current.label}
    </span>
  );
}