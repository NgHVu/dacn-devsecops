"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image"; 
import { orderService } from "@/services/orderService";
import { Order, OrderStatus } from "@/types/order";
import { formatPrice, getImageUrl } from "@/lib/utils"; 
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { 
  PackageSearch, 
  AlertCircle, 
  Search, 
  RotateCcw, 
  User, 
  CalendarClock,
  ShoppingBag,
  ArrowUpDown,
  MapPin,
  Phone,
  CreditCard,
  Receipt,
  Info
} from "lucide-react";

import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import { PaginationControl } from "@/components/ui/PaginationControl";

// --- HELPER FUNCTIONS ---

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hour12: false
  }).format(date);
};

// [FALLBACK] Hàm này chỉ dùng cho các đơn hàng CŨ (khi size bị gộp vào note)
const parseLegacyItemNote = (note?: string | null) => {
  const result: {
    sizeLabel?: string;
    customNote?: string;
  } = {};

  if (!note) return result;

  const parts = note.split("|").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const sizeMatch = part.match(/^(?:size|kích cỡ)\s*:\s*(.+)$/i);
    if (sizeMatch) { 
        result.sizeLabel = sizeMatch[1].trim(); 
        continue; 
    }
    if (part.match(/^topping\s*:/i)) continue;
    const noteMatch = part.match(/^ghi chú\s*:\s*(.+)$/i);
    if (noteMatch) { 
        result.customNote = noteMatch[1].trim(); 
        continue; 
    }
    if (!result.customNote) { result.customNote = part; } 
    else { result.customNote += ". " + part; }
  }
  return result;
};

// --- COMPONENT CHÍNH ---

export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [UPDATED] Thêm state pageMap để nhớ trang của từng tab
  const [currentPage, setCurrentPage] = useState(0);
  const [pageMap, setPageMap] = useState<Record<string, number>>({}); 

  const ROWS_PER_PAGE = 10; 
  const FETCH_SIZE = 1000;  

  type FilterType = OrderStatus | "ALL";
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Order | string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await orderService.getAllOrders(0, FETCH_SIZE);
      setAllOrders(data.content);
      setCurrentPage(0);
      setPageMap({}); // Reset map khi load lại dữ liệu mới
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      setError("Không thể kết nối đến hệ thống đơn hàng.");
      toast.error("Lỗi tải dữ liệu đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    fetchOrders();
    toast.info("Đang cập nhật trạng thái đơn hàng...");
  };

  const handleSort = (key: keyof Order | string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // [NEW] Hàm chuyển trang: Lưu lại trạng thái
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setPageMap((prev) => ({ ...prev, [filter]: page }));
  };

  // [NEW] Hàm chuyển tab: Khôi phục trang cũ
  const handleTabChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    const savedPage = pageMap[newFilter] || 0;
    setCurrentPage(savedPage);
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      if (filter !== "ALL" && order.status !== filter) return false;
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return order.id.toString().includes(q) || 
                 (order.customerName || "").toLowerCase().includes(q) ||
                 `user #${order.userId}`.includes(q) || 
                 order.items.some(i => i.productName.toLowerCase().includes(q));
      }
      return true;
    });
  }, [allOrders, filter, searchQuery]);

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];
    return sorted.sort((a, b) => {
      const { key, direction } = sortConfig;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aValue = a[key as keyof Order] as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bValue = b[key as keyof Order] as any;

      if (key === 'totalAmount') {
         aValue = Number(a.totalAmount);
         bValue = Number(b.totalAmount);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  const totalPages = Math.ceil(sortedOrders.length / ROWS_PER_PAGE);
  const paginatedOrders = sortedOrders.slice(
      currentPage * ROWS_PER_PAGE,
      (currentPage + 1) * ROWS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Đơn hàng</h1>
          <p className="text-muted-foreground">Theo dõi, xử lý và cập nhật trạng thái giao hàng.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleRefresh} className="hover:bg-accent">
            <RotateCcw className="mr-2 h-4 w-4" /> Cập nhật
          </Button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {[
            { key: "ALL", label: "Tất cả" },
            { key: OrderStatus.PENDING, label: "Chờ xử lý" },
            { key: OrderStatus.CONFIRMED, label: "Chuẩn bị" },
            { key: OrderStatus.SHIPPING, label: "Đang giao" },
            { key: OrderStatus.DELIVERED, label: "Hoàn tất" },
            { key: OrderStatus.CANCELLED, label: "Đã hủy" },
        ].map((tab) => {
            const count = tab.key === "ALL" ? allOrders.length : allOrders.filter(o => o.status === tab.key).length;
            return (
                <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key as FilterType)} // [MODIFIED] Sử dụng hàm chuyển tab mới
                    className={`
                        whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border
                        ${filter === tab.key 
                            ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20" 
                            : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"}
                    `}
                >
                    {tab.label} 
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab.key ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>
                        {count}
                    </span>
                </button>
            );
        })}
      </div>

      {/* ORDERS TABLE */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Danh sách đơn
              <Badge variant="secondary" className="text-xs font-normal">
                 Hiển thị {paginatedOrders.length} / {filteredOrders.length} đơn
              </Badge>
            </CardTitle>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm mã đơn, tên khách, món..."
                className="pl-9 bg-background border-input focus-visible:ring-orange-500"
                value={searchQuery}
                onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    // [MODIFIED] Reset trang về 0 khi tìm kiếm và lưu vào map
                    handlePageChange(0); 
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                <TableHead className="w-[100px] pl-6">
                    <Button variant="ghost" onClick={() => handleSort('id')} className="-ml-4 h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground">
                        Mã đơn <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('userId')} className="-ml-4 h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground">
                        Khách hàng <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead className="text-muted-foreground">Chi tiết đơn</TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('createdAt')} className="-ml-4 h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground">
                        Thời gian đặt <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => handleSort('totalAmount')} className="ml-auto h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground">
                        Tổng tiền <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead className="text-center text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="text-right pr-6 text-muted-foreground">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell colSpan={7} className="text-center py-4"><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-60 text-center border-border">
                      <div className="flex flex-col items-center justify-center text-destructive gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={() => fetchOrders()}>Thử lại</Button>
                      </div>
                    </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center border-border">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <PackageSearch className="h-10 w-10 opacity-50" />
                      <p>Không tìm thấy đơn hàng nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="group hover:bg-muted/50 transition-colors border-border cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="pl-6 font-medium text-foreground">#{order.id}</TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${order.customerName || "U"}&background=random`} />
                            <AvatarFallback>{(order.customerName || "U").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                                {order.customerName || `User #${order.userId}`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">ID: {order.userId}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                        <div className="flex flex-col max-w-[200px]">
                            <span className="text-sm text-foreground truncate font-medium">{order.items[0]?.productName}</span>
                            {order.items.length > 1 && (
                                <span className="text-xs text-muted-foreground">+ {order.items.length - 1} món khác</span>
                            )}
                        </div>
                    </TableCell>
                    
                    <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDate(order.createdAt)}
                        </div>
                    </TableCell>
                    
                    <TableCell className="text-right font-bold text-orange-600 tabular-nums">
                      {formatPrice(order.totalAmount)}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </TableCell>

                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <OrderActions order={order} onStatusChanged={fetchOrders} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {!isLoading && !error && filteredOrders.length > 0 && (
            <CardFooter className="border-t border-border bg-muted/40 py-4 flex justify-center">
                 <PaginationControl 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} // [MODIFIED] Sử dụng hàm chuyển trang mới
                 />
            </CardFooter>
        )}
      </Card>

      {/* CHI TIẾT ĐƠN HÀNG (SHEET) */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-2xl w-full p-0 overflow-hidden flex flex-col">
            {selectedOrder && (
                <>
                    <SheetHeader className="p-6 border-b bg-muted/10">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                    Đơn hàng #{selectedOrder.id}
                                    <OrderStatusBadge status={selectedOrder.status as OrderStatus} />
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    Đặt ngày {formatDate(selectedOrder.createdAt)}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">
                            {/* 1. THÔNG TIN MÓN ĂN */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-orange-600" />
                                    Danh sách món ăn
                                </h3>
                                <div className="space-y-4">
                                    {selectedOrder.items.map((item, index) => {
                                        // [FIXED] Ưu tiên lấy từ field chuẩn, nếu không có mới dùng parse (cho đơn cũ)
                                        let displaySize = item.size;
                                        let displayNote = item.note;

                                        // Fallback cho dữ liệu cũ (chưa có cột size)
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

                            {/* 2. THÔNG TIN KHÁCH HÀNG */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <User className="h-5 w-5 text-orange-600" />
                                        Khách hàng
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
                    
                    {/* FOOTER ACTIONS */}
                    <div className="p-4 border-t bg-background flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Đóng</Button>
                        <OrderActions order={selectedOrder} onStatusChanged={() => {
                            fetchOrders();
                            setSelectedOrder(null); 
                        }} />
                    </div>
                </>
            )}
        </SheetContent>
      </Sheet>

    </div>
  );
}