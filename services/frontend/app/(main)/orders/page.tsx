"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { type Order, OrderStatus } from "@/types/order";
import { type Product } from "@/types/product"; 
import { UserOrderStatusBadge } from "@/components/orders/UserOrderStatusBadge";
import { formatPrice, getImageUrl } from "@/lib/utils";
import {
  PackageOpen,
  ShoppingBag,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Loader2,
  Receipt,
  User,
  Phone,
  MapPin,
  CreditCard,
  Info,
  ExternalLink,
  Search,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; 
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { OrderTableSkeleton } from "@/components/skeletons/OrderTableSkeleton";
import { FadeIn } from "@/components/animations/FadeIn"; 
import { useCart } from "@/context/CartContext";
import { SIZES } from "@/config/productOptions"; 

// --- HELPER: Parse Note cho đơn hàng cũ ---
const parseLegacyItemNote = (note?: string | null) => {
  const result: { sizeLabel?: string; customNote?: string } = {};
  if (!note) return result;
  const parts = note.split("|").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const sizeMatch = part.match(/^(?:size|kích cỡ)\s*:\s*(.+)$/i);
    if (sizeMatch) { result.sizeLabel = sizeMatch[1].trim(); continue; }
    if (part.match(/^topping\s*:/i)) continue;
    const noteMatch = part.match(/^ghi chú\s*:\s*(.+)$/i);
    if (noteMatch) { result.customNote = noteMatch[1].trim(); continue; }
    if (!result.customNote) result.customNote = part;
    else result.customNote += ". " + part;
  }
  return result;
};

const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(dateString));
};

export default function OrderHistoryPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  
  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(0);
  const [pageMap, setPageMap] = useState<Record<string, number>>({}); // [NEW] Lưu trạng thái trang cho từng tab

  const PAGE_SIZE = 10;
  const FETCH_SIZE = 1000; 
  
  type FilterType = OrderStatus | "ALL";
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState(""); 

  const fetchOrders = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await orderService.getMyOrders(0, FETCH_SIZE); 
        setAllOrders(data.content);
        setCurrentPage(0); // Reset trang hiển thị ban đầu
        setPageMap({}); // Reset toàn bộ bộ nhớ trang khi load lại dữ liệu mới từ server
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
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    fetchOrders();
    toast.info("Đang cập nhật danh sách đơn hàng...");
  };

  // [NEW] Hàm chuyển trang: Vừa set trang hiện tại, vừa lưu vào map của tab đó
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setPageMap((prev) => ({ ...prev, [filter]: page }));
  };

  // [NEW] Hàm chuyển tab: Khôi phục lại trang cũ từ map (nếu có), không thì về 0
  const handleTabChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    const savedPage = pageMap[newFilter] || 0;
    setCurrentPage(savedPage);
  };

  // Logic lọc Client-side
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      if (filter !== "ALL" && order.status !== filter) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesId = order.id.toString().includes(q);
        const matchesProduct = order.items.some(item => item.productName.toLowerCase().includes(q));
        return matchesId || matchesProduct;
      }
      return true;
    });
  }, [allOrders, filter, searchQuery]);

  // Logic phân trang Client-side
  const paginatedOrders = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);

  // Logic Mua lại
  const handleReorder = async (order: Order) => {
    if (reorderingId !== null) return;
    setReorderingId(order.id);
    const toastId = toast.loading("Đang chuẩn bị món ăn...");

    try {
      const promises = order.items.map(async (item) => {
        try {
            const product = await productService.getProductById(Number(item.productId));
            if (!product) return null;
            const sizeConfig = SIZES.find(s => s.name === item.size) || SIZES[0]; 
            return { 
                product, 
                quantity: item.quantity, 
                size: sizeConfig, 
                note: item.note || "" 
            };
        } catch (e) {
            console.warn(`Sản phẩm ID ${item.productId} lỗi:`, e);
            return null;
        }
      });

      const results = await Promise.all(promises);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validItems = results.filter((item) => item !== null) as { product: Product, quantity: number, size: any, note: string }[];

      toast.dismiss(toastId);

      if (validItems.length === 0) {
          toast.error("Các món trong đơn này hiện không còn kinh doanh.");
          return;
      }

      validItems.forEach(({ product, quantity, size, note }) => {
          addToCart(product, quantity, {
              size: size,
              toppings: [],
              note: note
          });
      });

      setSelectedOrder(null);
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
            <div className="h-10 w-full bg-muted rounded-md animate-pulse"/>
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
      <Button onClick={() => fetchOrders()} className="mt-8 bg-orange-600 hover:bg-orange-500 text-white" size="lg">
        <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl min-h-screen">
      <FadeIn>
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
                    <span className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl text-orange-600">
                        <ShoppingBag className="h-7 w-7" />
                    </span>
                    Lịch sử đơn hàng
                </h1>
                <p className="text-muted-foreground mt-2 pl-1">
                    Quản lý và theo dõi các món ngon bạn đã đặt.
                </p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Tìm mã đơn, tên món..." 
                    className="pl-9 bg-background" 
                    value={searchQuery}
                    onChange={(e) => { 
                        setSearchQuery(e.target.value);
                        // Khi tìm kiếm thì reset về trang 0 của tab hiện tại để đảm bảo có kết quả
                        handlePageChange(0); 
                    }}
                  />
               </div>
               <Button variant="outline" size="icon" onClick={handleRefresh} title="Làm mới">
                  <RotateCcw className="h-4 w-4" />
               </Button>
               {allOrders.length > 0 && (
                  <Button asChild variant="default" className="bg-orange-600 hover:bg-orange-500 text-white hidden md:flex">
                      <Link href="/">Mua tiếp <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
               )}
            </div>
        </div>

        {/* FILTER TABS WITH COUNTS */}
        <div className="flex overflow-x-auto pb-2 gap-2 mb-6 no-scrollbar">
            {[
            { key: "ALL", label: "Tất cả" },
            { key: OrderStatus.PENDING, label: "Chờ xử lý" },
            { key: OrderStatus.CONFIRMED, label: "Đã xác nhận" },
            { key: OrderStatus.SHIPPING, label: "Đang giao" },
            { key: OrderStatus.DELIVERED, label: "Hoàn thành" },
            { key: OrderStatus.CANCELLED, label: "Đã hủy" },
            ].map((tab) => {
              const count = tab.key === "ALL" 
                  ? allOrders.length 
                  : allOrders.filter(o => o.status === tab.key).length;

              return (
                <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key as FilterType)} // [MODIFIED] Dùng hàm mới
                    className={`
                        whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2
                        ${filter === tab.key 
                        ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20" 
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"}
                    `}
                >
                    {tab.label}
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === tab.key ? "bg-white/20 text-white" : "bg-muted text-foreground"}`}>
                        {count}
                      </span>
                    )}
                </button>
              );
            })}
        </div>

        {/* CONTENT SECTION */}
        {paginatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-[2rem] border-2 border-dashed border-muted-foreground/20">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-full shadow-sm mb-6">
                    <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Không tìm thấy đơn hàng</h3>
                <p className="text-muted-foreground mt-2 max-w-md text-center px-4">
                    {searchQuery ? `Không có kết quả nào cho "${searchQuery}"` : "Bạn chưa có đơn hàng nào."}
                </p>
                {!searchQuery && (
                  <Button asChild className="mt-8 rounded-full bg-orange-600 hover:bg-orange-500 text-white px-8 h-12 shadow-lg shadow-orange-600/20">
                      <Link href="/">Đặt món ngay</Link>
                  </Button>
                )}
            </div>
        ) : (
            <div className="space-y-6">
                {/* MOBILE CARD VIEW */}
                <div className="space-y-4 md:hidden">
                    {paginatedOrders.map((order) => (
                        <Card key={order.id} className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(order)}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground mb-1">MÃ ĐƠN #{order.id}</p>
                                        <p className="text-sm flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(order.createdAt)}</p>
                                    </div>
                                    <UserOrderStatusBadge status={order.status} />
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg mb-4">
                                    <div className="font-medium text-foreground truncate flex items-center gap-2">
                                        {order.items[0]?.productName}
                                        {order.items[0]?.size && (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">{order.items[0].size}</span>
                                        )}
                                    </div>
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
                            {paginatedOrders.map((order) => (
                                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/40" onClick={() => setSelectedOrder(order)}>
                                    <TableCell className="font-bold text-foreground pl-6">#{order.id}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col max-w-[280px]">
                                            <div className="font-medium text-foreground truncate flex items-center gap-2">
                                                {order.items[0]?.productName}
                                                {order.items[0]?.size && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold border border-orange-200">{order.items[0].size}</span>
                                                )}
                                            </div>
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
                        <PaginationControl 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={handlePageChange} // [MODIFIED] Dùng hàm mới để lưu state
                        />
                    </div>
                )}
            </div>
        )}

        {/* --- SHEET CHI TIẾT ĐƠN HÀNG --- */}
        <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            <SheetContent className="sm:max-w-2xl w-full p-0 overflow-hidden flex flex-col">
                {selectedOrder && (
                    <>
                        <SheetHeader className="p-6 border-b bg-muted/10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                        Đơn hàng #{selectedOrder.id}
                                        <UserOrderStatusBadge status={selectedOrder.status} />
                                    </SheetTitle>
                                    <SheetDescription className="flex items-center gap-2">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        Đặt ngày {formatDate(selectedOrder.createdAt)}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                {/* 1. DANH SÁCH MÓN */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-orange-600" />
                                        Danh sách món ăn
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedOrder.items.map((item, index) => {
                                            // Logic hiển thị Size/Note
                                            let displaySize = item.size;
                                            let displayNote = item.note;
                                            if (!displaySize && displayNote) {
                                                const parsed = parseLegacyItemNote(displayNote);
                                                displaySize = parsed.sizeLabel;
                                                displayNote = parsed.customNote;
                                            }

                                            return (
                                                <div key={index} className="flex gap-4">
                                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                                                        {item.productImage ? (
                                                            <Image src={getImageUrl(item.productImage)} alt={item.productName} fill className="object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No img</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-between py-1">
                                                        <div>
                                                            <h4 className="font-semibold text-sm">{item.productName}</h4>
                                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                                {displaySize && (
                                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                        Size: {displaySize}
                                                                    </span>
                                                                )}
                                                                {displayNote && (
                                                                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10 italic">
                                                                        Note: {displayNote}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end text-sm">
                                                            <p className="text-muted-foreground">x{item.quantity}</p>
                                                            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Tổng tiền</span>
                                        <span className="text-orange-600">{formatPrice(selectedOrder.totalAmount)}</span>
                                    </div>
                                </div>

                                {/* 2. THÔNG TIN GIAO HÀNG */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <User className="h-5 w-5 text-orange-600" />
                                            Thông tin nhận hàng
                                        </h3>
                                        <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
                                            <div className="flex items-start gap-3">
                                                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Người nhận</p>
                                                    <p className="text-muted-foreground">{selectedOrder.customerName || "Khách hàng"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Số điện thoại</p>
                                                    <p className="text-muted-foreground">{selectedOrder.phoneNumber || "---"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Địa chỉ giao</p>
                                                    <p className="text-muted-foreground">{selectedOrder.shippingAddress || "---"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. THANH TOÁN */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-orange-600" />
                                            Thanh toán
                                        </h3>
                                        <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
                                            <div>
                                                <p className="font-medium mb-1">Phương thức</p>
                                                <Badge variant="outline">
                                                    {selectedOrder.paymentMethod?.toUpperCase() === "VNPAY" ? "Ví VNPAY" : "COD (Tiền mặt)"}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="font-medium mb-1">Trạng thái</p>
                                                {selectedOrder.paymentStatus?.toUpperCase() === "PAID" ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Đã thanh toán</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Chưa thanh toán</Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {selectedOrder.note && (
                                            <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-md text-xs text-blue-700 border border-blue-100">
                                                <Info className="h-4 w-4 shrink-0" />
                                                <p><b>Ghi chú chung:</b> {selectedOrder.note}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <SheetFooter className="p-4 border-t bg-background flex sm:justify-between gap-2">
                            <Button variant="outline" asChild className="hidden sm:flex">
                                <Link href={`/orders/${selectedOrder.id}`}>
                                    <ExternalLink className="mr-2 h-4 w-4" /> Xem trang đầy đủ
                                </Link>
                            </Button>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="flex-1 sm:flex-none">Đóng</Button>
                                <Button 
                                    className="bg-orange-600 hover:bg-orange-500 text-white flex-1 sm:flex-none"
                                    onClick={() => handleReorder(selectedOrder)}
                                    disabled={reorderingId === selectedOrder.id}
                                >
                                    {reorderingId === selectedOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mua lại đơn này"}
                                </Button>
                            </div>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
      </FadeIn>
    </div>
  );
}