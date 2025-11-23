import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function UserOrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const styles: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "bg-yellow-50 text-yellow-700 border-yellow-200 ring-1 ring-yellow-600/20",
    [OrderStatus.CONFIRMED]: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-600/20",
    [OrderStatus.SHIPPING]: "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-600/20",
    [OrderStatus.DELIVERED]: "bg-green-50 text-green-700 border-green-200 ring-1 ring-green-600/20", 
    [OrderStatus.CANCELLED]: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-600/20", 
  };

  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Chờ xử lý",
    [OrderStatus.CONFIRMED]: "Đã xác nhận",
    [OrderStatus.SHIPPING]: "Đang giao hàng",
    [OrderStatus.DELIVERED]: "Hoàn thành",
    [OrderStatus.CANCELLED]: "Đã hủy",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      styles[status] || "bg-gray-50 text-gray-600"
    )}>
      {labels[status] || status}
    </span>
  );
}