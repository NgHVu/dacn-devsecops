"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { type Order, type PageableResponse } from '@/types/order'; 
import { OrderCard } from '@/components/orders/OrderCard';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const myOrdersResponse = await orderService.getMyOrders();
        
        const ordersArray = myOrdersResponse.content;

        const sortedOrders = ordersArray.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setOrders(sortedOrders); 

      } catch (err) {
        console.error("Lỗi khi tải Lịch sử Đơn hàng:", err);
        
        if (isAxiosError(err) && err.response?.status === 401) {
          toast.error("Vui lòng đăng nhập để xem đơn hàng.");
          router.push("/login?redirect=/orders");
          return;
        }
        
        setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại.");
        
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center py-24 text-center text-red-500">
        <AlertTriangle className="h-12 w-12" />
        <p className="mt-4 text-xl font-semibold">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Thử lại
        </Button>
      </div>
    );
  }

  if (!isLoading && !error && orders.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-bold">Bạn chưa có đơn hàng nào</h2>
        <p className="mt-2 text-muted-foreground">
          Tất cả đơn hàng của bạn sẽ xuất hiện tại đây.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Bắt đầu mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Lịch sử Đơn hàng</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}