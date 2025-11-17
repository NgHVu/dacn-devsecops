"use client";

import React, { useState } from "react";
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
import { ShoppingCart, Loader2 } from "lucide-react"; 
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter(); 
  const [isLoading, setIsLoading] = useState(false); 

  if (totalItems === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-24">
        <ShoppingCart className="h-24 w-24 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">Giỏ hàng của bạn đang trống</h1>
        <p className="mt-2 text-muted-foreground">
          Hãy tìm sản phẩm và thêm vào giỏ nhé.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  const handleCheckout = async () => {
    setIsLoading(true);

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thanh toán.");
      
      router.push("/login?redirect=/cart"); 

      setIsLoading(false);
      return;
    }

    const orderData: CreateOrderRequest = {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      await orderService.createOrder(orderData);
      
      toast.success("Đặt hàng thành công!");
      clearCart(); 
      router.push("/orders"); 

    } catch (err) {
      console.error("Lỗi khi tạo đơn hàng:", err);
      if (isAxiosError(err)) {
        if (err.response?.status === 400) {
          toast.error(err.response.data || "Một sản phẩm trong giỏ đã hết hàng.");
        } else {
          toast.error("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
        }
      } else {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Giỏ hàng của bạn</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        
        <div className="lg:col-span-2">
          <div className="flex flex-col">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Tạm tính ({totalItems} sản phẩm)</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Tổng cộng</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleCheckout} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Tiếp tục Thanh toán"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}