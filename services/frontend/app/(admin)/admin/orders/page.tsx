"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { orderService } from "@/services/orderService";
import { Order, OrderStatus } from "@/types/order";
import { formatPrice } from "@/lib/utils";
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
  PackageSearch, 
  AlertCircle, 
  Search, 
  RotateCcw, 
  User, 
  CalendarClock,
  ShoppingBag,
  Filter,
  ArrowUpDown 
} from "lucide-react";

import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import { PaginationControl } from "@/components/ui/PaginationControl";

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hour12: false
  }).format(date);
};

export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 10; 
  const FETCH_SIZE = 1000;  

  type FilterType = OrderStatus | "ALL";
  const [filter, setFilter] = useState<FilterType>("ALL");

  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      if (filter !== "ALL" && order.status !== filter) return false;
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return order.id.toString().includes(q) || 
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
      let aValue = a[key as keyof Order] as string | number;
      let bValue = b[key as keyof Order] as string | number;

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
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Đơn hàng</h1>
          <p className="text-muted-foreground">
            Theo dõi, xử lý và cập nhật trạng thái giao hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleRefresh} className="hover:bg-accent">
            <RotateCcw className="mr-2 h-4 w-4" />
            Cập nhật
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
            const count = tab.key === "ALL" 
                ? allOrders.length 
                : allOrders.filter(o => o.status === tab.key).length;

            return (
                <button
                    key={tab.key}
                    onClick={() => {
                        setFilter(tab.key as FilterType);
                        setCurrentPage(0);
                    }}
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
                placeholder="Tìm mã đơn, món ăn..."
                className="pl-9 bg-background border-input focus-visible:ring-orange-500"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(0);
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
                    <Button 
                        variant="ghost" 
                        onClick={() => handleSort('id')}
                        className="-ml-4 h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground"
                    >
                        Mã đơn <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                
                <TableHead>
                    <Button 
                        variant="ghost" 
                        onClick={() => handleSort('userId')}
                        className="-ml-4 h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground"
                    >
                        Khách hàng <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                
                <TableHead className="text-muted-foreground">Chi tiết đơn</TableHead>
                
                <TableHead>
                    <Button 
                        variant="ghost" 
                        onClick={() => handleSort('createdAt')}
                        className="-ml-4 h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground"
                    >
                        Thời gian đặt <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                
                <TableHead className="text-right">
                    <Button 
                        variant="ghost" 
                        onClick={() => handleSort('totalAmount')}
                        className="ml-auto h-8 text-xs font-bold hover:text-orange-600 text-muted-foreground"
                    >
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
                    <TableCell className="pl-6"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex flex-col gap-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto rounded-full" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
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
                  <TableRow key={order.id} className="group hover:bg-muted/50 transition-colors border-border">
                    
                    <TableCell className="pl-6 font-medium text-foreground">
                        #{order.id}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=User+${order.userId}&background=random`} />
                            <AvatarFallback>U{order.userId}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">User #{order.userId}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                        <div className="flex flex-col max-w-[200px]">
                            <span className="text-sm text-foreground truncate font-medium">{order.items[0]?.productName}</span>
                            {order.items.length > 1 && (
                                <span className="text-xs text-muted-foreground">
                                    + {order.items.length - 1} món khác
                                </span>
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
                      <OrderStatusBadge status={order.status} />
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <OrderActions 
                        order={order} 
                        onStatusChanged={fetchOrders} 
                      />
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
                    onPageChange={(page) => setCurrentPage(page)} 
                  />
            </CardFooter>
        )}
      </Card>
    </div>
  );
}