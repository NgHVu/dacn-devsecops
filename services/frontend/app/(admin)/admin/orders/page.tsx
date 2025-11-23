"use client";

import React, { useEffect, useState, useCallback } from "react";
import { orderService } from "@/services/orderService";
import { Order } from "@/types/order";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PackageSearch, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { OrderTableSkeleton } from "@/components/skeletons/OrderTableSkeleton";
import { Button } from "@/components/ui/button";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10; 

  const fetchOrders = useCallback(async (pageIndex: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await orderService.getAllOrders(pageIndex, PAGE_SIZE);
      
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number);
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      setError("Không thể tải danh sách đơn hàng.");
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
        </div>
        <OrderTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p>{error}</p>
            <Button onClick={() => fetchOrders(0)} className="mt-4">Thử lại</Button>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-muted-foreground">
            Theo dõi và xử lý trạng thái các đơn hàng trong hệ thống.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Mã đơn</TableHead>
              <TableHead>Khách hàng (ID)</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                      <PackageSearch className="h-8 w-8 opacity-50" />
                      <p>Chưa có đơn hàng nào.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                      <div className="flex flex-col">
                          <span className="text-sm font-medium">User #{order.userId}</span>
                          <span className="text-xs text-muted-foreground">{order.items.length} món</span>
                      </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    {formatPrice(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderActions 
                      order={order} 
                      onStatusChanged={() => fetchOrders(currentPage)} 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControl 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}