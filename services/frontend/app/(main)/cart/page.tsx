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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input"; 
import { ShoppingCart, Loader2, ArrowRight, ShieldCheck, Store, TicketPercent, Trash2 } from "lucide-react";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/utils";
import { CartItemSkeleton } from "@/components/skeletons/CartItemSkeleton";
import { FadeIn } from "@/components/animations/FadeIn";

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập", { description: "Bạn cần đăng nhập để tiến hành thanh toán." });
      router.push("/login?redirect=/cart");
      setIsCheckoutLoading(false);
      return;
    }

    const orderData: CreateOrderRequest = {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        note: item.name // Simplification for MVP
      })),
    };

    try {
      await orderService.createOrder(orderData);
      toast.success("Đặt hàng thành công!", { description: "Đang chuyển hướng đến trang đơn hàng..." });
      clearCart();
      router.push("/orders");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
          toast.error("Lỗi đặt hàng", { description: err.response.data?.message });
      } else {
          toast.error("Đã có lỗi xảy ra", { description: "Vui lòng thử lại sau giây lát." });
      }
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  if (isPageLoading || isAuthLoading) {
    return (
      <div className="container py-12 max-w-6xl mx-auto px-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
              {[1,2,3].map(i => <CartItemSkeleton key={i} />)}
          </div>
          <div className="lg:col-span-1"><div className="h-80 bg-muted animate-pulse rounded-xl" /></div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
        <div className="container max-w-6xl mx-auto flex flex-col items-center justify-center py-32 min-h-[80vh] animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="bg-card p-8 rounded-full border border-border shadow-xl relative">
                    <ShoppingCart className="h-20 w-20 text-muted-foreground/50" />
                </div>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Giỏ hàng của bạn đang trống</h2>
            <p className="mt-4 text-muted-foreground text-center max-w-md text-lg">
                Có vẻ như bạn chưa chọn món nào. Hãy dạo một vòng thực đơn và chọn cho mình vài món ngon nhé!
            </p>
            <Button asChild className="mt-10 rounded-full bg-orange-600 hover:bg-orange-500 text-white px-10 h-14 text-lg font-bold shadow-xl shadow-orange-600/25 hover:scale-105 transition-transform" size="lg">
                <Link href="/"><Store className="mr-2 h-5 w-5" /> Xem thực đơn ngay</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto py-10 px-4 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-border/60">
          <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Giỏ hàng</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                  Bạn đang có <span className="font-bold text-orange-600">{totalItems}</span> món trong giỏ
              </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex text-orange-600 hover:text-orange-700 hover:bg-orange-50">
              <Link href="/">Tiếp tục mua hàng <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* --- LEFT: ITEMS LIST --- */}
          <div className="lg:col-span-2 space-y-6">
              <FadeIn>
                <div className="bg-card rounded-[1.5rem] border border-border/60 shadow-sm overflow-hidden px-6 py-2 divide-y divide-border/40">
                    {items.map((item) => (
                        <CartItemRow key={item.uniqueKey} item={item} />
                    ))}
                </div>
                
                {/* Mobile Continue Button */}
                <Button variant="outline" asChild className="w-full mt-6 md:hidden border-orange-200 text-orange-700">
                    <Link href="/">Tiếp tục mua hàng</Link>
                </Button>
              </FadeIn>
          </div>

          {/* --- RIGHT: ORDER SUMMARY (Sticky) --- */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                <FadeIn delay={0.2}>
                    <Card className="border border-border/60 shadow-xl shadow-orange-500/5 bg-card overflow-hidden rounded-2xl">
                        <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">Thông tin thanh toán</CardTitle>
                        </CardHeader>
                        
                        <CardContent className="space-y-6 pt-6">
                            {/* Promo Code */}
                            <div className="flex gap-2">
                                <Input placeholder="Nhập mã giảm giá" className="bg-background focus-visible:ring-orange-500/30" />
                                <Button variant="secondary" size="icon" className="shrink-0 hover:bg-orange-100 hover:text-orange-600 transition-colors">
                                    <TicketPercent className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tạm tính</span>
                                    <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-green-600 font-bold text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">MIỄN PHÍ</span>
                                </div>
                            </div>
                            
                            <Separator className="border-dashed border-border" />
                            
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-foreground">Tổng cộng</span>
                                <div className="text-right">
                                    <span className="text-2xl font-extrabold text-orange-600 block leading-none">{formatPrice(totalPrice)}</span>
                                    <span className="text-[10px] text-muted-foreground mt-1 block">(Đã bao gồm VAT)</span>
                                </div>
                            </div>
                        </CardContent>
                        
                        <CardFooter className="flex flex-col gap-4 pb-6 pt-2 bg-muted/30 border-t border-border/40">
                            <Button 
                                size="lg" 
                                className="w-full h-14 text-lg font-bold shadow-lg shadow-orange-600/20 bg-orange-600 hover:bg-orange-500 hover:scale-[1.02] transition-all"
                                onClick={handleCheckout} 
                                disabled={isCheckoutLoading}
                            >
                                {isCheckoutLoading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</>
                                ) : (
                                    <>Thanh toán ngay <ArrowRight className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                            
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-80">
                                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                <span>Thông tin được bảo mật tuyệt đối 100%</span>
                            </div>
                        </CardFooter>
                    </Card>
                </FadeIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}