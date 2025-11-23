"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { type Order } from "@/types/order";
import { UserOrderStatusBadge } from "@/components/orders/UserOrderStatusBadge";
import { formatPrice } from "@/lib/utils";
import { PackageOpen, ShoppingBag, AlertTriangle } from "lucide-react"; // Bỏ Loader2
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { OrderTableSkeleton } from "@/components/skeletons/OrderTableSkeleton"; // Import Mới

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  const fetchOrders = useCallback(async (pageIndex: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await orderService.getMyOrders(pageIndex, PAGE_SIZE);
      
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number);

    } catch (err) {
      console.error("Lỗi tải lịch sử:", err);
      if (isAxiosError(err) && err.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn.");
        router.push("/login?redirect=/orders");
        return;
      }
      setError("Không thể tải lịch sử đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="container py-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Quản lý Đơn hàng
          </h1>
        </div>
        <OrderTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-24 flex flex-col items-center text-center text-red-500">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">{error}</p>
        <Button onClick={() => fetchOrders(0)} className="mt-4">Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingBag className="h-8 w-8" />
          Quản lý Đơn hàng
        </h1>
        <p className="text-muted-foreground mt-1">Theo dõi và xử lý trạng thái các đơn hàng trong hệ thống.</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg bg-muted/30">
          <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">Bạn chưa có đơn hàng nào</h2>
          <Button asChild className="mt-6">
            <Link href="/">Bắt đầu mua sắm</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[80px] font-semibold">Mã đơn</TableHead>
                  <TableHead className="font-semibold">Khách hàng (ID)</TableHead>
                  <TableHead className="font-semibold">Ngày đặt</TableHead>
                  <TableHead className="font-semibold text-right">Tổng tiền</TableHead>
                  <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50 h-16">
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col">
                         <span className="font-medium text-sm">User #{order.userId}</span>
                         <span className="text-xs text-muted-foreground">{order.items.length} món</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-green-600 text-base">
                      {formatPrice(order.totalAmount)}
                    </TableCell>

                    <TableCell className="text-center">
                      <UserOrderStatusBadge status={order.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationControl 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
    </div>
  );
}