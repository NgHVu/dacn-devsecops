"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { type Order, OrderStatus } from "@/types/order";
// Đã xóa import trùng và gộp import Product vào
import { type Product } from "@/types/product"; 
import { UserOrderStatusBadge } from "@/components/orders/UserOrderStatusBadge";
import { formatPrice } from "@/lib/utils";
import {
  PackageOpen,
  ShoppingBag,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { OrderTableSkeleton } from "@/components/skeletons/OrderTableSkeleton";
import { FadeIn } from "@/components/animations/FadeIn"; 
import { useCart } from "@/context/CartContext";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { addToCart } = useCart();

  const [reorderingId, setReorderingId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;
  
  type FilterType = OrderStatus | "ALL";
  const [filter, setFilter] = useState<FilterType>("ALL");

  const fetchOrders = useCallback(
    async (pageIndex: number) => {
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
    },
    [router]
  );

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(dateString));
  };

  const filteredOrders = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  // [UPDATED] Logic Mua lại
  const handleReorder = async (order: Order) => {
    if (reorderingId !== null) return;
    setReorderingId(order.id);
    const toastId = toast.loading("Đang chuẩn bị món ăn...");

    try {
      const promises = order.items.map(async (item) => {
        try {
            // Ép kiểu Number để đảm bảo API nhận đúng ID
            const product = await productService.getProductById(Number(item.productId));
            
            // Kiểm tra kỹ product có tồn tại không
            if (!product) return null;

            return { product, quantity: item.quantity };
        } catch (e) {
            console.warn(`Sản phẩm ID ${item.productId} không còn tồn tại hoặc lỗi API.`);
            return null;
        }
      });

      const results = await Promise.all(promises);
      
      const validItems = results.filter((item) => item !== null) as { product: Product, quantity: number }[];

      // Tắt loading toast ngay khi có kết quả
      toast.dismiss(toastId);

      if (validItems.length === 0) {
          toast.error("Các món trong đơn này hiện không còn kinh doanh.");
          return;
      }

      // Thêm vào giỏ - CartContext sẽ tự lo việc hiển thị hình ảnh
      // Nếu hình ảnh vẫn lỗi, hãy kiểm tra lại field 'image' của sản phẩm này trong Database
      validItems.forEach(({ product, quantity }) => {
          addToCart(product, quantity);
      });

      // Chuyển hướng
      router.push("/cart");
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Có lỗi xảy ra khi mua lại.");
    } finally {
      setReorderingId(null);
    }
  };

  if (isLoading) return (
    <div className="container py-12 max-w-6xl mx-auto px-4">
        <div className="space-y-4 mb-8">
            <div className="h-8 w-48 bg-muted rounded-md animate-pulse"/>
            <div className="h-4 w-96 bg-muted rounded-md animate-pulse"/>
        </div>
        <OrderTableSkeleton />
    </div>
  );

  if (error) return (
    <div className="container py-24 flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Đã có lỗi xảy ra</h2>
      <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
      <Button onClick={() => fetchOrders(0)} className="mt-8 bg-orange-600 hover:bg-orange-500 text-white" size="lg">
        <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl min-h-screen">
      <FadeIn>
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
                    <span className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-2xl text-orange-600">
                        <ShoppingBag className="h-8 w-8" />
                    </span>
                    Lịch sử đơn hàng
                </h1>
                <p className="text-muted-foreground mt-3 text-lg pl-1">
                    Quản lý và theo dõi các món ngon bạn đã đặt.
                </p>
            </div>
            {orders.length > 0 && (
                <Button asChild variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20">
                    <Link href="/">Tiếp tục mua sắm <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            )}
        </div>

        {/* FILTER TABS */}
        <div className="flex flex-wrap gap-2 mb-8 pb-2 border-b border-border/50">
            {[
            { key: "ALL", label: "Tất cả" },
            { key: OrderStatus.PENDING, label: "Chờ xử lý" },
            { key: OrderStatus.CONFIRMED, label: "Đã xác nhận" },
            { key: OrderStatus.SHIPPING, label: "Đang giao" },
            { key: OrderStatus.DELIVERED, label: "Hoàn thành" },
            { key: OrderStatus.CANCELLED, label: "Đã hủy" },
            ].map((tab) => (
            <button
                key={tab.key}
                onClick={() => setFilter(tab.key as FilterType)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filter === tab.key 
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
                {tab.label}
            </button>
            ))}
        </div>

        {/* CONTENT SECTION */}
        {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-muted/10 rounded-[2rem] border-2 border-dashed border-muted-foreground/20">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-full shadow-sm mb-6">
                    <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Chưa có đơn hàng nào</h3>
                <p className="text-muted-foreground mt-2 max-w-md text-center px-4">
                    Danh sách đơn hàng của bạn đang trống. Hãy đặt món ngay để lấp đầy chiếc bụng đói nhé!
                </p>
                <Button asChild className="mt-8 rounded-full bg-orange-600 hover:bg-orange-500 text-white px-8 h-12 shadow-lg shadow-orange-600/20">
                    <Link href="/">Đặt món ngay</Link>
                </Button>
            </div>
        ) : (
            <div className="space-y-6">
                {/* MOBILE CARD VIEW */}
                <div className="space-y-4 md:hidden">
                    {filteredOrders.map((order) => (
                        <Card key={order.id} className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow" onClick={() => router.push(`/orders/${order.id}`)}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground mb-1">MÃ ĐƠN #{order.id}</p>
                                        <p className="text-sm flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(order.createdAt)}</p>
                                    </div>
                                    <UserOrderStatusBadge status={order.status} />
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg mb-4">
                                    <p className="font-medium text-foreground truncate">{order.items[0]?.productName}</p>
                                    {order.items.length > 1 && <p className="text-xs text-muted-foreground mt-1">+ {order.items.length - 1} món khác</p>}
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Tổng tiền</p>
                                        <p className="text-lg font-bold text-orange-600">{formatPrice(order.totalAmount)}</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="secondary" 
                                        className="rounded-full min-w-[90px]" 
                                        onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                                        disabled={reorderingId === order.id}
                                    >
                                        {reorderingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mua lại"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b border-border/60">
                                <TableHead className="w-[100px] font-bold pl-6">Mã đơn</TableHead>
                                <TableHead className="font-bold">Ngày đặt</TableHead>
                                <TableHead className="font-bold">Sản phẩm</TableHead>
                                <TableHead className="font-bold text-center">Tổng tiền</TableHead>
                                <TableHead className="font-bold text-center">Trạng thái</TableHead>
                                <TableHead className="text-right pr-6 font-bold">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/40" onClick={() => router.push(`/orders/${order.id}`)}>
                                    <TableCell className="font-bold text-foreground pl-6">#{order.id}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col max-w-[280px]">
                                            <span className="font-medium text-foreground truncate">{order.items[0]?.productName}</span>
                                            {order.items.length > 1 && <span className="text-xs text-muted-foreground mt-0.5">+ {order.items.length - 1} món khác</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-orange-600">{formatPrice(order.totalAmount)}</TableCell>
                                    <TableCell className="text-center"><UserOrderStatusBadge status={order.status} /></TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="rounded-full hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/30 min-w-[90px]" 
                                                onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                                                disabled={reorderingId === order.id}
                                            >
                                                {reorderingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mua lại"}
                                            </Button>
                                            <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0"><ArrowRight className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-center pt-6">
                        <PaginationControl currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>
        )}
      </FadeIn>
    </div>
  );
}