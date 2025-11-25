"use client";

import React, { useEffect, useState, useCallback } from "react";
import { orderService } from "@/services/orderService";
import { Order } from "@/types/order";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { 
  PackageSearch, 
  AlertCircle, 
  Search, 
  RotateCcw, 
  User, 
  CalendarClock,
  ShoppingBag
} from "lucide-react";

// Custom Components
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import { PaginationControl } from "@/components/ui/PaginationControl";

// --- HELPER: FORMAT DATE ---
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  // Vì Backend trả về LocalDateTime (không có Z ở cuối), browser sẽ hiểu là Local Time.
  // Sau khi fix Docker TZ, Local Time của Server = Giờ VN -> Hiển thị đúng.
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false // Dùng định dạng 24h (14:30 thay vì 2:30 PM)
  }).format(date);
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10; 

  // Search State (UI only)
  const [searchQuery, setSearchQuery] = useState("");

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
      setError("Không thể kết nối đến hệ thống đơn hàng.");
      toast.error("Lỗi tải dữ liệu đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const handleRefresh = () => {
    fetchOrders(currentPage);
    toast.info("Đang cập nhật trạng thái đơn hàng...");
  };

  return (
    <div className="space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đơn hàng</h1>
          <p className="text-muted-foreground">
            Theo dõi, xử lý và cập nhật trạng thái giao hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Cập nhật
          </Button>
        </div>
      </div>

      {/* --- MAIN CARD --- */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="p-4 sm:p-6 border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Danh sách đơn
            </CardTitle>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo mã đơn, khách hàng..."
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[100px] pl-6">Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Thời gian đặt</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right pr-6">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                // --- SKELETON LOADING ---
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 mx-auto rounded-full" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                // --- ERROR STATE ---
                <TableRow>
                   <TableCell colSpan={6} className="h-60 text-center">
                      <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={() => fetchOrders(0)}>Thử lại</Button>
                      </div>
                   </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                // --- EMPTY STATE ---
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <PackageSearch className="h-10 w-10 opacity-20" />
                      <p>Chưa có đơn hàng nào trong hệ thống.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // --- DATA ROWS ---
                orders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                    
                    <TableCell className="pl-6 font-medium text-gray-900">
                        #{order.id}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">User #{order.userId}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {order.items.length} sản phẩm
                            </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            {/* ÁP DỤNG FORMAT DATE MỚI */}
                            {formatDate(order.createdAt)}
                        </div>
                    </TableCell>
                    
                    <TableCell className="font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <OrderStatusBadge status={order.status} />
                    </TableCell>

                    <TableCell className="text-right pr-6">
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
        </CardContent>

        {/* --- FOOTER PAGINATION --- */}
        {!isLoading && !error && orders.length > 0 && (
            <CardFooter className="border-t bg-gray-50/50 py-4 flex justify-center">
                 <PaginationControl 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
            </CardFooter>
        )}
      </Card>
    </div>
  );
}