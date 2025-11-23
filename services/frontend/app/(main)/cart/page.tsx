"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext"; 
import { orderService } from "@/services/orderService"; 
import { type CreateOrderRequest } from "@/types/order";
import { toast } from "sonner"; 
import { isAxiosError } from "axios"; 
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Loader2, PackageOpen } from "lucide-react"; 
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/utils";
import { CartItemSkeleton } from "@/components/skeletons/CartItemSkeleton"; 

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); 
  const router = useRouter(); 
  
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false); 
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isPageLoading || isAuthLoading) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
             <CartItemSkeleton />
             <CartItemSkeleton />
             <CartItemSkeleton />
          </div>
          <div className="lg:col-span-1">
             <div className="h-64 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl bg-muted/30 mt-8">
        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Giỏ hàng của bạn đang trống</h2>
        <p className="mt-2 text-muted-foreground text-center max-w-md">
          Có vẻ như bạn chưa thêm món nào vào giỏ. Hãy dạo một vòng xem thực đơn nhé!
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thanh toán.");
      router.push("/login?redirect=/cart"); 
      setIsCheckoutLoading(false);
      return;
    }

    const orderData: CreateOrderRequest = {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        // QUAN TRỌNG: Gửi kèm tên đầy đủ (có option) vào trường note (hoặc description)
        // cần đảm bảo DTO ở Backend (CreateOrderRequest) có trường 'note' hoặc tương tự
        // Nếu Backend chưa có, hãy vào types/order.ts thêm 'note?: string' để không bị lỗi TS
        note: item.name 
      })),
    };

    try {
      await orderService.createOrder(orderData);
      
      toast.success("Đặt hàng thành công! Kiểm tra email của bạn nhé.");
      clearCart(); 
      router.push("/orders"); 

    } catch (err) {
      console.error("Lỗi khi tạo đơn hàng:", err);
      if (isAxiosError(err)) {
        if (err.response?.status === 400) {
          toast.error(err.response.data?.message || "Một sản phẩm trong giỏ không hợp lệ.");
        } else {
          toast.error("Lỗi kết nối. Vui lòng thử lại.");
        }
      } else {
        toast.error("Đã xảy ra lỗi không xác định.");
      }
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <ShoppingCart className="h-8 w-8" />
        Giỏ hàng của bạn
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
        
        {/* DANH SÁCH SẢN PHẨM */}
        <div className="lg:col-span-2">
          <div className="flex flex-col space-y-4">
            {items.map((item) => (
              // === [FIX] Dùng uniqueKey làm key ===
              <CartItemRow key={item.uniqueKey} item={item} />
            ))}
          </div>
        </div>

        {/* TỔNG KẾT & THANH TOÁN */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-lg border-muted">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính ({totalItems} món)</span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <Separator />
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold">Tổng cộng</span>
                <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
                    <p className="text-xs text-muted-foreground mt-1">(Đã bao gồm VAT)</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-6 pt-2">
              <Button 
                size="lg" 
                className="w-full text-lg h-12 shadow-md hover:shadow-lg transition-all"
                onClick={handleCheckout} 
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Thanh toán ngay"
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>Thanh toán an toàn & bảo mật.</p>
          </div>
        </div>

      </div>
    </div>
  );
}