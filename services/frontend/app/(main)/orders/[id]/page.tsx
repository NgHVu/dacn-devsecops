"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  CreditCard,
  PackageX,
  Receipt,
  Info,
} from "lucide-react";

import { orderService } from "@/services/orderService";
import type { Order } from "@/types/order";
import { OrderStatus } from "@/types/order";
import { getImageUrl, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const formatOrderDate = (dateString: string) => {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId || Number.isNaN(orderId)) return;
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin đơn hàng");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await orderService.updateOrderStatus(order.id, OrderStatus.CANCELLED);
      toast.success("Đã hủy đơn hàng thành công");
      fetchOrderDetail();
    } catch (error) {
      console.error(error);
      toast.error("Hủy đơn hàng thất bại. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: OrderStatus | string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-200">
            Chờ xử lý
          </Badge>
        );
      case OrderStatus.CONFIRMED:
        return (
          <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200">
            Đã xác nhận
          </Badge>
        );
      case OrderStatus.SHIPPING:
        return (
          <Badge variant="secondary" className="bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 border-purple-200">
            Đang giao
          </Badge>
        );
      case OrderStatus.DELIVERED:
        return (
          <Badge variant="secondary" className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-200">
            Hoàn thành
          </Badge>
        );
      case OrderStatus.CANCELLED:
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{String(status)}</Badge>;
    }
  };

  const renderPaymentStatusBadge = () => {
    const status = order?.paymentStatus?.toUpperCase();
    if (status === "PAID") {
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-600">
          Đã thanh toán
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-600">
        Chưa thanh toán
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="w-full bg-background px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl py-10 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-[200px] md:col-span-2" />
            <Skeleton className="h-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="w-full bg-background px-4 sm:px-6 lg:px-8 pb-20 animate-in fade-in duration-500">
      <div className="mx-auto max-w-5xl py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              Chi tiết đơn hàng #{order.id}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Đặt ngày {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <div className="ml-auto">{getStatusBadge(order.status)}</div>
        </div>

        {/* Content */}
        <div>
          <div className="grid gap-8 md:grid-cols-3">
            {/* LEFT: Items */}
            <div className="space-y-6 md:col-span-2">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5 text-orange-600" />
                    Danh sách món ăn
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 pt-6">
                  {order.items.map((item) => {
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border bg-muted">
                          {item.productImage ? (
                            <Image
                              src={getImageUrl(item.productImage)}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-secondary">
                              <span className="text-xs text-muted-foreground">No img</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div>
                            <h3 className="font-bold leading-none text-base">
                              {item.productName}
                            </h3>

                            {/* [UPDATED] Hiển thị Size từ trường riêng biệt - Clean Code */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {item.size && (
                                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                        Size: {item.size}
                                    </span>
                                )}
                                {item.note && (
                                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 italic">
                                        Note: {item.note}
                                    </span>
                                )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded text-xs font-medium">
                              x{item.quantity}
                            </p>
                            <p className="font-bold text-foreground">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Separator />

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-medium">Tổng tiền thanh toán</span>
                    <span className="text-xl font-extrabold text-orange-600">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {order.status === OrderStatus.PENDING && (
                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2 pl-3 pr-4 shadow-lg shadow-red-500/20">
                        <PackageX className="h-4 w-4" />
                        Hủy đơn hàng
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bạn chắc chắn muốn hủy đơn này?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Hành động này không thể hoàn tác. Đơn hàng sẽ bị hủy và không được giao đến bạn.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Đóng</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelOrder}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={cancelling}
                        >
                          {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* RIGHT: Shipping + Payment */}
            <div className="space-y-6">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    Thông tin nhận hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 text-sm pt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-full shrink-0">
                         <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="grid gap-0.5">
                      <span className="font-medium text-muted-foreground text-xs uppercase">Người nhận</span>
                      <span className="font-semibold text-foreground text-base">
                        {order.customerName || "Khách hàng"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-full shrink-0">
                        <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="grid gap-0.5">
                      <span className="font-medium text-muted-foreground text-xs uppercase">Số điện thoại</span>
                      <span className="font-semibold text-foreground text-base tracking-wide">
                        {order.phoneNumber || "---"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-full shrink-0">
                        <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="grid gap-0.5">
                      <span className="font-medium text-muted-foreground text-xs uppercase">Địa chỉ giao hàng</span>
                      <span className="font-medium text-foreground">
                        {order.shippingAddress || "---"}
                      </span>
                    </div>
                  </div>

                  {order.note && (
                    <div className="mt-2 rounded-lg bg-orange-50 p-4 text-sm text-orange-800 border border-orange-100 flex items-start gap-2">
                      <Info className="h-5 w-5 shrink-0 text-orange-600 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-1 text-orange-700">Ghi chú từ bạn:</span>
                        {order.note}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Phương thức</span>
                    <span className="font-bold">
                      {order.paymentMethod?.toUpperCase() === "VNPAY"
                        ? "Ví VNPAY / QR Code"
                        : "Thanh toán khi nhận hàng (COD)"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trạng thái</span>
                    {renderPaymentStatusBadge()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}