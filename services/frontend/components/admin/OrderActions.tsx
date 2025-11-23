"use client";

import { useState } from "react";
import { Order, OrderStatus } from "@/types/order";
import { orderService } from "@/services/orderService";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, CheckCircle2, Truck, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OrderActionsProps {
  order: Order;
  onStatusChanged: () => void;
}

export function OrderActions({ order, onStatusChanged }: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  const handleSelectAction = (status: OrderStatus) => {
    setTargetStatus(status);
    setIsAlertOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!targetStatus) return;

    try {
      setIsLoading(true);
      await orderService.updateOrderStatus(order.id, targetStatus);
      toast.success(`Cập nhật trạng thái thành công: ${targetStatus}`);
      onStatusChanged(); 
    } catch (error) {
      console.error(error);
      toast.error("Lỗi: Không thể cập nhật trạng thái (Có thể do vi phạm luồng)");
    } finally {
      setIsLoading(false);
      setIsAlertOpen(false); 
    }
  };

  const getDialogContent = () => {
    switch (targetStatus) {
      case OrderStatus.CONFIRMED:
        return {
          title: "Duyệt đơn hàng này?",
          desc: "Bạn xác nhận đơn hàng hợp lệ và chuyển sang khâu chuẩn bị?",
          action: "Duyệt đơn",
          color: "bg-blue-600 hover:bg-blue-700"
        };
      case OrderStatus.SHIPPING:
        return {
          title: "Bắt đầu giao hàng?",
          desc: "Đơn hàng sẽ được chuyển cho đơn vị vận chuyển?",
          action: "Giao hàng",
          color: "bg-purple-600 hover:bg-purple-700"
        };
      case OrderStatus.DELIVERED:
        return {
          title: "Xác nhận giao thành công?",
          desc: "Đơn hàng đã đến tay khách và đã thu tiền?",
          action: "Hoàn tất",
          color: "bg-green-600 hover:bg-green-700"
        };
      case OrderStatus.CANCELLED:
        return {
          title: "Hủy đơn hàng này?",
          desc: "Hành động này không thể hoàn tác. Khách hàng sẽ nhận được thông báo hủy.",
          action: "Hủy đơn",
          color: "bg-red-600 hover:bg-red-700"
        };
      default:
        return { title: "Xác nhận", desc: "Bạn có chắc chắn?", action: "Đồng ý", color: "" };
    }
  };

  const dialogInfo = getDialogContent();

  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
    return <span className="text-muted-foreground text-xs italic">Đã đóng</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Mở menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Xử lý đơn hàng</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {order.status === OrderStatus.PENDING && (
            <DropdownMenuItem onClick={() => handleSelectAction(OrderStatus.CONFIRMED)}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
              Duyệt đơn
            </DropdownMenuItem>
          )}

          {order.status === OrderStatus.CONFIRMED && (
            <DropdownMenuItem onClick={() => handleSelectAction(OrderStatus.SHIPPING)}>
              <Truck className="mr-2 h-4 w-4 text-purple-600" />
              Giao hàng
            </DropdownMenuItem>
          )}

          {order.status === OrderStatus.SHIPPING && (
             <DropdownMenuItem onClick={() => handleSelectAction(OrderStatus.DELIVERED)}>
               <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
               Hoàn tất đơn
             </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem 
              onClick={() => handleSelectAction(OrderStatus.CANCELLED)}
              className="text-red-600 focus:text-red-600"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Hủy đơn hàng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogInfo.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogInfo.desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Bỏ qua</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                handleConfirmAction();
              }}
              disabled={isLoading}
              className={dialogInfo.color}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogInfo.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}