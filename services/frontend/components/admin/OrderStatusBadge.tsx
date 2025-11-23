import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils"; 

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const styles: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
    [OrderStatus.CONFIRMED]: "bg-blue-100 text-blue-800 border-blue-200",
    [OrderStatus.SHIPPING]: "bg-purple-100 text-purple-800 border-purple-200",
    [OrderStatus.DELIVERED]: "bg-green-100 text-green-800 border-green-200",
    [OrderStatus.CANCELLED]: "bg-red-100 text-red-800 border-red-200",
  };

  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Chờ xử lý",
    [OrderStatus.CONFIRMED]: "Đã xác nhận",
    [OrderStatus.SHIPPING]: "Đang giao",
    [OrderStatus.DELIVERED]: "Hoàn thành",
    [OrderStatus.CANCELLED]: "Đã hủy",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      styles[status] || "bg-gray-100 text-gray-800"
    )}>
      {labels[status] || status}
    </span>
  );
}